import { errorHandler } from "../utils/errorHandler.js";
import { pool, pool2 } from "../utils/db.js";
import { uploadImage } from "../utils/cloudinary.js";
import { getPaginationData, getCompanyBranches } from "../utils/helper.js";
import { parse } from "path";

const customerLog = async (idCustomer, date, type, Description, userId) => {
  try {
    const [result] = await pool.query(
      "INSERT INTO customer_log (Customer_idCustomer, Date_Time, Type, Description, User_idUser) VALUES (?, ?, ?, ?, ?)",
      [idCustomer, date, type, Description, userId],
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to log customer action");
    }

    return;
  } catch (error) {
    console.error("Error in customerLog:", error);
    throw new Error("Failed to log customer action");
  }
};

// NIC edit
export const createCustomer = async (req, res, next) => {
  try {
    const requiredFields = [
      "First_Name",
      "NIC",
      "Address1",
      "Mobile_No",
      "Work_Place",
    ];
    const missingFields = requiredFields.filter(
      (field) => !req.body.data[field],
    );

    // Validate required fields
    if (missingFields.length > 0) {
      return next(
        errorHandler(
          400,
          `Missing required fields: ${missingFields.join(", ")}`,
        ),
      );
    }

    // Check for existing customer with same NIC
    const [existingCustomer] = await pool.query(
      "SELECT 1 FROM customer WHERE NIC = ? AND Branch_idBranch = ? LIMIT 1",
      [req.body.data.NIC, req.branchId],
    );

    if (existingCustomer.length > 0) {
      return next(
        errorHandler(
          409, // Server error code for conflict
          "Customer with this NIC already exists in this branch",
        ),
      );
    }

    // Extract documents and other customer fields
    const { documents, ...customerFields } = req.body.data;

    // Prepare customer data
    const customerData = {
      ...customerFields,
      Branch_idBranch: req.branchId,
      emp_id: req.userId,
    };

    // Insert customer record to the db
    const [result] = await pool.query(
      "INSERT INTO customer SET ?",
      customerData,
    );

    if (!result.insertId) {
      return next(errorHandler(500, "Failed to create customer record"));
    }

    // Process documents
    let fileUploadMessages = [];
    if (Array.isArray(documents) && documents.length > 0) {
      fileUploadMessages = await Promise.all(
        documents.map(async (doc) => {
          try {
            if (!doc.file) {
              return `No file provided for document Type ${doc.Document_Type}`;
            }

            if (
              !req.company_documents?.some(
                (d) => d.idDocument === doc.idDocument,
              )
            ) {
              return `Invalid document type for id ${doc.idDocument}`;
            }

            const secureUrl = await uploadImage(doc.file);
            if (!secureUrl) {
              return `Failed to upload document id ${doc.idDocument}`;
            }

            const [docResult] = await pool.query(
              "INSERT INTO customer_documents SET ?",
              {
                Customer_idCustomer: result.insertId,
                Document_Name: doc.Document_Type,
                Path: secureUrl,
              },
            );

            return docResult.affectedRows > 0
              ? `Document ${doc.Document_Type} uploaded successfully`
              : `Failed to save document info for id ${doc.idDocument}`;
          } catch (error) {
            console.error(`Document upload error:`, error);
            return `Error processing document ${doc.Document_Type}`;
          }
        }),
      );
    }

    // Log the creation
    await customerLog(
      result.insertId,
      new Date(),
      "CREATE",
      "Customer created",
      req.userId,
    );

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Check if there is a customer in the system when user type the NIC in the frontend
export const checkCustomerByNICWhenCreating = async (req, res, next) => {
  try {
    const { NIC } = req.body;
    if (!NIC) {
      return next(errorHandler(400, "NIC is required"));
    }

    // Get all the branches for this company
    const [branches] = await pool2.query(
      "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
      [req.companyId],
    );

    if (branches.length === 0) {
      return next(errorHandler(404, "No branches found for this company"));
    }

    // Check if there is a customer with the NIC in any of the branches of this company

    const [customer] = await pool.query(
      "SELECT * FROM customer WHERE NIC = ? AND Branch_idBranch IN (?)",
      [NIC, branches.map((b) => b.idBranch)],
    );

    if (customer.length > 0) {
      return res.status(200).json({
        message: "Customer found with this NIC in the system",
        success: true,
      });
    }

    res.status(404).json({
      message: "No customer found with this NIC",
      success: false,
    });
  } catch (error) {
    console.error("Error checking customer by NIC:", error);
    next(errorHandler(500, "Internal Server Error"));
  }
};

// Get customer data by NIC if there is a user in the system
// This function is used to get customer data by NIC when user type the NIC in the frontend and check if there is a customer in the system by above function
export const getCustomerDataByNIC = async (req, res, next) => {
  try {
    const NIC = req.params.nic;
    if (!NIC) {
      return next(errorHandler(400, "NIC is required"));
    }

    // Fetch customer by NIC
    const [customerRows] = await pool.query(
      "SELECT * FROM customer WHERE NIC = ?",
      [NIC],
    );

    if (!customerRows || customerRows.length === 0) {
      return next(errorHandler(404, "Customer not found"));
    }

    const customer = customerRows[0];

    // Fetch documents for this customer
    const [customerDocuments] = await pool.query(
      "SELECT * FROM customer_documents WHERE Customer_idCustomer = ?",
      [customer.idCustomer],
    );
    customer.documents = customerDocuments || [];

    res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      customer,
    });
  } catch (error) {
    console.log("Error in getCustomerDataByNIC:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

export const getCustomersForTheBranch = async (req, res, next) => {
  try {
    const branchId = req.branchId; // extract branchId from the request
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    let paginationData;
    let customers;

    // Default to the current branch ID; if user is head branch, fetch all company branch IDs
    let branchIds = [branchId];
    if (req.isHeadBranch) {
      // Get all branch IDs for the company
      const companyBranchIds = await getCompanyBranches(req.companyId);
      if (Array.isArray(companyBranchIds) && companyBranchIds.length > 0) {
        branchIds = companyBranchIds;
      }
    }

    // Use `IN (?)` so it works for single branch or multiple branches
    if (search) {
      paginationData = await getPaginationData(
        "SELECT COUNT(*) as total FROM customer WHERE Branch_idBranch IN (?) AND (First_Name LIKE ? OR NIC LIKE ? OR Mobile_No LIKE ? OR idCustomer LIKE ?)",
        [branchIds, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`],
        page,
        limit,
      );

      // get customers for the branch(es) with search
      [customers] = await pool.query(
        "SELECT idCustomer,Full_Name,First_Name,NIC,Address1,Mobile_No,Work_Place,DOB,Status FROM customer WHERE Branch_idBranch IN (?) AND (First_Name LIKE ? OR NIC LIKE ? OR Mobile_No LIKE ? OR idCustomer LIKE ?) LIMIT ?, ?",
        [
          branchIds,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          offset,
          limit,
        ],
      );
    } else {
      // get pagination data for branch(es)
      paginationData = await getPaginationData(
        "SELECT COUNT(*) as total FROM customer WHERE Branch_idBranch IN (?)",
        [branchIds],
        page,
        limit,
      );

      // get customers for the branch(es)
      [customers] = await pool.query(
        "SELECT idCustomer,First_Name,Full_Name,NIC,Address1,Mobile_No,Work_Place,DOB,Status FROM customer WHERE Branch_idBranch IN (?) LIMIT ?, ?",
        [branchIds, offset, limit],
      );
    }

    res.status(200).json({
      message: "Customers fetched successfully",
      customers,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customerId = req.params.id || req.params.customerId; // extract customerId from the request
    const branchId = req.branchId; // extract branchId from the request

    if (!customerId) {
      return next(errorHandler(400, "Customer ID is required"));
    }

    let customer;
    let customerQuery;
    let customerQueryParams;

    if (req.isHeadBranch === true) {
      customerQuery = "SELECT * FROM customer WHERE idCustomer = ?";
      customerQueryParams = [customerId];
    } else {
      customerQuery =
        "SELECT * FROM customer WHERE idCustomer = ? AND Branch_idBranch = ?";
      customerQueryParams = [customerId, branchId];
    }

    // Fetch customer all data by the customer Id and the branch Id
    const [customerResult] = await pool.query(
      customerQuery,
      customerQueryParams,
    );

    if (customerResult.length === 0) {
      return next(errorHandler(404, "Customer not found"));
    }

    customer = customerResult[0] || {};

    // Then Fetch customer documents
    const [documents] = await pool.query(
      "SELECT * FROM customer_documents WHERE Customer_idCustomer = ?",
      [customerId],
    );

    customer.documents = documents || [];

    // Fetch the branch name and code
    const [branchRows] = await pool2.query(
      " SELECT Name, Branch_Code FROM branch WHERE idBranch = ? ",
      [customer.Branch_idBranch],
    );

    customer.branchInfo = branchRows[0] || {};

    res.status(200).json({
      message: "Customer fetched successfully",
      customer,
    });
  } catch (error) {
    console.error("Error fetching customer by ID:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

export const editCustomer = async (req, res, next) => {
  try {
    const customerId = req.params.id || req.params.customerId;
    if (!customerId) {
      return next(errorHandler(400, "Customer ID is required"));
    }

    // Filter out undefined values and create update object
    const updateFields = {};
    const fields = [
      "Title",
      "First_Name",
      "Full_name",
      "NIC",
      "DOB",
      "Address1",
      "Address2",
      "Address3",
      "Postal_Address01",
      "Postal_Address02",
      "Postal_Address03",
      "Mobile_No",
      "Occupation",
      "Work_Place",
      "Phone_No",
      "Phone_No2",
      "Status",
      "Behaviour_Status",
      "Note",
    ];

    fields.forEach((field) => {
      if (req.body.data[field] !== undefined) {
        updateFields[field] = req.body.data[field];
      }
    });

    // If no fields to update and no documents provided, return an error
    if (Object.keys(updateFields).length === 0 && !req.body.data.documents) {
      return next(errorHandler(400, "No fields to update"));
    }

    // Perform update if there are fields to update
    if (Object.keys(updateFields).length > 0) {
      const [result] = await pool.query(
        "UPDATE customer SET ? WHERE idCustomer = ? AND Branch_idBranch = ?",
        [updateFields, customerId, req.branchId],
      );

      if (result.affectedRows === 0) {
        return next(errorHandler(404, "Customer not found or no changes made"));
      }
    }

    // Handle document uploads
    let fileUploadMessages = [];
    const { documents } = req.body.data;

    if (documents && Array.isArray(documents)) {
      const uploadPromises = documents.map(async (doc) => {
        if (doc.isExisting === false && doc.originalId === undefined) {
          if (!doc.file) {
            return `No file provided for document Type ${doc.Document_Type}`;
          }
          if (
            !req.company_documents.some((d) => d.idDocument === doc.idDocument)
          ) {
            return `Invalid document type for id ${doc.idDocument}`;
          }
          try {
            // Check if the user has an existing document of this type
            const [existingDoc] = await pool.query(
              "SELECT * FROM customer_documents WHERE Document_Name = ? AND Customer_idCustomer = ?",
              [doc.Document_Type, customerId],
            );
            const secureUrl = await uploadImage(doc.file);
            if (!secureUrl) {
              return `Failed to upload document id ${doc.idDocument}`;
            }
            if (existingDoc.length > 0) {
              // UPDATE the existing document
              const [docResult] = await pool.query(
                "UPDATE customer_documents SET Path = ? WHERE idCustomer_Documents = ?",
                [secureUrl, existingDoc[0].idCustomer_Documents],
              );
              return docResult.affectedRows > 0
                ? `Document ${doc.Document_Type} updated successfully`
                : `Failed to update document info for id ${doc.idDocument}`;
            } else {
              // INSERT a new document
              const [docResult] = await pool.query(
                "INSERT INTO customer_documents SET ?",
                {
                  Customer_idCustomer: customerId,
                  Document_Name: doc.Document_Type,
                  Path: secureUrl,
                },
              );
              return docResult.affectedRows > 0
                ? `Document ${doc.Document_Type} uploaded successfully`
                : `Failed to save document info for id ${doc.idDocument}`;
            }
          } catch (error) {
            console.error(`Document upload error:`, error);
            return `Error processing document ${doc.Document_Type}`;
          }
        }
        return null;
      });
      fileUploadMessages = (await Promise.all(uploadPromises)).filter(Boolean);
    }

    // Get updated customer details
    const [updatedCustomerRows] = await pool.query(
      "SELECT idCustomer,First_Name,Full_Name,NIC,Address1,Mobile_No,Work_Place,DOB,Status FROM customer  WHERE idCustomer = ? ",
      [customerId],
    );

    // Log the update
    customerLog(
      customerId,
      new Date(),
      "UPDATE",
      "Customer updated",
      req.userId,
    );

    res.status(200).json({
      success: true,
      message:
        fileUploadMessages.length > 0
          ? `Customer updated successfully. Document results: ${fileUploadMessages.join(
              " ; ",
            )}`
          : "Customer updated successfully.",
      customer: updatedCustomerRows[0] || [],
    });
  } catch (error) {
    console.error("Error editing customer:", error);
    next(errorHandler(500, "Internal Server Error"));
  }
};

export const deleteDocuments = async (req, res, next) => {
  try {
    console.log("Params ", req.params);
    const { customerId, documentId } = req.params;
    console.log("customerId:", customerId, "documentId:", documentId);
    if (!documentId) {
      return next(errorHandler(400, "No document ID provided for deletion"));
    }

    // Find the document that belongs to this customer
    const [existingDocs] = await pool.query(
      `SELECT * FROM customer_documents WHERE idCustomer_Documents = ? AND Customer_idCustomer = ?`,
      [documentId, customerId],
    );

    if (!existingDocs || existingDocs.length === 0) {
      return next(errorHandler(404, "No matching document found for deletion"));
    }

    // Delete from Cloudinary if Path exists
    const { v2: cloudinary } = await import("cloudinary");
    let documentTypeDeleted = null;
    const doc = existingDocs[0];
    if (doc.Path) {
      // Extract public_id from Cloudinary URL
      const matches = doc.Path.match(/\/([^\/]+)\.[a-zA-Z0-9]+$/);
      if (matches && matches[1]) {
        try {
          await cloudinary.uploader.destroy(matches[1]);
        } catch (err) {
          console.warn(`Cloudinary deletion failed for ${doc.Path}:`, err);
        }
      }
    }
    documentTypeDeleted = doc.Document_Name || doc.idCustomer_Documents;

    // Delete from database
    const [deleteResult] = await pool.query(
      `DELETE FROM customer_documents WHERE idCustomer_Documents = ?`,
      [documentId],
    );

    await customerLog(
      customerId,
      new Date(),
      "DELETE",
      `Customer document deleted. Deleted document: ${documentTypeDeleted}`,
      req.userId,
    );

    res.status(200).json({
      success: true,
      message: `Deleted document successfully.`,
      deletedDocument: documentTypeDeleted,
    });
  } catch (error) {
    console.error("Error deleting documents:", error);
    next(errorHandler(500, "Internal Server Error"));
  }
};

// Get customer logs by customer ID
export const getCustomerLogsDataById = async (req, res, next) => {
  try {
    const customerId = req.params.id || req.params.customerId;

    if (!customerId) {
      return next(errorHandler(400, "Customer ID is required"));
    }

    const [logs] = await pool.query(
      `SELECT cl.*, u.full_name 
       FROM customer_log cl
       LEFT JOIN user u ON cl.User_idUser = u.idUser
       WHERE cl.Customer_idCustomer = ?
       ORDER BY STR_TO_DATE(cl.Date_Time, '%Y-%m-%d %H:%i:%s') ASC `,
      [customerId],
    );
    res.status(200).json({
      success: true,
      message: "Customer logs fetched successfully",
      logs,
    });
  } catch (error) {
    console.error("Error fetching customer logs by ID:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Get the customer payment history for their tickets
export const getCustomerPaymentHistory = async (req, res, next) => {
  try {
    const customerId = req.params.id || req.params.customerId;
    const { start_date, end_date } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // validate date range
    if (
      (start_date && isNaN(Date.parse(start_date))) ||
      (end_date && isNaN(Date.parse(end_date)))
    ) {
      return next(errorHandler(400, "Invalid date format. Use YYYY-MM-DD."));
    }

    // validate start date is before end date
    if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
      return next(
        errorHandler(400, "Start date must be before or equal to end date."),
      );
    }

    if (!customerId) {
      return next(errorHandler(400, "Customer ID is required"));
    }

    const [ticketNumbers] = await pool.query(
      "SELECT Ticket_No FROM pawning_ticket WHERE Customer_idCustomer = ?",
      [customerId],
    );
    if (ticketNumbers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No tickets payment found for this customer",
        payments: [],
        pagination: {},
      });
    }

    const ticketNos = ticketNumbers.map((t) => parseInt(t.Ticket_No));

    let countQuery = `SELECT COUNT(*) as count 
      FROM payment p 
      WHERE CAST(p.Ticket_No AS UNSIGNED) IN (?)`;

    let queryParams = [ticketNos];

    let dataQuery = `SELECT p.*, u.full_name AS officer 
      FROM payment p 
      LEFT JOIN user u ON p.User = u.idUser 
      WHERE CAST(p.Ticket_No AS UNSIGNED) IN (?)`;

    let dataQueryParams = [ticketNos];

    if (start_date) {
      countQuery +=
        " AND DATE(STR_TO_DATE(p.Date_Time, '%Y-%m-%d %H:%i:%s')) >= ?";
      queryParams.push(start_date);
      dataQuery +=
        " AND DATE(STR_TO_DATE(p.Date_Time, '%Y-%m-%d %H:%i:%s')) >= ?";
      dataQueryParams.push(start_date);
    }

    if (end_date) {
      countQuery +=
        " AND DATE(STR_TO_DATE(p.Date_Time, '%Y-%m-%d %H:%i:%s')) <= ?";
      queryParams.push(end_date);
      dataQuery +=
        " AND DATE(STR_TO_DATE(p.Date_Time, '%Y-%m-%d %H:%i:%s')) <= ?";
      dataQueryParams.push(end_date);
    }

    if (start_date && end_date) {
      countQuery +=
        " AND DATE(STR_TO_DATE(p.Date_Time, '%Y-%m-%d %H:%i:%s')) BETWEEN ? AND ?";
      queryParams.push(start_date, end_date);
      dataQuery +=
        " AND DATE(STR_TO_DATE(p.Date_Time, '%Y-%m-%d %H:%i:%s')) BETWEEN ? AND ?";
      dataQueryParams.push(start_date, end_date);
    }

    dataQuery += " ORDER BY STR_TO_DATE(p.Date_Time, '%Y-%m-%d %H:%i:%s') DESC"; // if there is no date filter, just get all payments for the tickets

    const paginationData = await getPaginationData(
      countQuery,
      queryParams,
      page,
      limit,
    );

    const [payments] = await pool.query(dataQuery + " LIMIT ? OFFSET ?", [
      ...dataQueryParams,
      limit,
      offset,
    ]);

    res.status(200).json({
      success: true,
      message: "Customer payment history fetched successfully",
      payments: payments || [],
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error fetching customer payment history:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Get the tickets of the customer
export const getCustomerTickets = async (req, res, next) => {
  try {
    const customerId = req.params.id || req.params.customerId;
    if (!customerId) {
      return next(errorHandler(400, "Customer ID is required"));
    }

    const { start_date, end_date, status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // validate date range
    if (
      (start_date && isNaN(Date.parse(start_date))) ||
      (end_date && isNaN(Date.parse(end_date)))
    ) {
      return next(errorHandler(400, "Invalid date format. Use YYYY-MM-DD."));
    }

    // validate start date is before end date
    if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
      return next(
        errorHandler(400, "Start date must be before or equal to end date."),
      );
    }

    // validate status
    const validStatuses = [0, -1, 1, 2, 3, 4];
    // o is null which mean suddeny after create ticket (before approval)
    // -1 after approval but before disbursement
    // 1 disbursed
    // 2 settled
    // 3 overdue
    // 4 rejected
    if (status && !validStatuses.includes(parseInt(status))) {
      return next(
        errorHandler(
          400,
          `Invalid status. Valid statuses are: ${validStatuses.join(", ")}`,
        ),
      );
    }

    let countQuery = `SELECT COUNT(*) as count FROM pawning_ticket WHERE Customer_idCustomer = ?`;
    let queryParams = [customerId];

    let dataQuery = `SELECT idPawning_Ticket,Pawning_Advance_Amount,Ticket_No,SEQ_No,Maturity_date,Status,Period_Type,Period FROM pawning_ticket WHERE Customer_idCustomer = ?`;
    let dataQueryParams = [customerId];

    if (start_date) {
      countQuery += " AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d')) >= ?";
      queryParams.push(start_date);
      dataQuery += " AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d')) >= ?";
      dataQueryParams.push(start_date);
    }

    if (end_date) {
      countQuery += " AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d')) <= ?";
      queryParams.push(end_date);
      dataQuery += " AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d')) <= ?";
      dataQueryParams.push(end_date);
    }

    if (start_date && end_date) {
      countQuery +=
        " AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d')) BETWEEN ? AND ?";
      queryParams.push(start_date, end_date);
      dataQuery +=
        " AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d')) BETWEEN ? AND ?";
      dataQueryParams.push(start_date, end_date);
    }

    if (status !== undefined && status !== null) {
      // If status is 0 (or '0'), match NULL status tickets
      if (parseInt(status) === 0) {
        countQuery += " AND (Status IS NULL OR Status = '0')";
        dataQuery += " AND (Status IS NULL OR Status = '0')";
      } else {
        countQuery += " AND Status = ?";
        queryParams.push(status);
        dataQuery += " AND Status = ?";
        dataQueryParams.push(status);
      }
    }

    dataQuery += " ORDER BY STR_TO_DATE(Date_Time, '%Y-%m-%d') DESC";

    const paginationData = await getPaginationData(
      countQuery,
      queryParams,
      page,
      limit,
    );

    const [tickets] = await pool.query(dataQuery + " LIMIT ? OFFSET ?", [
      ...dataQueryParams,
      limit,
      offset,
    ]);

    res.status(200).json({
      success: true,
      message: "Customer tickets fetched successfully",
      tickets: tickets || [],
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error fetching customer tickets:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Black list a customer from company
export const blacklistCustomer = async (req, res, next) => {
  try {
    const customerId = req.params.id || req.params.customerId;
    const { reason } = req.body;

    if (!customerId) {
      return next(errorHandler(400, "Customer ID is required"));
    }
    if (!reason) {
      return next(errorHandler(400, "Reason for blacklisting is required"));
    }

    // Check if the customer exists
    const [isExitingCustomer] = await pool.query(
      "SELECT Status, NIC, Branch_idBranch FROM customer WHERE idCustomer = ? AND Branch_idBranch = ?",
      [customerId, req.branchId],
    );

    if (isExitingCustomer.length === 0) {
      return next(errorHandler(404, "Customer not found"));
    }

    // check customer is already blacklisted
    if (isExitingCustomer[0].Status === 0) {
      return next(errorHandler(400, "Customer is already blacklisted"));
    }

    // if exist check this customer NIC in all company branches
    const [companyBranches] = await pool.query(
      "SELECT DISTINCT idBranch FROM branch WHERE Company_idCompany = ?",
      [req.companyId],
    );

    if (companyBranches.length === 0) {
      return next(errorHandler(404, "No branches found for this company"));
    }

    // get the branch code of the branch where the customer is being blacklisted
    const [branchData] = await pool.query(
      "SELECT Branch_Code, Name FROM branch WHERE idBranch = ?",
      [req.branchId],
    );

    const blacklistDate = new Date();
    let logsCreated = 0;

    // loop through all branches and update the customer status to 0 (blacklist)
    for (const branch of companyBranches) {
      // Check if this branch has customers with this NIC - get ALL of them
      const [customersInBranch] = await pool.query(
        "SELECT idCustomer FROM customer WHERE NIC = ? AND Branch_idBranch = ?",
        [isExitingCustomer[0].NIC, branch.idBranch],
      );

      // Only update and log if customers exist in this branch
      if (customersInBranch.length > 0) {
        // update status to 0 (blacklist) for ALL customers with this NIC in this branch
        await pool.query(
          "UPDATE customer SET Status = 0, Blacklist_Reason = ?, Blacklist_Date = ? WHERE NIC = ? AND Branch_idBranch = ?",
          [reason, blacklistDate, isExitingCustomer[0].NIC, branch.idBranch],
        );

        // Log ONCE per branch, using the first customer ID found in that branch
        await customerLog(
          customersInBranch[0].idCustomer,
          blacklistDate,
          "BLACKLIST",
          `Customer blacklisted from Company. By Branch: ${branchData[0].Name} | Branch Code: ${branchData[0].Branch_Code} | Reason: ${reason}`,
          req.userId,
        );

        logsCreated++;
      }
    }

    res.status(200).json({
      status: 0,
      reason: reason,
      blacklistDate: blacklistDate,
      success: true,
      message: "Customer blacklisted from company successfully",
    });
  } catch (error) {
    console.error("Error blacklisting customer:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Get all data of the customer by ID (personal data, ticket data, payment history, logs)
export const getCustomerCompleteDataById = async (req, res, next) => {
  try {
    const customerId = req.params.id || req.params.customerId;
    const branchId = req.branchId;

    // Validate customer ID
    if (!customerId) {
      return next(errorHandler(400, "Customer ID is required"));
    }

    //Fetch Customer Basic Data
    const [customerResult] = await pool.query(
      "SELECT * FROM customer WHERE idCustomer = ? AND Branch_idBranch = ?",
      [customerId, branchId],
    );

    if (customerResult.length === 0) {
      return next(errorHandler(404, "Customer not found"));
    }

    const customer = customerResult[0];

    //Fetch Customer Documents
    const [documents] = await pool.query(
      "SELECT * FROM customer_documents WHERE Customer_idCustomer = ?",
      [customerId],
    );

    // Fetch All Customer Tickets including product name and latest comment
    const [tickets] = await pool.query(
      `SELECT 
            pt.idPawning_Ticket,
            pt.Pawning_Advance_Amount,
            pt.Ticket_No,
            pt.SEQ_No,
            pt.Note,
            pt.Maturity_date,
            pt.Status,
            pt.Period_Type,
            pt.Period,
            pt.Date_Time,
            pp.Name AS Product_Name,
            tcl.Comment AS Last_Comment,
            tcl.Date_Time AS Last_Comment_DateTime,
            tcc.Comment_Count
         FROM pawning_ticket pt
         LEFT JOIN pawning_product pp 
                ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product
         LEFT JOIN (
              SELECT tc1.*
              FROM ticket_comment tc1
              INNER JOIN (
                  SELECT Pawning_Ticket_idPawning_Ticket, MAX(idTicket_Comment) AS max_id
                  FROM ticket_comment
                  GROUP BY Pawning_Ticket_idPawning_Ticket
              ) tmax
              ON tc1.Pawning_Ticket_idPawning_Ticket = tmax.Pawning_Ticket_idPawning_Ticket
             AND tc1.idTicket_Comment = tmax.max_id
         ) tcl ON tcl.Pawning_Ticket_idPawning_Ticket = pt.idPawning_Ticket
         LEFT JOIN (
              SELECT Pawning_Ticket_idPawning_Ticket, COUNT(*) AS Comment_Count
              FROM ticket_comment
              GROUP BY Pawning_Ticket_idPawning_Ticket
         ) tcc ON tcc.Pawning_Ticket_idPawning_Ticket = pt.idPawning_Ticket
         WHERE pt.Customer_idCustomer = ?
         ORDER BY STR_TO_DATE(pt.Date_Time, '%Y-%m-%d') DESC`,
      [customerId],
    );

    //  Fetch All Payment History
    let payments = [];

    if (tickets.length > 0) {
      const ticketNos = tickets.map((t) => parseInt(t.Ticket_No));
      const ticketIds = tickets.map((t) => t.idPawning_Ticket);

      const [paymentResults] = await pool.query(
        `SELECT p.*, u.full_name AS officer 
         FROM payment p 
         LEFT JOIN user u ON p.User = u.idUser 
         WHERE CAST(p.Ticket_No AS UNSIGNED) IN (?)
         ORDER BY STR_TO_DATE(p.Date_Time, '%Y-%m-%d %H:%i:%s') DESC`,
        [ticketNos],
      );

      payments = paymentResults;

      // Fetch all comments for these tickets and attach to each ticket
      const [commentsRows] = await pool.query(
        `SELECT tc.*, u.full_name AS userName
           FROM ticket_comment tc
      LEFT JOIN user u ON tc.User_idUser = u.idUser
          WHERE tc.Pawning_Ticket_idPawning_Ticket IN (?)
       ORDER BY tc.idTicket_Comment ASC`,
        [ticketIds],
      );

      // Group comments by ticket id
      const commentsByTicket = new Map();
      for (const row of commentsRows) {
        const tId = row.Pawning_Ticket_idPawning_Ticket;
        if (!commentsByTicket.has(tId)) commentsByTicket.set(tId, []);
        commentsByTicket.get(tId).push({
          idTicket_Comment: row.idTicket_Comment,
          Date_Time: row.Date_Time,
          Comment: row.Comment,
          User_idUser: row.User_idUser,
          userName: row.userName || null,
        });
      }

      // Attach to tickets array
      for (const t of tickets) {
        t.comments = commentsByTicket.get(t.idPawning_Ticket) || [];
      }
    }

    res.status(200).json({
      success: true,
      message: "Customer complete data fetched successfully",
      kycData: {
        customer: {
          ...customer,
          documents: documents || [],
        },

        tickets: tickets || [],
        payments: payments || [],
      },
    });
  } catch (error) {
    console.error("Error fetching customer complete data:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Generate customer number
export const generateCustomerNumber = async (req, res, next) => {
  try {
    const formatComponents = [
      "Branch Number",
      "Auto Create Number",
      "Day",
      "Month",
      "Year",
      "Monthly Count",
      "Branch's Customer Count",
    ];
    let customerNo = "";

    const [customerFormat] = await pool2.query(
      "SELECT * FROM customer_number_formats WHERE company_id = ?",
      [req.companyId],
    );

    if (customerFormat.length === 0) {
      // No format configured, return simple count for the branch
      const [customerCount] = await pool.query(
        "SELECT COUNT(*) AS count FROM customer WHERE Branch_idBranch = ?",
        [req.branchId],
      );

      const customerNo = (customerCount[0].count + 1).toString();

      return res.status(200).json({
        success: true,
        customerNumber: customerNo,
        message: "Customer number generated successfully.",
      });
    }

    // Check if the customer format type is custom format
    if (customerFormat[0].format_type === "Format") {
      const formatString = customerFormat[0].format; // e.g: "Branch Number-Auto Create Number-Year"

      // Split the format string but preserve separators
      const formatPartsWithSeparators = formatString.split(/([-.\/])/);

      for (let i = 0; i < formatPartsWithSeparators.length; i++) {
        const part = formatPartsWithSeparators[i].trim();

        // If it's a separator, add it to customerNo
        if (["-", ".", "/"].includes(part)) {
          customerNo += part;
          continue;
        }

        // Process format components
        if (part === "Branch Number") {
          // Get the branch number
          const [branch] = await pool2.query(
            "SELECT Branch_Code FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
            [req.branchId, req.companyId],
          );

          if (branch.length === 0) {
            return next(errorHandler(404, "Branch not found"));
          }

          customerNo += branch[0].Branch_Code || "00";
        }

        if (part === "Branch's Customer Count") {
          const [customerCount] = await pool.query(
            "SELECT COUNT(*) AS count FROM customer WHERE Branch_idBranch = ?",
            [req.branchId],
          );

          customerNo += (customerCount[0].count + 1)
            .toString()
            .padStart(4, "0");
        }

        if (part === "Auto Create Number") {
          let autoNumber = customerFormat[0].auto_generate_start_from;
          if (autoNumber !== undefined && autoNumber !== null) {
            // Calculate the total customers in the company
            let customerCount = 0;
            // Find all the branches for this specific company
            const [branches] = await pool2.query(
              "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
              [req.companyId],
            );

            if (branches.length === 0) {
              return next(
                errorHandler(404, "No branches found for the company"),
              );
            }

            // Loop through each branch and count customers
            for (const branch of branches) {
              const [branchCustomerCount] = await pool.query(
                "SELECT COUNT(*) AS count FROM customer WHERE Branch_idBranch = ?",
                [branch.idBranch],
              );
              customerCount += branchCustomerCount[0].count;
            }

            autoNumber += customerCount;
            customerNo += autoNumber.toString();
          } else {
            customerNo += "1"; // default auto number
          }
        }

        if (part === "Day") {
          const currentDay = new Date().getDate();
          customerNo += currentDay.toString().padStart(2, "0");
        }

        if (part === "Month") {
          const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11
          customerNo += currentMonth.toString().padStart(2, "0");
        }

        if (part === "Year") {
          const currentYear = new Date().getFullYear();
          customerNo += currentYear.toString();
        }

        if (part === "Monthly Count") {
          // Get count of customers created in current month for this branch
          const currentYear = new Date().getFullYear();
          const currentMonth = new Date().getMonth() + 1;

          const [monthlyCount] = await pool.query(
            `SELECT COUNT(*) AS count FROM customer 
             WHERE Branch_idBranch = ? 
             AND YEAR(STR_TO_DATE(created_at, '%Y-%m-%d %H:%i:%s')) = ? 
             AND MONTH(STR_TO_DATE(created_at, '%Y-%m-%d %H:%i:%s')) = ?`,
            [req.branchId, currentYear, currentMonth],
          );

          customerNo += (monthlyCount[0].count + 1).toString().padStart(4, "0");
        }
      }
    } else {
      // For "Custom Format" type, use simple auto-increment
      let customerCount = 0;
      // Find all the branches for this specific company
      const [branches] = await pool2.query(
        "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
        [req.companyId],
      );

      if (branches.length === 0) {
        return next(errorHandler(404, "No branches found for the company"));
      }

      // Loop through each branch and count customers
      for (const branch of branches) {
        const [branchCustomerCount] = await pool.query(
          "SELECT COUNT(*) AS count FROM customer WHERE Branch_idBranch = ?",
          [branch.idBranch],
        );
        customerCount += branchCustomerCount[0].count;
      }

      customerNo = (customerCount + 1).toString();
    }

    res.status(200).json({
      success: true,
      customerNumber: customerNo,
      message: "Customer number generated successfully.",
    });
  } catch (error) {
    console.error("Error in generateCustomerNumber:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
