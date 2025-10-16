import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";
import { createAccountingAccountLog } from "../utils/accounting.account.logs.js";

// Create a new chart of account
export const createChartAccount = async (req, res, next) => {
  try {
    const {
      code,
      name,
      group,
      type,
      cashFlowType,
      description,
      parentAccountId,
    } = req.body;
    console.log(req.body, "body");

    // Validate required fields
    if (!code || !name || !group || !type) {
      return next(
        errorHandler(
          400,
          "Account Code, Account Name, Group of Type and Type are required"
        )
      );
    }

    // check if there is already an account with the same code in the branch
    const [existingAccount] = await pool.query(
      "SELECT * FROM accounting_accounts WHERE Account_Code = ? AND Branch_idBranch = ? AND Status = 1",
      [code, req.branchId]
    );

    if (existingAccount[0]) {
      return next(
        errorHandler(
          400,
          "An account with the same code already exists in this branch, please use a different code"
        )
      );
    }

    // Insert into database
    const [result] = await pool.query(
      `INSERT INTO accounting_accounts 
      (Account_Code, Account_Name, Account_Type, Cashflow_Type, Description, 
      Account_Balance, Status, Group_Of_Type,Type, Branch_idBranch, User_idUser, Parent_Account) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
      [
        code,
        name,
        "Charted Account",
        cashFlowType,
        description,
        0,
        1,
        group,
        type,
        req.branchId,
        req.userId,
        parentAccountId || null,
      ]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create chart of account"));
    }

    // Get the created account
    const [accountData] = await pool.query(
      "SELECT ac.* , u.full_name AS Created_by, (SELECT Account_Name FROM accounting_accounts WHERE idAccounting_Accounts = ac.Parent_Account) AS Parent_Account_Name FROM accounting_accounts ac LEFT JOIN user u ON ac.User_idUser = u.idUser WHERE ac.idAccounting_Accounts = ?",
      [result.insertId]
    );

    if (!accountData[0]) {
      return next(errorHandler(404, "Created account not found"));
    }

    // Create a log entry for the new account
    await createAccountingAccountLog(accountData[0], req.userId);

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
    // Extract query parameters for filtering
    const { code, name, group, type } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const offset = (page - 1) * limit;
    console.log(req.query, "query");

    // Build the count query with filters
    let countQuery = `SELECT COUNT(*) as count FROM accounting_accounts WHERE Branch_idBranch = ? AND Status = '1'`;
    const countParams = [req.branchId];

    // Add the same filters to count query
    if (code) {
      countQuery += " AND Account_Code LIKE ?";
      countParams.push(`%${code}%`);
    }

    if (name) {
      countQuery += " AND Account_Name LIKE ?";
      countParams.push(`%${name}%`);
    }

    if (group) {
      if (type) {
        countQuery += " AND Group_Of_Type = ? AND Type = ?";
        countParams.push(group, type);
      }

      countQuery += " AND Group_Of_Type = ?";
      countParams.push(group);
    }

    // Execute count query to get total records
    const [countResult] = await pool.query(countQuery, countParams);
    const totalRecords = countResult[0].count;

    // Calculate pagination data
    const totalPages = Math.ceil(totalRecords / limit);
    const paginationData = {
      currentPage: page,
      totalPages: totalPages,
      totalRecords: totalRecords,
      limit: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    // Build the main query with filters
    let query = `SELECT a.*, 
      (SELECT Account_Name FROM accounting_accounts WHERE idAccounting_Accounts = a.Parent_Account) AS Parent_Account_Name,
      (SELECT full_name FROM user WHERE idUser = a.User_idUser) AS Created_by 
      FROM accounting_accounts a 
      WHERE a.Branch_idBranch = ? AND a.Status = '1'`;

    const queryParams = [req.branchId];

    // Add filters if provided
    if (code) {
      query += " AND a.Account_Code LIKE ?";
      queryParams.push(`%${code}%`);
    }

    if (name) {
      query += " AND a.Account_Name LIKE ?";
      queryParams.push(`%${name}%`);
    }

    if (group) {
      if (type) {
        query += " AND a.Group_Of_Type = ? AND a.Type = ?";
        queryParams.push(group, type);
      }
      query += " AND a.Group_Of_Type = ?";
      queryParams.push(group);
    }

    // Add pagination
    query += " LIMIT ? OFFSET ?";
    queryParams.push(limit, offset);

    // Execute the query
    const [accounts] = await pool.query(query, queryParams);

    res.status(200).json({
      message: "Chart of accounts fetched successfully",
      accounts,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error fetching chart of accounts:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Get all chart of accounts for parent account dropdown
export const getParentChartAccounts = async (req, res, next) => {
  try {
    const [accounts] = await pool.query(
      `SELECT idAccounting_Accounts, Account_Name,Account_Code,Type
       FROM accounting_accounts 
       WHERE Branch_idBranch = ? AND Status = 1`,
      [req.branchId]
    );

    res.status(200).json({
      message: "Parent chart of accounts fetched successfully",
      accounts,
    });
  } catch (error) {
    console.error("Error fetching parent chart of accounts:", error);
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
//       group,
//       cashFlowgroup,
//       description,
//       parentAccountId
//     } = req.body;

//     // Validate required fields
//     if (!code || !name || !group) {
//       return next(errorHandler(400, "Account code, name and group are required"));
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
//        SET Account_Code = ?, Account_Name = ?, Account_group = ?,
//        Cashflow_group = ?, Description = ?, Group_Of_group = ?, Parent_Account = ?
//        WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?`,
//       [code, name, group, cashFlowgroup, description, group, parentAccountId || null, id, branchId]
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
