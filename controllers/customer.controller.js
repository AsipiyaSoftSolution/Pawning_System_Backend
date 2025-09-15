import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { uploadImage } from "../utils/cloudinary.js";
import { getPaginationData } from "../utils/helper.js";

const customerLog = async (idCustomer, date, type, Description, userId) => {
  try {
    const [result] = await pool.query(
      "INSERT INTO customer_log (Customer_idCustomer, Date_Time, Type, Description, User_idUser) VALUES (?, ?, ?, ?, ?)",
      [idCustomer, date, type, Description, userId]
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
      (field) => !req.body.data[field]
    );

    // Validate required fields
    if (missingFields.length > 0) {
      return next(
        errorHandler(
          400,
          `Missing required fields: ${missingFields.join(", ")}`
        )
      );
    }

    // Check for existing customer with same NIC
    const [existingCustomer] = await pool.query(
      "SELECT 1 FROM customer WHERE NIC = ? AND Branch_idBranch = ? LIMIT 1",
      [req.body.data.NIC, req.branchId]
    );

    if (existingCustomer.length > 0) {
      return next(
        errorHandler(
          409, // Server error code for conflict
          "Customer with this NIC already exists in this branch"
        )
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
      customerData
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
                (d) => d.idDocument === doc.idDocument
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
              }
            );

            return docResult.affectedRows > 0
              ? `Document ${doc.Document_Type} uploaded successfully`
              : `Failed to save document info for id ${doc.idDocument}`;
          } catch (error) {
            console.error(`Document upload error:`, error);
            return `Error processing document ${doc.Document_Type}`;
          }
        })
      );
    }

    // Log the creation
    await customerLog(
      result.insertId,
      new Date(),
      "CREATE",
      "Customer created",
      req.userId
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
    const [branches] = await pool.query(
      "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
      [req.companyId]
    );

    if (branches.length === 0) {
      return next(errorHandler(404, "No branches found for this company"));
    }

    // Check if there is a customer with the NIC in any of the branches of this company

    const [customer] = await pool.query(
      "SELECT * FROM customer WHERE NIC = ? AND Branch_idBranch IN (?)",
      [NIC, branches.map((b) => b.idBranch)]
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
      [NIC]
    );

    if (!customerRows || customerRows.length === 0) {
      return next(errorHandler(404, "Customer not found"));
    }

    const customer = customerRows[0];

    // Fetch documents for this customer
    const [customerDocuments] = await pool.query(
      "SELECT * FROM customer_documents WHERE Customer_idCustomer = ?",
      [customer.idCustomer]
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
    console.log("search:", search);

    // If search query is provided, filter customers based on search criteria and get pagination data
    if (search) {
      paginationData = await getPaginationData(
        "SELECT COUNT(*) as total FROM customer WHERE Branch_idBranch = ? AND (First_Name LIKE ? OR NIC LIKE ? OR Mobile_No LIKE ? OR idCustomer LIKE ?)",
        [branchId, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`],
        page,
        limit
      );

      // get customers for the branch with search - Fixed parameter order and MySQL LIMIT syntax
      [customers] = await pool.query(
        "SELECT idCustomer,Full_Name,First_Name,NIC,Address1,Mobile_No,Work_Place,DOB,Status FROM customer WHERE Branch_idBranch = ? AND (First_Name LIKE ? OR NIC LIKE ? OR Mobile_No LIKE ? OR idCustomer LIKE ?) LIMIT ?, ?",
        [
          branchId,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          offset,
          limit,
        ]
      );
    }
    // If no search query is provided, get all customers for the branch and get pagination data
    else {
      // get pagination data
      paginationData = await getPaginationData(
        "SELECT COUNT(*) as total FROM customer WHERE Branch_idBranch = ?",
        [branchId],
        page,
        limit
      );

      // get customers for the branch - Fixed MySQL LIMIT syntax
      [customers] = await pool.query(
        "SELECT idCustomer,First_Name,Full_Name,NIC,Address1,Mobile_No,Work_Place,DOB,Status FROM customer WHERE Branch_idBranch = ? LIMIT ?, ?",
        [branchId, offset, limit]
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

    // Fetch customer all data by the customer Id and the branch Id
    const [customerResult] = await pool.query(
      "SELECT * FROM customer WHERE idCustomer = ? AND Branch_idBranch = ?",
      [customerId, branchId]
    );

    if (customerResult.length === 0) {
      return next(errorHandler(404, "Customer not found"));
    }

    customer = customerResult[0] || {};

    // Then Fetch customer documents
    const [documents] = await pool.query(
      "SELECT * FROM customer_documents WHERE Customer_idCustomer = ?",
      [customerId]
    );

    customer.documents = documents || [];

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
        [updateFields, customerId, req.branchId]
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
              [doc.Document_Type, customerId]
            );
            const secureUrl = await uploadImage(doc.file);
            if (!secureUrl) {
              return `Failed to upload document id ${doc.idDocument}`;
            }
            if (existingDoc.length > 0) {
              // UPDATE the existing document
              const [docResult] = await pool.query(
                "UPDATE customer_documents SET Path = ? WHERE idCustomer_Documents = ?",
                [secureUrl, existingDoc[0].idCustomer_Documents]
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
                }
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
      [customerId]
    );

    // Log the update
    customerLog(
      customerId,
      new Date(),
      "UPDATE",
      "Customer updated",
      req.userId
    );

    res.status(200).json({
      success: true,
      message:
        fileUploadMessages.length > 0
          ? `Customer updated successfully. Document results: ${fileUploadMessages.join(
              " ; "
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
      [documentId, customerId]
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
      [documentId]
    );

    await customerLog(
      customerId,
      new Date(),
      "DELETE",
      `Customer document deleted. Deleted document: ${documentTypeDeleted}`,
      req.userId
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
       ORDER BY STR_TO_DATE(cl.Date_Time, '%Y-%m-%d %H:%i:%s') DESC `,
      [customerId]
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
