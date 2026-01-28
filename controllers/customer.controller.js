import { errorHandler } from "../utils/errorHandler.js";
import { pool, pool2 } from "../utils/db.js";
import { uploadImage } from "../utils/cloudinary.js";
import { getPaginationData, getCompanyBranches } from "../utils/helper.js";
import { accCenterPost } from "../utils/accCenterApi.js";
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

// Helper function to get customer table's configured fields with their isRequired status
async function getCustomerTableFields(companyId) {
  try {
    const [companyCustomerFields] = await pool2.query(
      "SELECT idCompanyCustomerField, CustomerField_idCustomerField, company_id, isRequired FROM company_customer_fields WHERE company_id = ?",
      [companyId],
    );

    const [customerFields] = await pool2.query(
      "SELECT idCustomerField, fieldName FROM customer_fields WHERE status = 1",
    );

    const configuredFields = [];

    for (const field of customerFields) {
      const companyCustomerField = companyCustomerFields.find(
        (companyField) =>
          companyField.CustomerField_idCustomerField === field.idCustomerField,
      );
      if (companyCustomerField) {
        configuredFields.push({
          idCustomerField: field.idCustomerField,
          fieldName: field.fieldName,
          isRequired: companyCustomerField.isRequired === 1,
        });
      }
    }

    return configuredFields;
  } catch (error) {
    console.error("Error getting customer table fields:", error);
    throw error;
  }
}

// Create a new customer
export const createCustomer  = async (req, res, next) => {
  // Get connection from pawning pool only (no direct ACC Center DB access)
  const connection = await pool.getConnection();

  try {
    const { customerData } = req.body;

    // Support both old format (req.body.data) and new format (req.body.customerData)
    const data = customerData || req.body.data;

    if (!data) {
      connection.release();
      return next(errorHandler(400, "Customer data is required"));
    }

    // Extract documents from customer data
    const { documents, ...customerFields } = data;

    // Start transaction for pawning database
    await connection.beginTransaction();

    try {
      // Step 1: INSERT minimal data into pawning customer table
      const [result] = await connection.query(
        `INSERT INTO customer (Branch_idBranch, Customer_Number, created_at) VALUES (?, ?, ?)`,
        [req.branchId, customerFields.cus_number, new Date()],
      );

      const pawningCustomerId = result.insertId;

      if (!pawningCustomerId) {
        throw new Error("Failed to create customer in pawning database");
      }

      // Step 2: Prepare data for ACC Center API
      const accCenterPayload = {
        data: {
          ...customerFields,
          companyId: req.companyId,
          branchId: req.branchId,
          isPawningUserId: pawningCustomerId,
          isMicrofinanceUserId: null,
          isLeasingUserId: null,
          userId: req.userId,
          asipiyaSoftware: "Pawning"
        },
      };

      // Step 3: Call ACC Center API to create customer with all detailed data
      const accCenterResponse = await accCenterPost(
        "/customer/create-customer",
        accCenterPayload,
        req.cookies.accessToken
      );

      // Check if API call was successful
      if (!accCenterResponse.success || !accCenterResponse.customerId) {
        throw new Error(
          accCenterResponse.message || "Failed to create customer in ACC Center"
        );
      }

      const accountCenterCusId = accCenterResponse.customerId;

      // Step 4: Update pawning customer with accountCenterCusId
      await connection.query(
        "UPDATE customer SET accountCenterCusId = ? WHERE idCustomer = ?",
        [accountCenterCusId, pawningCustomerId],
      );

     

      // Commit transaction
      await connection.commit();

      

      res.status(201).json({
        success: true,
        message: "Customer created successfully",
        customerId: pawningCustomerId,
        accountCenterCusId: accountCenterCusId,
      });
    } catch (error) {
      // Rollback transaction on any error (including API failure)
      await connection.rollback();
      console.error("Error in createCustomer transaction:", error);
      
      // The accCenterPost utility already adds status and response to errors
      return next(
        errorHandler(
          error.status || 500,
          error.message || "Failed to create customer"
        )
      );
    }
  } catch (error) {
    console.error("Error creating customer:", error);
    return next(errorHandler(500, error.message || "Internal Server Error"));
  } finally {
    // Always release connection
    connection.release();
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
    const branchId = req.branchId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    // Default to the current branch ID; if user is head branch, fetch all company branch IDs
    let branchIds = [branchId];
    if (req.isHeadBranch) {
      const companyBranchIds = await getCompanyBranches(req.companyId);
      if (Array.isArray(companyBranchIds) && companyBranchIds.length > 0) {
        branchIds = companyBranchIds;
      }
    }

    // Create branch placeholders for queries
    const branchPlaceholders = branchIds.map(() => "?").join(",");

    let paginationData;
    let accountCenterCustomers;

    // Only select essential fields for the customer list
    const selectFields = `idCustomer, isPawningUserId, First_Name, Last_Name, Nic, Contact_No, created_at`;

    // Search in account center (pool2) since customer details are stored there
    if (search) {
      // Count query for pagination - search in account center
      const [countResult] = await pool2.query(
        `SELECT COUNT(*) as total FROM customer 
         WHERE branch_id IN (${branchPlaceholders}) 
         AND isPawningUserId IS NOT NULL
         AND (First_Name LIKE ? OR Nic LIKE ? OR Contact_No LIKE ? OR idCustomer LIKE ?)`,
        [
          ...branchIds,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
        ],
      );

      const total = countResult[0]?.total || 0;
      paginationData = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      // Fetch customers from account center with search (only essential fields)
      [accountCenterCustomers] = await pool2.query(
        `SELECT ${selectFields} FROM customer 
         WHERE branch_id IN (${branchPlaceholders}) 
         AND isPawningUserId IS NOT NULL
         AND (First_Name LIKE ? OR Nic LIKE ? OR Contact_No LIKE ? OR idCustomer LIKE ?)
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [
          ...branchIds,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          limit,
          offset,
        ],
      );
    } else {
      // Count query for pagination - no search
      const [countResult] = await pool2.query(
        `SELECT COUNT(*) as total FROM customer 
         WHERE branch_id IN (${branchPlaceholders}) 
         AND isPawningUserId IS NOT NULL`,
        branchIds,
      );

      const total = countResult[0]?.total || 0;
      paginationData = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      // Fetch customers from account center without search (only essential fields)
      [accountCenterCustomers] = await pool2.query(
        `SELECT ${selectFields} FROM customer 
         WHERE branch_id IN (${branchPlaceholders}) 
         AND isPawningUserId IS NOT NULL
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [...branchIds, limit, offset],
      );
    }

    // Get pawning customer IDs to fetch Customer_Number from pawning DB
    const pawningCustomerIds = accountCenterCustomers
      .map((c) => c.isPawningUserId)
      .filter((id) => id !== null && id !== undefined);

    // Fetch Customer_Number from pawning database
    let customerNumberMap = new Map();
    if (pawningCustomerIds.length > 0) {
      const placeholders = pawningCustomerIds.map(() => "?").join(",");
      const [pawningCustomers] = await pool.query(
        `SELECT idCustomer, Customer_Number FROM customer WHERE idCustomer IN (${placeholders})`,
        pawningCustomerIds,
      );
      customerNumberMap = new Map(
        pawningCustomers.map((c) => [c.idCustomer, c.Customer_Number]),
      );
    }

    // Map account center customer data to response format
    const customers = accountCenterCustomers.map((accCus) => ({
      idCustomer: accCus.isPawningUserId, // Primary ID (pawning customer ID for compatibility)
      accountCenterCusId: accCus.idCustomer,
      First_Name: accCus.First_Name,
      Last_Name: accCus.Last_Name,
      Nic: accCus.Nic,
      Contact_No: accCus.Contact_No,
      Customer_Number: customerNumberMap.get(accCus.isPawningUserId) || null,
    }));

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
    const customerId = req.params.id || req.params.customerId;
    const branchId = req.branchId;

    if (!customerId) {
      return next(errorHandler(400, "Customer ID is required"));
    }

    let pawningCustomerQuery;
    let pawningCustomerQueryParams;

    if (req.isHeadBranch === true) {
      pawningCustomerQuery = "SELECT * FROM customer WHERE idCustomer = ?";
      pawningCustomerQueryParams = [customerId];
    } else {
      pawningCustomerQuery =
        "SELECT * FROM customer WHERE idCustomer = ? AND Branch_idBranch = ?";
      pawningCustomerQueryParams = [customerId, branchId];
    }

    // Fetch pawning customer data
    const [pawningCustomerResult] = await pool.query(
      pawningCustomerQuery,
      pawningCustomerQueryParams,
    );

    if (pawningCustomerResult.length === 0) {
      return next(errorHandler(404, "Customer not found"));
    }

    const pawningCustomer = pawningCustomerResult[0];

    // Fetch account center customer data using accountCenterCusId
    let accountCenterCustomer = null;
    if (pawningCustomer.accountCenterCusId) {
      const [accCenterResult] = await pool2.query(
        "SELECT * FROM customer WHERE idCustomer = ?",
        [pawningCustomer.accountCenterCusId],
      );
      accountCenterCustomer = accCenterResult[0] || null;
    }

    // Fetch customer documents from pawning DB
    const [documents] = await pool.query(
      "SELECT * FROM customer_documents WHERE Customer_idCustomer = ?",
      [customerId],
    );

    // Fetch the branch name and code
    const [branchRows] = await pool2.query(
      "SELECT Name, Branch_Code FROM branch WHERE idBranch = ?",
      [pawningCustomer.Branch_idBranch],
    );

    // Merge data from both databases using spread operator
    const customer = {
      // Spread all account center fields first (if available)
      ...(accountCenterCustomer || {}),
      // Override/add specific fields
      idCustomer: pawningCustomer.idCustomer, // Primary ID (pawning customer ID)
      accountCenterCusId: pawningCustomer.accountCenterCusId,
      // Pawning specific data as nested object
      pawningData: pawningCustomer,
      // Additional data
      documents: documents || [],
      branchInfo: branchRows[0] || {},
    };

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
  // Get connections from both pools for transaction support
  const connection = await pool.getConnection();
  const connection2 = await pool2.getConnection();

  try {
    const customerId = req.params.id || req.params.customerId;
    if (!customerId) {
      connection.release();
      connection2.release();
      return next(errorHandler(400, "Customer ID is required"));
    }

    // Support both old format (req.body.data) and new format (req.body.customerData)
    const data = req.body.customerData || req.body.data;

    if (!data) {
      connection.release();
      connection2.release();
      return next(errorHandler(400, "Customer data is required"));
    }

    // Get pawning customer to verify existence and get accountCenterCusId
    const [pawningCustomerResult] = await connection.query(
      "SELECT idCustomer, accountCenterCusId, Branch_idBranch FROM customer WHERE idCustomer = ? AND Branch_idBranch = ?",
      [customerId, req.branchId],
    );

    if (pawningCustomerResult.length === 0) {
      connection.release();
      connection2.release();
      return next(errorHandler(404, "Customer not found"));
    }

    const pawningCustomer = pawningCustomerResult[0];
    const accountCenterCusId = pawningCustomer.accountCenterCusId;

    // Get configured fields for this company
    const customerTableFields = await getCustomerTableFields(req.companyId);

    // Extract documents from customer data
    const { documents, ...customerFields } = data;

    // Fields to exclude from dynamic update (handled separately or system-managed)
    const excludedFields = [
      "Customer_Group_idCustomer_Group",
      "created_at",
      "updated_at",
      "branch_id",
      "company_id",
      "emp_id",
      "accountCenterCusId",
      "isPawningUserId",
      "cus_number", // Customer number should not be changed
    ];

    // Build dynamic update for account center customer
    const accUpdateFields = {};

    for (const field of customerTableFields) {
      // Skip excluded fields
      if (excludedFields.includes(field.fieldName)) {
        continue;
      }

      if (
        customerFields[field.fieldName] !== undefined &&
        customerFields[field.fieldName] !== null
      ) {
        accUpdateFields[field.fieldName] = customerFields[field.fieldName];
      }
    }

    // If no fields to update and no documents provided, return an error
    if (Object.keys(accUpdateFields).length === 0 && !documents) {
      connection.release();
      connection2.release();
      return next(errorHandler(400, "No fields to update"));
    }

    // Start transactions on both connections
    await connection.beginTransaction();
    await connection2.beginTransaction();

    try {
      // Update pawning customer (only Customer_Number if provided)
      if (customerFields.cus_number !== undefined) {
        await connection.query(
          "UPDATE customer SET Customer_Number = ? WHERE idCustomer = ?",
          [customerFields.cus_number, customerId],
        );
      }

      // Update account center customer if there are fields to update and accountCenterCusId exists
      if (Object.keys(accUpdateFields).length > 0 && accountCenterCusId) {
        const [accResult] = await connection2.query(
          "UPDATE customer SET ? WHERE idCustomer = ?",
          [accUpdateFields, accountCenterCusId],
        );

        if (accResult.affectedRows === 0) {
          throw new Error("Failed to update customer in account center");
        }
      }

      // Log the update (using connection for transaction)
      await connection.query(
        "INSERT INTO customer_log (Customer_idCustomer, Date_Time, Type, Description, User_idUser) VALUES (?, ?, ?, ?, ?)",
        [customerId, new Date(), "UPDATE", "Customer updated", req.userId],
      );

      // Commit both transactions
      await connection.commit();
      await connection2.commit();

      // Handle document uploads (after commit, since document upload is external)
      let fileUploadMessages = [];
      if (documents && Array.isArray(documents)) {
        const uploadPromises = documents.map(async (doc) => {
          if (doc.isExisting === false && doc.originalId === undefined) {
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
        fileUploadMessages = (await Promise.all(uploadPromises)).filter(
          Boolean,
        );
      }

      // Get updated customer details from account center
      let updatedCustomer = null;
      if (accountCenterCusId) {
        const [accCustomerRows] = await pool2.query(
          "SELECT * FROM customer WHERE idCustomer = ?",
          [accountCenterCusId],
        );
        updatedCustomer = accCustomerRows[0] || null;
      }

      res.status(200).json({
        success: true,
        message:
          fileUploadMessages.length > 0
            ? `Customer updated successfully. Document results: ${fileUploadMessages.join(
                " ; ",
              )}`
            : "Customer updated successfully.",
        customer: updatedCustomer
          ? {
              ...updatedCustomer,
              idCustomer: customerId,
              accountCenterCusId: accountCenterCusId,
            }
          : { idCustomer: customerId },
      });
    } catch (error) {
      // Rollback both transactions on error
      await connection.rollback();
      await connection2.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error editing customer:", error);
    next(errorHandler(500, "Internal Server Error"));
  } finally {
    // Always release connections
    connection.release();
    connection2.release();
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
      `SELECT cl.*
       FROM customer_log cl
       WHERE cl.Customer_idCustomer = ?
       ORDER BY STR_TO_DATE(cl.Date_Time, '%Y-%m-%d %H:%i:%s') ASC `,
      [customerId],
    );

    // Fetch user data from pool2
    const userIds = [
      ...new Set(logs.map((l) => l.User_idUser).filter((id) => id)),
    ];
    let userMap = new Map();

    if (userIds.length > 0) {
      const placeholders = userIds.map(() => "?").join(",");
      const [users] = await pool2.query(
        `SELECT idUser, full_name FROM user WHERE idUser IN (${placeholders})`,
        userIds,
      );
      userMap = new Map(users.map((u) => [u.idUser, u.full_name]));
    }

    // Map user names to logs
    const logsWithUserNames = logs.map((l) => ({
      ...l,
      full_name: userMap.get(l.User_idUser) || null,
    }));

    res.status(200).json({
      success: true,
      message: "Customer logs fetched successfully",
      logs: logsWithUserNames,
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

    let dataQuery = `SELECT p.*
      FROM payment p 
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

    const [paymentResults] = await pool.query(dataQuery + " LIMIT ? OFFSET ?", [
      ...dataQueryParams,
      limit,
      offset,
    ]);

    // Fetch user data from pool2 for officer names
    const userIds = [
      ...new Set(paymentResults.map((p) => p.User).filter((id) => id)),
    ];
    let userMap = new Map();

    if (userIds.length > 0) {
      const placeholders = userIds.map(() => "?").join(",");
      const [users] = await pool2.query(
        `SELECT idUser, full_name FROM user WHERE idUser IN (${placeholders})`,
        userIds,
      );
      userMap = new Map(users.map((u) => [u.idUser, u.full_name]));
    }

    // Map officer names to payments
    const payments = paymentResults.map((p) => ({
      ...p,
      officer: userMap.get(p.User) || null,
    }));

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
    const [companyBranches] = await pool2.query(
      "SELECT DISTINCT idBranch FROM branch WHERE Company_idCompany = ?",
      [req.companyId],
    );

    if (companyBranches.length === 0) {
      return next(errorHandler(404, "No branches found for this company"));
    }

    // get the branch code of the branch where the customer is being blacklisted
    const [branchData] = await pool2.query(
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

    // Fetch Pawning Customer Basic Data (contains accountCenterCusId)
    let pawningCustomerQuery;
    let pawningCustomerQueryParams;

    if (req.isHeadBranch === true) {
      pawningCustomerQuery = "SELECT * FROM customer WHERE idCustomer = ?";
      pawningCustomerQueryParams = [customerId];
    } else {
      pawningCustomerQuery =
        "SELECT * FROM customer WHERE idCustomer = ? AND Branch_idBranch = ?";
      pawningCustomerQueryParams = [customerId, branchId];
    }

    const [pawningCustomerResult] = await pool.query(
      pawningCustomerQuery,
      pawningCustomerQueryParams,
    );

    if (pawningCustomerResult.length === 0) {
      return next(errorHandler(404, "Customer not found"));
    }

    const pawningCustomer = pawningCustomerResult[0];

    // Fetch account center customer data using accountCenterCusId
    let accountCenterCustomer = null;
    if (pawningCustomer.accountCenterCusId) {
      const [accCenterResult] = await pool2.query(
        "SELECT * FROM customer WHERE idCustomer = ?",
        [pawningCustomer.accountCenterCusId],
      );
      accountCenterCustomer = accCenterResult[0] || null;
    }

    // Fetch the branch name and code
    const [branchRows] = await pool2.query(
      "SELECT Name, Branch_Code FROM branch WHERE idBranch = ?",
      [pawningCustomer.Branch_idBranch],
    );

    // Merge data from both databases using spread operator
    const customer = {
      // Spread all account center fields first (if available)
      ...(accountCenterCustomer || {}),
      // Override/add specific fields
      idCustomer: pawningCustomer.idCustomer, // Primary ID (pawning customer ID)
      accountCenterCusId: pawningCustomer.accountCenterCusId,
      // Pawning specific data as nested object
      pawningData: pawningCustomer,
      // Additional data
      branchInfo: branchRows[0] || {},
    };

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
        `SELECT p.*
         FROM payment p 
         WHERE CAST(p.Ticket_No AS UNSIGNED) IN (?)
         ORDER BY STR_TO_DATE(p.Date_Time, '%Y-%m-%d %H:%i:%s') DESC`,
        [ticketNos],
      );

      // Fetch all comments for these tickets and attach to each ticket
      const [commentsRows] = await pool.query(
        `SELECT tc.*
           FROM ticket_comment tc
          WHERE tc.Pawning_Ticket_idPawning_Ticket IN (?)
       ORDER BY tc.idTicket_Comment ASC`,
        [ticketIds],
      );

      // Fetch user data from pool2 for both payments and comments
      const userIdsFromPayments = [
        ...new Set(paymentResults.map((p) => p.User).filter((id) => id)),
      ];
      const userIdsFromComments = [
        ...new Set(commentsRows.map((c) => c.User_idUser).filter((id) => id)),
      ];
      const allUserIds = [
        ...new Set([...userIdsFromPayments, ...userIdsFromComments]),
      ];

      let userMap = new Map();
      if (allUserIds.length > 0) {
        const placeholders = allUserIds.map(() => "?").join(",");
        const [users] = await pool2.query(
          `SELECT idUser, full_name FROM user WHERE idUser IN (${placeholders})`,
          allUserIds,
        );
        userMap = new Map(users.map((u) => [u.idUser, u.full_name]));
      }

      // Map user names to payments
      payments = paymentResults.map((p) => ({
        ...p,
        officer: userMap.get(p.User) || null,
      }));

      // Group comments by ticket id and map user names
      const commentsByTicket = new Map();
      for (const row of commentsRows) {
        const tId = row.Pawning_Ticket_idPawning_Ticket;
        if (!commentsByTicket.has(tId)) commentsByTicket.set(tId, []);
        commentsByTicket.get(tId).push({
          idTicket_Comment: row.idTicket_Comment,
          Date_Time: row.Date_Time,
          Comment: row.Comment,
          User_idUser: row.User_idUser,
          userName: userMap.get(row.User_idUser) || null,
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
