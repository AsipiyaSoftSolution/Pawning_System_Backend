import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";

// Create a new chart of account
export const createChartAccount = async (req, res, next) => {
  try {
    const { 
      code, 
      name, 
      type, 
      cashFlowType, 
      description,
      parentAccountId
    } = req.body;

    // Validate required fields
    if (!code || !name || !type) {
      return next(errorHandler(400, "Account code, name and type are required"));
    }

    // Default values
    const balance = 0;
    const status = 1;
    
    // Get branch ID - either from request or use the first branch from user's branches
    let branchId;
    if (req.branchId) {
      branchId = req.branchId;
    } else if (req.branches && req.branches.length > 0) {
      branchId = req.branches[0];
    } else {
      return next(errorHandler(400, "No branch associated with user"));
    }
    
    const userId = req.userId; // From auth middleware

    // Insert into database
    const [result] = await pool.query(
      `INSERT INTO accounting_accounts 
      (Account_Code, Account_Name, Account_Type, Cashflow_Type, Description, 
      Account_Balance, Status, Group_Of_Type, Branch_idBranch, User_idUser, Parent_Account) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, name, type, cashFlowType, description, balance, status, type, branchId, userId, parentAccountId || null]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create chart of account"));
    }

    // Get the created account
    const [accountData] = await pool.query(
      "SELECT * FROM accounting_accounts WHERE idAccounting_Accounts = ?",
      [result.insertId]
    );

    if (!accountData[0]) {
      return next(errorHandler(404, "Created account not found"));
    }

    res.status(201).json({
      message: "Chart of account created successfully",
      account: accountData[0],
    });
  } catch (error) {
    console.error("Error creating chart of account:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Get all chart of accounts
export const getAllChartAccounts = async (req, res, next) => {
  try {
    // Get branch ID - either from request or use the first branch from user's branches
    let branchId;
    if (req.branchId) {
      branchId = req.branchId;
    } else if (req.branches && req.branches.length > 0) {
      branchId = req.branches[0];
    } else {
      return next(errorHandler(400, "No branch associated with user"));
    }
    
    // Extract query parameters for filtering
    const { page = 1, limit = 10, code, name, type } = req.query;
    const offset = (page - 1) * limit;
    
    // Build the query with filters - join with user table to get creator's name
    let query = `SELECT a.*, 
      (SELECT Account_Name FROM accounting_accounts WHERE idAccounting_Accounts = a.Parent_Account) AS Parent_Account_Name,
      (SELECT full_name FROM user WHERE idUser = a.User_idUser) AS Created_As 
      FROM accounting_accounts a 
      WHERE a.Branch_idBranch = ? AND a.Status = 1`;
    
    const queryParams = [branchId];
    
    // Add filters if provided
    if (code) {
      query += " AND a.Account_Code LIKE ?";
      queryParams.push(`%${code}%`);
    }
    
    if (name) {
      query += " AND a.Account_Name LIKE ?";
      queryParams.push(`%${name}%`);
    }
    
    if (type) {
      query += " AND a.Account_Type = ?";
      queryParams.push(type);
    }
    
    // Add pagination
    query += " LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), parseInt(offset));
    
    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM accounting_accounts WHERE Branch_idBranch = ? AND Status = 1`;
    const countParams = [branchId];
    
    // Add the same filters to count query
    if (code) {
      countQuery += " AND Account_Code LIKE ?";
      countParams.push(`%${code}%`);
    }
    
    if (name) {
      countQuery += " AND Account_Name LIKE ?";
      countParams.push(`%${name}%`);
    }
    
    if (type) {
      countQuery += " AND Account_Type = ?";
      countParams.push(type);
    }
    
    // Execute the queries
    const [accounts] = await pool.query(query, queryParams);
    const [countResult] = await pool.query(countQuery, countParams);
    
    // Calculate pagination data
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);
    
    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
    };

    if (accounts.length === 0) {
      return res.status(200).json({
        message: "No chart of accounts found",
        accounts: [],
        pagination,
      });
    }

    res.status(200).json({
      message: "Chart of accounts fetched successfully",
      accounts,
      pagination,
    });
  } catch (error) {
    console.error("Error fetching chart of accounts:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Get chart of account by ID
export const getChartAccountById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get branch ID - either from request or use the first branch from user's branches
    let branchId;
    if (req.branchId) {
      branchId = req.branchId;
    } else if (req.branches && req.branches.length > 0) {
      branchId = req.branches[0];
    } else {
      return next(errorHandler(400, "No branch associated with user"));
    }

    // Get account by ID with parent account information and creator's name
    const [account] = await pool.query(
      `SELECT a.*, 
       (SELECT Account_Name FROM accounting_accounts WHERE idAccounting_Accounts = a.Parent_Account) AS Parent_Account_Name,
       (SELECT full_name FROM user WHERE idUser = a.User_idUser) AS Created_As 
       FROM accounting_accounts a 
       WHERE a.idAccounting_Accounts = ? AND a.Branch_idBranch = ? AND a.Status = 1`,
      [id, branchId]
    );

    if (!account[0]) {
      return next(errorHandler(404, "Chart of account not found"));
    }

    res.status(200).json({
      message: "Chart of account fetched successfully",
      account: account[0],
    });
  } catch (error) {
    console.error("Error fetching chart of account:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// // Update chart of account
// export const updateChartAccount = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { 
//       code, 
//       name, 
//       type, 
//       cashFlowType, 
//       description,
//       parentAccountId 
//     } = req.body;

//     // Validate required fields
//     if (!code || !name || !type) {
//       return next(errorHandler(400, "Account code, name and type are required"));
//     }

//     // Get branch ID - either from request or use the first branch from user's branches
//     let branchId;
//     if (req.branchId) {
//       branchId = req.branchId;
//     } else if (req.branches && req.branches.length > 0) {
//       branchId = req.branches[0];
//     } else {
//       return next(errorHandler(400, "No branch associated with user"));
//     }

//     // Check if account exists
//     const [existingAccount] = await pool.query(
//       "SELECT * FROM accounting_accounts WHERE idAccounting_Accounts = ? AND Branch_idBranch = ? AND Status = 1",
//       [id, branchId]
//     );

//     if (!existingAccount[0]) {
//       return next(errorHandler(404, "Chart of account not found"));
//     }

//     // Update account
//     const [result] = await pool.query(
//       `UPDATE accounting_accounts 
//        SET Account_Code = ?, Account_Name = ?, Account_Type = ?, 
//        Cashflow_Type = ?, Description = ?, Group_Of_Type = ?, Parent_Account = ? 
//        WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?`,
//       [code, name, type, cashFlowType, description, type, parentAccountId || null, id, branchId]
//     );

//     if (result.affectedRows === 0) {
//       return next(errorHandler(500, "Failed to update chart of account"));
//     }

//     // Get the updated account
//     const [accountData] = await pool.query(
//       `SELECT a.*, 
//        (SELECT Account_Name FROM accounting_accounts WHERE idAccounting_Accounts = a.Parent_Account) AS Parent_Account_Name 
//        FROM accounting_accounts a 
//        WHERE a.idAccounting_Accounts = ? AND a.Branch_idBranch = ? AND a.Status = 1`,
//       [id, branchId]
//     );

//     res.status(200).json({
//       message: "Chart of account updated successfully",
//       account: accountData[0],
//     });
//   } catch (error) {
//     console.error("Error updating chart of account:", error);
//     return next(errorHandler(500, "Internal Server Error"));
//   }
// };

// // Delete chart of account (soft delete)
// export const deleteChartAccount = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     // Get branch ID - either from request or use the first branch from user's branches
//     let branchId;
//     if (req.branchId) {
//       branchId = req.branchId;
//     } else if (req.branches && req.branches.length > 0) {
//       branchId = req.branches[0];
//     } else {
//       return next(errorHandler(400, "No branch associated with user"));
//     }

//     // Check if account exists
//     const [existingAccount] = await pool.query(
//       "SELECT * FROM accounting_accounts WHERE idAccounting_Accounts = ? AND Branch_idBranch = ? AND Status = 1",
//       [id, branchId]
//     );

//     if (!existingAccount[0]) {
//       return next(errorHandler(404, "Chart of account not found"));
//     }

//     // Check if account is used as a parent account
//     const [childAccounts] = await pool.query(
//       "SELECT COUNT(*) as count FROM accounting_accounts WHERE Parent_Account = ? AND Status = 1",
//       [id]
//     );

//     if (childAccounts[0].count > 0) {
//       return next(errorHandler(400, "Cannot delete account that is used as a parent account"));
//     }

//     // Soft delete by setting Status = 0
//     const [result] = await pool.query(
//       "UPDATE accounting_accounts SET Status = 0 WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?",
//       [id, branchId]
//     );

//     if (result.affectedRows === 0) {
//       return next(errorHandler(500, "Failed to delete chart of account"));
//     }

//     res.status(200).json({
//       message: "Chart of account deleted successfully",
//     });
//   } catch (error) {
//     console.error("Error deleting chart of account:", error);
//     return next(errorHandler(500, "Internal Server Error"));
//   }
// };