import { pool } from "./db.js";

// Create a new accounting account log when create a chart account
export const createAccountingAccountLog = async (createdAccount, userId) => {
  try {
    let description = `Charted Account created. Group of Account: ${createdAccount.Group_Of_Type}, Account Name: ${createdAccount.Account_Name}, Cash Flow Type: ${createdAccount.Cashflow_Type}`;

    // If there's a parent account, fetch its name and type and add to description
    if (
      createdAccount.Parent_Account !== null &&
      createdAccount.Parent_Account !== undefined
    ) {
      const parentAccountId = parseInt(createdAccount.Parent_Account);
      // Fetch parent account name and type
      const [parentAccountRows] = await pool.query(
        "SELECT Account_Name, Account_Type FROM accounting_accounts WHERE idAccounting_Accounts = ?",
        [parentAccountId]
      );

      description += `, Parent Account: ${
        parentAccountRows[0]?.Account_Name || "N/A"
      } (${parentAccountRows[0]?.Account_Type || "N/A"})`;
    }

    const type = "Charted Account Creation"; // type of log entry

    // Insert the log entry
    const [result] = await pool.query(
      `INSERT INTO accounting_accounts_log 
      (Accounting_Accounts_idAccounting_Accounts, Description, Debit, Credit, Balance, Date_Time, User_idUser, Type) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        createdAccount.idAccounting_Accounts,
        description,
        0,
        0,
        0,
        new Date(),
        userId,
        type,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to create accounting account log");
    }
  } catch (error) {
    console.error("Error creating accounting account log:", error);
    throw error;
  }
};

// Get logs for a specific account
// export const getAccountLogsById = async (accountId, page = 1, limit = 10) => {
//   try {
//     const offset = (page - 1) * limit;

//     // Get logs with pagination
//     const [logs] = await pool.query(
//       `SELECT * FROM accounting_accounts_log
//        WHERE Accounting_Accounts_idAccounting_Accounts = ?
//        ORDER BY idAccounting_Accounts_Log DESC
//        LIMIT ? OFFSET ?`,
//       [accountId, parseInt(limit), offset]
//     );

//     // Get total count for pagination
//     const [countResult] = await pool.query(
//       `SELECT COUNT(*) as total FROM accounting_accounts_log
//        WHERE Accounting_Accounts_idAccounting_Accounts = ?`,
//       [accountId]
//     );

//     const total = countResult[0].total;
//     const totalPages = Math.ceil(total / limit);

//     return {
//       logs,
//       pagination: {
//         page: parseInt(page),
//         limit: parseInt(limit),
//         total,
//         totalPages,
//       },
//     };
//   } catch (error) {
//     console.error("Error fetching account logs:", error);
//     throw error;
//   }
// };

// create a log to accounting_accounts_log when a new account is created
export const addAccountCreateLog = async (
  accountId,
  type,
  description,
  debit,
  credit,
  balance,
  contra_account,
  user
) => {
  try {
    const [userName] = await pool.query(
      "SELECT full_name FROM user WHERE idUser = ?",
      [user]
    );

    const descriptionText = ` Account Created: ${description} by ${
      userName[0]?.full_name || "Unknown User"
    }`;

    const typeText = `Type - ${type} | Type ID - ${accountId}`;
    const [result] = await pool.query(
      "INSERT INTO accounting_accounts_log (Accounting_Accounts_idAccounting_Accounts,Date_Time,Type,Description,Debit,Credit,Balance,Contra_Account,User_idUser) VALUES(?,?,?,?,?,?,?,?,?)",
      [
        accountId,
        new Date(),
        typeText,
        descriptionText,
        debit,
        credit,
        balance,
        contra_account,
        user,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to create account creation log");
    }
  } catch (error) {
    console.error("Error creating account creation log:", error);
    throw new Error("Failed to create account creation log");
  }
};

// create transfer logs for both accounts (from and to)
export const addAccountTransferLogs = async (
  connection,
  fromAccountId,
  toAccountId,
  fromAccountName,
  toAccountName,
  transferAmount,
  newFromBalance,
  newToBalance,
  reason,
  userId,
  transferDate = new Date()
) => {
  try {
    // Log for FROM account (debit)
    await connection.query(
      "INSERT INTO accounting_accounts_log (Accounting_Accounts_idAccounting_Accounts, Date_Time, Type, Description, Debit, Credit, Balance, Contra_Account, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        fromAccountId,
        transferDate,
        "Internal Account Transfer Out",
        `To ${toAccountName}${reason ? ` | Reason: ${reason}` : ""}`,
        0,
        transferAmount,
        newFromBalance,
        toAccountId,
        userId,
      ]
    );

    // Log for TO account (credit)
    await connection.query(
      "INSERT INTO accounting_accounts_log (Accounting_Accounts_idAccounting_Accounts, Date_Time, Type, Description, Debit, Credit, Balance, Contra_Account, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        toAccountId,
        transferDate,
        "Internal Account Transfer In",
        `From ${fromAccountName}${reason ? ` | Reason: ${reason}` : ""}`,
        transferAmount,
        0,
        newToBalance,
        fromAccountId,
        userId,
      ]
    );
  } catch (error) {
    console.error("Error creating account transfer logs:", error);
    throw new Error("Failed to create account transfer logs");
  }
};

// create a log to accounting_accounts_log when a cashier registry is started for the day
export const addCashierRegistryStartLog = async (
  connection,
  accountId,
  type,
  description,
  debit,
  credit,
  balance,
  contra_account,
  userId
) => {
  try {
    const [result] = await connection.query(
      "INSERT INTO accounting_accounts_log (Accounting_Accounts_idAccounting_Accounts,Date_Time,Type,Description,Debit,Credit,Balance,Contra_Account,User_idUser) VALUES(?,?,?,?,?,?,?,?,?)",
      [
        accountId,
        new Date(),
        type,
        description,
        debit,
        credit,
        balance,
        contra_account,
        userId,
      ]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to create cashier registry start log");
    }
  } catch (error) {
    console.error("Error creating cashier registry start log:", error);
    throw new Error("Failed to create cashier registry start log");
  }
};
