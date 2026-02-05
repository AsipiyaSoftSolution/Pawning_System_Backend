import { errorHandler } from "../utils/errorHandler.js";
import { pool, pool2 } from "../utils/db.js";
import { uploadImage } from "../utils/cloudinary.js";
import { getPaginationData, getCompanyBranches } from "../utils/helper.js";
import { customerApi, approvalApi } from "../api/accountCenterApi.js";
import { parse } from "path";

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

// Helper function to get customer table's configured fields with their isRequired status
async function getCustomerTableFields(companyId) {
  try {
    const [companyCustomerFields] = await pool2.query(
      "SELECT idCompanyCustomerField, CustomerField_idCustomerField, company_id, isRequired FROM company_customer_fields WHERE company_id = ?",
      [companyId]
    );

    const [customerFields] = await pool2.query(
      "SELECT idCustomerField, fieldName FROM customer_fields WHERE status = 1"
    );

    const configuredFields = [];

    for (const field of customerFields) {
      const companyCustomerField = companyCustomerFields.find(
        (companyField) =>
          companyField.CustomerField_idCustomerField === field.idCustomerField
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
export const createCustomer = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const { customerData } = req.body;
    const data = customerData || req.body.data;

    if (!data) {
      connection.release();
      return next(errorHandler(400, "Customer data is required"));
    }

    const { documents, ...customerFields } = data;

    // Step 0: Check if an approval process exists for "CUSTOMER CREATE"
    const accessToken = req.accessToken || req.cookies?.accessToken;
    if (!accessToken) {
      connection.release();
      return next(
        errorHandler(
          401,
          "Authentication token is required for customer creation."
        )
      );
    }

    let hasApprovalProcess = false;
    const approvalCheckParams = {
      companyId: req.companyId.toString(),
      approvalName: "CREATE CUSTOMER",
      asipiyaSoftware: "pawning",
    };

    const fetchApprovalCheck = () =>
      approvalApi.checkApprovalProcess(approvalCheckParams, accessToken);

    try {
      let approvalCheckResponse;
      try {
        approvalCheckResponse = await fetchApprovalCheck();
      } catch (firstError) {
        console.warn(
          "First approval check attempt failed, retrying once:",
          firstError?.message || firstError
        );
        approvalCheckResponse = await fetchApprovalCheck();
      }
      console.log("approvalCheckResponse", approvalCheckResponse);

      if (approvalCheckResponse.success && approvalCheckResponse.data) {
        hasApprovalProcess = true;
      }
    } catch (error) {
      console.warn(
        "Failed to check approval process after retry:",
        error?.message || error
      );
      connection.release();
      return next(
        errorHandler(500, "Failed to determine approval process requirements.")
      );
    }

    // Step 1: Prepare Common Data
    const apiCustomerData = {
      ...customerFields,
      companyId: req.companyId,
      branchId: req.branchId,
      // isPawningUserId will be set based on flow
      isMicrofinanceUserId: null,
      isLeasingUserId: null,
      userId: req.userId,
      asipiyaSoftware: "pawning",
      customerDocuments: documents || data.customerDocuments || [],
      customerOccupations: data.customerOccupations || [],
      customerFamily: data.customerFamily || [],
      customerBankAccounts: data.customerBankAccounts || [],
      Customer_Photo: data.Customer_Photo || null,
    };

    console.log("hasApprovalProcess", hasApprovalProcess);

    // FLOW A: Approval Process Exists -> No Local Creation Yet
    if (hasApprovalProcess) {
      apiCustomerData.isPawningUserId = null;

      const accCenterPayload = { data: apiCustomerData };

      const accCenterResponse = await customerApi.createCustomer(
        accCenterPayload,
        accessToken
      );

      if (!accCenterResponse.success) {
        connection.release();
        throw new Error(
          accCenterResponse.message || "Failed to submit customer for approval"
        );
      }

      connection.release();
      return res.status(201).json({
        success: true,
        message: "Customer creation pending approval",
        customerId: null,
        accountCenterCusId: null,
      });
    }

    // FLOW B: No Approval Process -> Create Local First
    else {
      await connection.beginTransaction();

      try {
        const [result] = await connection.query(
          `INSERT INTO customer (Branch_idBranch, Customer_Number, created_at) VALUES (?, ?, ?)`,
          [req.branchId, customerFields.cus_number, new Date()]
        );

        const pawningCustomerId = result.insertId;
        if (!pawningCustomerId) {
          throw new Error("Failed to create customer in pawning database");
        }

        // Update payload with local ID
        apiCustomerData.isPawningUserId = pawningCustomerId;
        const accCenterPayload = { data: apiCustomerData };

        const accCenterResponse = await customerApi.createCustomer(
          accCenterPayload,
          accessToken
        );

        if (!accCenterResponse.success || !accCenterResponse.customerId) {
          throw new Error(
            accCenterResponse.message ||
              "Failed to create customer in ACC Center"
          );
        }

        const accountCenterCusId = accCenterResponse.customerId;

        // Link local record
        await connection.query(
          "UPDATE customer SET accountCenterCusId = ? WHERE idCustomer = ?",
          [accountCenterCusId, pawningCustomerId]
        );

        await connection.commit();
        connection.release();

        return res.status(201).json({
          success: true,
          message: "Customer created successfully",
          customerId: pawningCustomerId,
          accountCenterCusId: accountCenterCusId,
        });
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    }
  } catch (error) {
    console.error("Error creating customer:", error);
    // Ensure connection is released if logic falls through
    try {
      connection.release();
    } catch (e) {}
    return next(
      errorHandler(
        error.status || 500,
        error.message || "Internal Server Error"
      )
    );
  }
};

/**
 * Create local Pawning customer from approval (called by Account Center when CUSTOMER CREATE is fully approved).
 * Creates minimal customer row and sets accountCenterCusId. Uses data from approval payload (selected fields logic can be applied via data shape).
 */
export const createFromApproval = async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { accountCenterCusId, data } = req.body;
    const branchId = req.params.branchId
      ? Number(req.params.branchId)
      : data?.branchId;
    if (!accountCenterCusId || !branchId) {
      connection.release();
      return next(
        errorHandler(400, "accountCenterCusId and branchId are required")
      );
    }
    const customerNumber =
      data?.cus_number || data?.Customer_Number || data?.customer_number;
    if (!customerNumber) {
      connection.release();
      return next(
        errorHandler(
          400,
          "Customer number (cus_number/Customer_Number) required in data"
        )
      );
    }
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO customer (Branch_idBranch, Customer_Number, created_at) VALUES (?, ?, ?)`,
      [branchId, customerNumber, new Date()]
    );
    const pawningCustomerId = result.insertId;
    if (!pawningCustomerId) {
      await connection.rollback();
      connection.release();
      return next(errorHandler(500, "Failed to create customer in Pawning"));
    }
    await connection.query(
      "UPDATE customer SET accountCenterCusId = ? WHERE idCustomer = ?",
      [accountCenterCusId, pawningCustomerId]
    );
    await connection.commit();
    connection.release();
    return res.status(201).json({
      success: true,
      message: "Customer created from approval",
      customerId: pawningCustomerId,
      accountCenterCusId: Number(accountCenterCusId),
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch (e) {}
    connection.release();
    return next(
      errorHandler(
        error.status || 500,
        error.message || "Internal Server Error"
      )
    );
  }
};

// Check if there is a customer in the system when user type the NIC in the frontend
// Uses Account Center API - customer data is in Account Center
export const checkCustomerByNICWhenCreating = async (req, res, next) => {
  try {
    const { NIC } = req.body;
    if (!NIC) {
      return next(errorHandler(400, "NIC is required"));
    }

    const queryParams = {
      companyId: req.companyId.toString(),
      nic: NIC,
    };

    const accCenterResponse = await customerApi.checkNicExists(
      queryParams,
      req.accessToken || req.cookies?.accessToken
    );

    if (accCenterResponse.exists) {
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

// Check if customer exists for creation (same company/branch check) - for Pawning/Microfinance/Leasing
export const checkCustomerExistsForCreation = async (req, res, next) => {
  try {
    const nic = (req.query.nic || req.body?.NIC || "").trim();
    if (!nic) {
      return next(errorHandler(400, "NIC is required"));
    }
    const accessToken = req.accessToken || req.cookies?.accessToken;
    if (!accessToken) {
      return next(errorHandler(401, "Authentication required"));
    }
    const queryParams = {
      companyId: req.companyId.toString(),
      branchId: req.branchId.toString(),
      nic,
    };
    const accCenterResponse = await customerApi.checkExistsForCreation(
      queryParams,
      accessToken
    );
    return res.status(200).json(accCenterResponse);
  } catch (error) {
    console.error("Error in checkCustomerExistsForCreation:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Get customer data by NIC - uses Account Center API (customer data is in Account Center)
export const getCustomerDataByNIC = async (req, res, next) => {
  try {
    const NIC = req.params.nic;
    if (!NIC) {
      return next(errorHandler(400, "NIC is required"));
    }

    // 1. Find customer by NIC in Account Center
    const findResponse = await customerApi.findCustomerByNic(
      NIC,
      { companyId: req.companyId.toString() },
      req.accessToken || req.cookies?.accessToken
    );

    if (!findResponse.idCompany_Customer) {
      return next(errorHandler(404, "Customer not found"));
    }

    const idCompany_Customer = findResponse.idCompany_Customer;
    const isPawningUserId = findResponse.isPawningUserId;

    // 2. Get full customer data from Account Center
    const accCenterResponse = await customerApi.getCustomer(
      idCompany_Customer,
      { asipiyaSoftware: "pawning", companyId: req.companyId.toString() },
      req.accessToken || req.cookies?.accessToken
    );

    const customer = accCenterResponse.customer || {};
    customer.idCustomer = isPawningUserId ?? idCompany_Customer;

    // 3. Add Pawning-specific documents if customer is linked to Pawning
    if (isPawningUserId) {
      const [customerDocuments] = await pool.query(
        "SELECT * FROM customer_documents WHERE Customer_idCustomer = ?",
        [isPawningUserId]
      );
      customer.documents = customerDocuments || [];
    } else {
      customer.documents = customer.documents || [];
    }

    res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      customer,
    });
  } catch (error) {
    console.log("Error in getCustomerDataByNIC:", error);
    if (error.status === 404) {
      return next(errorHandler(404, "Customer not found"));
    }
    return next(errorHandler(500, "Internal Server Error"));
  }
};

export const getCustomersForTheBranch = async (req, res, next) => {
  try {
    const branchId = req.branchId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    // Default to the current branch ID; if user is head branch, fetch all company branch IDs
    let userBranches = [branchId];
    if (req.isHeadBranch) {
      const companyBranchIds = await getCompanyBranches(req.companyId);
      if (Array.isArray(companyBranchIds) && companyBranchIds.length > 0) {
        userBranches = companyBranchIds;
      }
    }

    // Build query parameters for ACC Center API
    const queryParams = new URLSearchParams({
      branchId: branchId.toString(),
      page: page.toString(),
      limit: limit.toString(),
      search: search,
      isHeadBranch: req.isHeadBranch.toString(),
      asipiyaSoftware: "pawning",
      userBranches: JSON.stringify(userBranches),
    });

    // Call ACC Center API to get customers
    const accCenterResponse = await customerApi.getAllCustomers(
      Object.fromEntries(queryParams),
      req.accessToken || req.cookies?.accessToken
    );

    // Extract customers and pagination from ACC Center response
    const accountCenterCustomers = accCenterResponse.customers || [];
    const paginationData = accCenterResponse.pagination || {
      total: 0,
      page,
      limit,
      totalPages: 0,
    };

    // Get pawning customer IDs to fetch Customer_Number from pawning DB
    const pawningCustomerIds = accountCenterCustomers
      .map((c) => c.idCustomer)
      .filter((id) => id !== null && id !== undefined);

    // Fetch Customer_Number from pawning database
    let customerNumberMap = new Map();
    if (pawningCustomerIds.length > 0) {
      const placeholders = pawningCustomerIds.map(() => "?").join(",");
      const [pawningCustomers] = await pool.query(
        `SELECT idCustomer, Customer_Number FROM customer WHERE idCustomer IN (${placeholders})`,
        pawningCustomerIds
      );
      customerNumberMap = new Map(
        pawningCustomers.map((c) => [c.idCustomer, c.Customer_Number])
      );
    }

    // Map account center customer data to response format with Customer_Number
    const customers = accountCenterCustomers.map((accCus) => ({
      idCustomer: accCus.idCustomer, // Primary ID (pawning customer ID)
      accountCenterCusId: accCus.accountCenterCusId,
      First_Name: accCus.First_Name,
      Last_Name: accCus.Last_Name,
      Nic: accCus.New_NIC || accCus.Old_NIC, // Use New_NIC or fallback to Old_NIC
      Contact_No: accCus.Contact_No,
      Customer_Number: customerNumberMap.get(accCus.idCustomer) || null,
    }));

    res.status(200).json({
      message: "Customers fetched successfully",
      customers,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return next(
      errorHandler(
        error.status || 500,
        error.message || "Internal Server Error"
      )
    );
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customerId = req.params.id || req.params.customerId;
    const userBranches = req.branches || [];

    if (!customerId) {
      return next(errorHandler(400, "Customer ID is required"));
    }

    // Fetch pawning customer by idCustomer (unique). When head branch is selected,
    // the customer list shows customers from all branches, so we cannot filter by
    // the URL branchId alone. Instead, look up by idCustomer and verify the
    // customer's branch is in the user's allowed branches.
    const [customerRows] = await pool.query(
      "SELECT idCustomer, accountCenterCusId, Customer_Number, Branch_idBranch FROM customer WHERE idCustomer = ?",
      [customerId]
    );

    if (customerRows.length === 0) {
      return next(errorHandler(404, "Customer not found"));
    }

    // Ensure user has access to the customer's branch
    const customerBranchId = customerRows[0].Branch_idBranch;
    if (
      userBranches.length > 0 &&
      customerBranchId != null &&
      !userBranches.some((b) => Number(b) === Number(customerBranchId))
    ) {
      return next(errorHandler(403, "Access denied to this customer"));
    }

    const pawningCustomer = customerRows[0];

    // Call ACC Center API to get complete customer data
    let accCenterCustomerData = null;
    if (pawningCustomer.accountCenterCusId) {
      try {
        // Build query parameters for ACC Center API
        const queryParams = {
          asipiyaSoftware: "pawning",
          companyId: req.companyId.toString(),
        };

        // Call ACC Center API's getCustomerById endpoint
        const accCenterResponse = await customerApi.getCustomer(
          pawningCustomer.accountCenterCusId,
          queryParams,
          req.accessToken || req.cookies?.accessToken
        );

        // Extract customer data from ACC Center response
        accCenterCustomerData = accCenterResponse.customer || null;
      } catch (error) {
        console.error("Error fetching customer from ACC Center:", error);
        // Continue without ACC Center data if API call fails
        accCenterCustomerData = null;
      }
    }

    // Fetch customer documents from pawning DB (legacy)
    const [pawningDocuments] = await pool.query(
      "SELECT * FROM customer_documents WHERE Customer_idCustomer = ?",
      [customerId]
    );

    // Prefer Account Center documents (company_customer_documents) when available;
    // fall back to Pawning customer_documents for legacy data
    const documents =
      accCenterCustomerData?.documents?.length > 0
        ? accCenterCustomerData.documents
        : pawningDocuments || [];

    // Fetch branch info for head office view (branch table is in Account Center DB)
    let branchInfo = null;
    if (customerBranchId != null) {
      try {
        const [branchRows] = await pool2.query(
          "SELECT idBranch, Name, Branch_Code FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
          [customerBranchId, req.companyId]
        );
        if (branchRows.length > 0) {
          branchInfo = branchRows[0];
        }
      } catch (err) {
        console.warn("Could not fetch branch info:", err?.message);
      }
    }

    // Merge ACC Center data with pawning-specific data
    const customer = {
      // Spread all account center fields first (if available)
      ...(accCenterCustomerData || {}),
      // Override/add pawning-specific fields
      idCustomer: pawningCustomer.idCustomer, // Primary ID (pawning customer ID)
      accountCenterCusId: pawningCustomer.accountCenterCusId,
      Customer_Number: pawningCustomer.Customer_Number,
      // Add pawning documents
      documents: documents || [],
      // Branch where customer is registered (for head office view)
      branchInfo,
    };

    res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      customer,
    });
  } catch (error) {
    console.error("Error in getCustomerById controller", error);
    return next(
      errorHandler(
        error.status || 500,
        error.message || "Internal Server Error"
      )
    );
  }
};

export const editCustomer = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const customerId = req.params.id || req.params.customerId;
    if (!customerId) {
      connection.release();
      return next(errorHandler(400, "Customer ID is required"));
    }

    // Support both old format (req.body.data) and new format (req.body.customerData)
    const data = req.body.customerData || req.body.data;

    if (!data) {
      connection.release();
      return next(errorHandler(400, "Customer data is required"));
    }

    // Get pawning customer to verify existence and get accountCenterCusId
    const [pawningCustomerResult] = await connection.query(
      "SELECT idCustomer, accountCenterCusId, Branch_idBranch FROM customer WHERE idCustomer = ? AND Branch_idBranch = ?",
      [customerId, req.branchId]
    );

    if (pawningCustomerResult.length === 0) {
      connection.release();
      return next(errorHandler(404, "Customer not found"));
    }

    const pawningCustomer = pawningCustomerResult[0];
    const accountCenterCusId = pawningCustomer.accountCenterCusId;

    if (!accountCenterCusId) {
      connection.release();
      return next(
        errorHandler(
          400,
          "This customer is not linked to the Account Center. Cannot update."
        )
      );
    }

    // Extract documents and other fields
    const { documents, ...customerFields } = data;

    // Start transaction for local updates (Customer_Number)
    await connection.beginTransaction();

    try {
      // Update local pawning customer (only Customer_Number if provided)
      if (customerFields.cus_number !== undefined) {
        await connection.query(
          "UPDATE customer SET Customer_Number = ? WHERE idCustomer = ?",
          [customerFields.cus_number, customerId]
        );
      }

      // Prepare payload for ACC Center API
      // The provided logic expects customerData to contain customerDocuments, customerOccupations, etc.
      // We map the incoming 'documents' (if any) to 'customerDocuments' to match the expected API format

      const apiCustomerData = {
        ...customerFields,
        // Prefer customerDocuments (frontend's merged array with new + existing docs) over
        // documents (raw from form, which can be stale and lacks new uploads).
        customerDocuments: customerFields.customerDocuments ?? documents ?? [],
        customerOccupations: customerFields.customerOccupations || [],
        customerFamily: customerFields.customerFamily || [],
        customerBankAccounts: customerFields.customerBankAccounts || [],
      };

      // Ensure field names match what the API expects (e.g., if frontend sends mapped fields)

      const queryParams = {
        asipiyaSoftware: "pawning",
        companyId: req.companyId.toString(),
      };

      // Call ACC Center API to update customer
      const accCenterResponse = await customerApi.updateCustomer(
        accountCenterCusId,
        queryParams,
        { customerData: apiCustomerData },
        req.accessToken || req.cookies?.accessToken
      );

      // Log the update locally
      await connection.query(
        "INSERT INTO customer_log (Customer_idCustomer, Date_Time, Type, Description, User_idUser) VALUES (?, ?, ?, ?, ?)",
        [
          customerId,
          new Date(),
          "UPDATE",
          "Customer updated via Account Center",
          req.userId,
        ]
      );

      // Commit local transaction
      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Customer updated successfully",
        customer: {
          idCustomer: customerId,
          accountCenterCusId: accountCenterCusId,
          ...apiCustomerData,
        },
      });
    } catch (error) {
      // Rollback local transaction on error (including API failure)
      await connection.rollback();
      throw error; // Re-throw to be caught by outer catch
    }
  } catch (error) {
    console.error("Error editing customer:", error);
    // accCenterPut throws errors with status and response if available
    return next(
      errorHandler(
        error.status || 500,
        error.message || "Internal Server Error"
      )
    );
  } finally {
    // Always release connection
    connection.release();
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
      `SELECT cl.*
       FROM customer_log cl
       WHERE cl.Customer_idCustomer = ?
       ORDER BY STR_TO_DATE(cl.Date_Time, '%Y-%m-%d %H:%i:%s') ASC `,
      [customerId]
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
        userIds
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
        errorHandler(400, "Start date must be before or equal to end date.")
      );
    }

    if (!customerId) {
      return next(errorHandler(400, "Customer ID is required"));
    }

    const [ticketNumbers] = await pool.query(
      "SELECT Ticket_No FROM pawning_ticket WHERE Customer_idCustomer = ?",
      [customerId]
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
      limit
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
        userIds
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
        errorHandler(400, "Start date must be before or equal to end date.")
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
          `Invalid status. Valid statuses are: ${validStatuses.join(", ")}`
        )
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
      limit
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
      [customerId, req.branchId]
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
      [req.companyId]
    );

    if (companyBranches.length === 0) {
      return next(errorHandler(404, "No branches found for this company"));
    }

    // get the branch code of the branch where the customer is being blacklisted
    const [branchData] = await pool2.query(
      "SELECT Branch_Code, Name FROM branch WHERE idBranch = ?",
      [req.branchId]
    );

    const blacklistDate = new Date();
    let logsCreated = 0;

    // loop through all branches and update the customer status to 0 (blacklist)
    for (const branch of companyBranches) {
      // Check if this branch has customers with this NIC - get ALL of them
      const [customersInBranch] = await pool.query(
        "SELECT idCustomer FROM customer WHERE NIC = ? AND Branch_idBranch = ?",
        [isExitingCustomer[0].NIC, branch.idBranch]
      );

      // Only update and log if customers exist in this branch
      if (customersInBranch.length > 0) {
        // update status to 0 (blacklist) for ALL customers with this NIC in this branch
        await pool.query(
          "UPDATE customer SET Status = 0, Blacklist_Reason = ?, Blacklist_Date = ? WHERE NIC = ? AND Branch_idBranch = ?",
          [reason, blacklistDate, isExitingCustomer[0].NIC, branch.idBranch]
        );

        // Log ONCE per branch, using the first customer ID found in that branch
        await customerLog(
          customersInBranch[0].idCustomer,
          blacklistDate,
          "BLACKLIST",
          `Customer blacklisted from Company. By Branch: ${branchData[0].Name} | Branch Code: ${branchData[0].Branch_Code} | Reason: ${reason}`,
          req.userId
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
      [req.companyId]
    );

    if (customerFormat.length === 0) {
      // No format configured, return simple count for the branch
      const [customerCount] = await pool.query(
        "SELECT COUNT(*) AS count FROM customer WHERE Branch_idBranch = ?",
        [req.branchId]
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
            [req.branchId, req.companyId]
          );

          if (branch.length === 0) {
            return next(errorHandler(404, "Branch not found"));
          }

          customerNo += branch[0].Branch_Code || "00";
        }

        if (part === "Branch's Customer Count") {
          const [customerCount] = await pool.query(
            "SELECT COUNT(*) AS count FROM customer WHERE Branch_idBranch = ?",
            [req.branchId]
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
              [req.companyId]
            );

            if (branches.length === 0) {
              return next(
                errorHandler(404, "No branches found for the company")
              );
            }

            // Loop through each branch and count customers
            for (const branch of branches) {
              const [branchCustomerCount] = await pool.query(
                "SELECT COUNT(*) AS count FROM customer WHERE Branch_idBranch = ?",
                [branch.idBranch]
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
            [req.branchId, currentYear, currentMonth]
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
        [req.companyId]
      );

      if (branches.length === 0) {
        return next(errorHandler(404, "No branches found for the company"));
      }

      // Loop through each branch and count customers
      for (const branch of branches) {
        const [branchCustomerCount] = await pool.query(
          "SELECT COUNT(*) AS count FROM customer WHERE Branch_idBranch = ?",
          [branch.idBranch]
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

/**
 * KYC data for Account Center (server-to-server, no auth)
 * Returns customer details and pawning tickets for a given pawning customer ID.
 * Called by Account Center when fetching KYC details for a customer with isPawningUserId.
 *
 * Pawning customer table has only basic fields (idCustomer, Customer_Number, Behaviour_Status, etc.).
 * Full customer data (First_Name, Last_Name, Nic, Contact_No, Email, Address) lives in
 * Account Center company_customer table, linked via accountCenterCusId = idCompany_Customer.
 */
export const getKycDataForAccountCenter = async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    if (!customerId) {
      return next(errorHandler(400, "Customer ID is required"));
    }

    const customerIdNum = parseInt(customerId, 10);
    if (isNaN(customerIdNum)) {
      return next(errorHandler(400, "Invalid customer ID"));
    }

    // 1. Fetch basic data from Pawning customer (only columns that exist)
    const [[pawningRows], [pawningTickets]] = await Promise.all([
      pool.query(
        `SELECT idCustomer, Customer_Number, Behaviour_Status
         FROM customer
         WHERE idCustomer = ?`,
        [customerIdNum]
      ),
      pool.query(
        `SELECT idPawning_Ticket, Ticket_No,Date_Time,Maturity_date
         FROM pawning_ticket
         WHERE Customer_idCustomer = ?
         ORDER BY Date_Time DESC`,
        [customerIdNum]
      ),
    ]);

    const pawningBasic =
      pawningRows && pawningRows.length > 0 ? pawningRows[0] : null;
    const tickets = Array.isArray(pawningTickets) ? pawningTickets : [];

    // Account Center handles full customer data; Pawning API returns only basic fields + tickets
    const pawningCustomer = pawningBasic || null;

    return res.status(200).json({
      success: true,
      pawningCustomer,
      pawningTickets: tickets,
    });
  } catch (error) {
    console.error("Error in getKycDataForAccountCenter:", error);
    return next(errorHandler(500, error.message || "Internal Server Error"));
  }
};
