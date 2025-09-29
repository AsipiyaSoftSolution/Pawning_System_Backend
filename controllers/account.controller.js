import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";
import {
  addAccountCreateLog,
  addAccountTransferLogs,
} from "../utils/accounting.account.logs.js";

// Create a new account
export const createAccount = async (req, res, next) => {
  try {
    const { accountType, accountName, accountCode, accountNo, note } = req.body;
    if (!accountType || !accountName || !accountCode) {
      return next(
        errorHandler(400, "Account type, name and code are required")
      );
    }

    if (accountType === "Bank Account") {
      if (!accountNo) {
        return next(
          errorHandler(400, "Account number is required for bank accounts")
        );
      }
    }

    // check if the account code already exists
    const [existingAccount] = await pool.query(
      "SELECT 1 FROM accounting_accounts WHERE Account_Code = ?",
      [accountCode]
    );
    if (existingAccount.length > 0) {
      return next(errorHandler(400, "Account code already exists"));
    }

    const [result] = await pool.query(
      "INSERT INTO  accounting_accounts(Account_Type,Account_Name,Account_Code,Account_Number,Group_Of_Type,Type,Note,User_idUser,Status,Branch_idBranch,Account_Balance) VALUES(?,?,?,?,?,?,?,?,?,?,0)",
      [
        accountType,
        accountName,
        accountCode,
        accountType === "Bank Account" ? accountNo : accountCode,
        accountType === "Bank Account" ? "Bank" : "Cash",
        accountType === "Bank Account" ? "Bank" : "Cash",
        note || null,
        req.userId,
        "1",
        req.branchId,
      ]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create account"));
    }

    const [createdAccount] = await pool.query(
      "SELECT u.full_name AS Created_By, aa.idAccounting_Accounts ,aa.Account_Type, aa.Account_Name, aa.Account_Code, aa.Account_Balance, aa.Note  FROM accounting_accounts aa JOIN user u ON aa.User_idUser = u.idUser WHERE aa.idAccounting_Accounts = ?",
      [result.insertId]
    );

    // create a log entry for the new account creation
    await addAccountCreateLog(
      createdAccount[0].idAccounting_Accounts,
      `Account Creation - ${accountType}`,
      `Account ${accountName} with code ${accountCode}`,
      0,
      0,
      0,
      null,
      req.userId
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      account: createdAccount[0],
    });
  } catch (error) {
    console.error("Create account error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// get account log for a specific account by account id
export const getAccountLogById = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { start_date, end_date } = req.query;
    const accountId = req.params.accountId || req.params.id;

    if (!accountId) {
      return next(errorHandler(400, "Account ID is required"));
    }

    // Validate accountId
    const accountIdNum = parseInt(accountId);
    if (isNaN(accountIdNum) || accountIdNum <= 0) {
      return next(errorHandler(400, "Invalid account ID"));
    }

    // Validate pagination parameters
    if (page <= 0 || limit <= 0 || limit > 100) {
      return next(errorHandler(400, "Invalid pagination parameters"));
    }

    // Build dynamic WHERE conditions for date filtering
    let whereCondition = "aal.Accounting_Accounts_idAccounting_Accounts = ?";
    let countWhereCondition = "Accounting_Accounts_idAccounting_Accounts = ?";
    let queryParams = [accountIdNum];
    let countParams = [accountIdNum];

    // Handle date filtering
    if (start_date && end_date) {
      // if both start and end dates are provided
      // Validate date formats
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
        return next(errorHandler(400, "Invalid date format. Use YYYY-MM-DD"));
      }

      // Validate date range
      if (new Date(start_date) > new Date(end_date)) {
        return next(errorHandler(400, "start_date cannot be after end_date"));
      }

      whereCondition +=
        " AND DATE(STR_TO_DATE(aal.Date_Time, '%Y-%m-%d %H:%i:%s')) BETWEEN ? AND ?";
      countWhereCondition +=
        " AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d %H:%i:%s')) BETWEEN ? AND ?";
      queryParams.push(start_date, end_date);
      countParams.push(start_date, end_date);
    } else if (start_date) {
      // if only start date provided
      // Get records from start date onwards
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(start_date)) {
        return next(
          errorHandler(400, "Invalid start_date format. Use YYYY-MM-DD")
        );
      }

      whereCondition +=
        " AND DATE(STR_TO_DATE(aal.Date_Time, '%Y-%m-%d %H:%i:%s')) >= ?";
      countWhereCondition +=
        " AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d %H:%i:%s')) >= ?";
      queryParams.push(start_date);
      countParams.push(start_date);
    } else if (end_date) {
      // if only end date provided
      // Get records up to end date
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(end_date)) {
        return next(
          errorHandler(400, "Invalid end_date format. Use YYYY-MM-DD")
        );
      }

      whereCondition +=
        " AND DATE(STR_TO_DATE(aal.Date_Time, '%Y-%m-%d %H:%i:%s')) <= ?";
      countWhereCondition +=
        " AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d %H:%i:%s')) <= ?";
      queryParams.push(end_date);
      countParams.push(end_date);
    }

    // When no dates are provided, no additional WHERE conditions are added let variables (whereCondition and countWhereCondition) remain as is

    // Get pagination data
    const paginationData = await getPaginationData(
      `SELECT COUNT(*) as total FROM accounting_accounts_log WHERE ${countWhereCondition}`,
      countParams,
      page,
      limit
    );

    // Add pagination parameters to existing query params
    queryParams.push(limit, offset);

    // Get logs data
    const [logs] = await pool.query(
      `SELECT aal.*, u.full_name AS Processed_By 
       FROM accounting_accounts_log aal 
       JOIN user u ON aal.User_idUser = u.idUser 
       WHERE ${whereCondition} 
       ORDER BY STR_TO_DATE(aal.Date_Time, '%Y-%m-%d %H:%i:%s') DESC 
       LIMIT ? OFFSET ?`,
      queryParams
    );

    res.status(200).json({
      success: true,
      message: "Account logs retrieved successfully",
      pagination: paginationData,
      logs,
    });
  } catch (error) {
    console.error("Get account log error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// get all accounts for the branch
export const getAccountsForBranch = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page <= 0 || limit <= 0 || limit > 100) {
      return next(errorHandler(400, "Invalid pagination parameters"));
    }

    // Get pagination data
    const paginationData = await getPaginationData(
      "SELECT COUNT(*) as total FROM accounting_accounts WHERE Branch_idBranch = ?",
      [req.branchId],
      page,
      limit
    );

    // Get accounts data
    const [accounts] = await pool.query(
      `SELECT  aa.idAccounting_Accounts,aa.Account_Type,aa.Account_Number, aa.Account_Name, aa.Account_Code, aa.Account_Balance, aa.Note , u.full_name AS Created_By 
             FROM accounting_accounts aa 
             JOIN user u ON aa.User_idUser = u.idUser 
             WHERE aa.Branch_idBranch = ? 
             ORDER BY aa.Account_Name ASC 
             LIMIT ? OFFSET ?`,
      [req.branchId, limit, offset]
    );

    res.status(200).json({
      success: true,
      message: "Accounts retrieved successfully",
      pagination: paginationData,
      accounts,
    });
  } catch (error) {
    console.error("Get accounts for branch error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// get accounts data for transfer dropdown select
export const getAccountsForTransfer = async (req, res, next) => {
  try {
    const [accounts] = await pool.query(
      `SELECT idAccounting_Accounts, Account_Name, Account_Code, Account_Balance,Account_Type
             FROM accounting_accounts 
             WHERE Branch_idBranch = ? AND Status = '1'
             ORDER BY Account_Name ASC`,
      [req.branchId]
    );

    res.status(200).json({
      success: true,
      message: "Accounts for transfer retrieved successfully",
      accounts,
    });
  } catch (error) {
    console.error("Get accounts for transfer error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// transfer amount between accounts
export const transferBetweenAccounts = async (req, res, next) => {
  try {
    const { fromAccountId, toAccountId, amount, reason } = req.body;

    // Input validation
    if (!fromAccountId || !toAccountId || !amount) {
      return next(
        errorHandler(400, "From account, to account and amount are required")
      );
    }

    // Validate amount is a positive number
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return next(errorHandler(400, "Amount must be a positive number"));
    }

    // Validate account IDs are positive integers
    const fromAccountIdNum = parseInt(fromAccountId);
    const toAccountIdNum = parseInt(toAccountId);

    if (
      isNaN(fromAccountIdNum) ||
      fromAccountIdNum <= 0 ||
      isNaN(toAccountIdNum) ||
      toAccountIdNum <= 0
    ) {
      return next(errorHandler(400, "Invalid account IDs"));
    }

    // Prevent self-transfer
    if (fromAccountIdNum === toAccountIdNum) {
      return next(errorHandler(400, "Cannot transfer to the same account"));
    }

    // Check if from account exists and is active
    const [fromAccount] = await pool.query(
      "SELECT Account_Balance, Account_Name FROM accounting_accounts WHERE idAccounting_Accounts = ? AND Branch_idBranch = ? AND Status = '1'",
      [fromAccountIdNum, req.branchId]
    );

    if (fromAccount.length === 0) {
      return next(errorHandler(404, "From account not found or inactive"));
    }

    // Check if amount is available in the from account
    if (parseFloat(fromAccount[0].Account_Balance) < transferAmount) {
      return next(errorHandler(400, "Insufficient funds in from account"));
    }

    // Check if to account exists and is active
    const [toAccount] = await pool.query(
      "SELECT Account_Balance, Account_Name FROM accounting_accounts WHERE idAccounting_Accounts = ? AND Branch_idBranch = ? AND Status = '1'",
      [toAccountIdNum, req.branchId]
    );

    if (toAccount.length === 0) {
      return next(errorHandler(404, "To account not found or inactive"));
    }

    // Start transaction
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Deduct amount from fromAccount
      const newFromBalance =
        parseFloat(fromAccount[0].Account_Balance) - transferAmount;
      const [deductResult] = await conn.query(
        "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ?",
        [newFromBalance, fromAccountIdNum]
      );

      if (deductResult.affectedRows === 0) {
        await conn.rollback();
        conn.release();
        return next(
          errorHandler(500, "Failed to deduct amount from from account")
        );
      }

      // Add amount to toAccount
      const newToBalance =
        parseFloat(toAccount[0].Account_Balance) + transferAmount;
      const [addResult] = await conn.query(
        "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ?",
        [newToBalance, toAccountIdNum]
      );

      if (addResult.affectedRows === 0) {
        await conn.rollback();
        conn.release();
        return next(errorHandler(500, "Failed to add amount to to account"));
      }

      const transferDate = new Date(); // adding same date

      // Create transfer logs for both accounts
      await addAccountTransferLogs(
        conn,
        fromAccountIdNum,
        toAccountIdNum,
        fromAccount[0].Account_Name,
        toAccount[0].Account_Name,
        transferAmount,
        newFromBalance,
        newToBalance,
        reason,
        req.userId,
        transferDate
      );

      // Commit transaction
      await conn.commit();
      conn.release();

      res.status(200).json({
        success: true,
        message: "Transfer completed successfully",
      });
    } catch (error) {
      await conn.rollback();
      conn.release();
      console.error("Transfer transaction error:", error);
      return next(
        errorHandler(500, "Transfer failed - transaction rolled back")
      );
    }
  } catch (error) {
    console.error("Transfer between accounts error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
