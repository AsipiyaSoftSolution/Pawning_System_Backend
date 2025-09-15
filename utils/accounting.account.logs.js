import { pool } from "./db.js";

export const createAccountingAccountLog = async (
  accountId,
  description,
  debit = 0,
  credit = 0,
  balance = 0,
  date_time = new Date()
) => {
  try {
    // Get the account name for reference
    const [accountResult] = await pool.query(
      `SELECT Account_Name FROM accounting_accounts WHERE idAccounting_Accounts = ?`,
      [accountId]
    );

    const accountName = accountResult[0]?.Account_Name || null;

    // Insert the log entry
    const [result] = await pool.query(
      `INSERT INTO accounting_accounts_log 
      (Accounting_Accounts_idAccounting_Accounts, Description, Debit, Credit, Balance, Date_Time) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [accountId, description, debit, credit, balance, date_time]
    );

    return result.insertId;
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