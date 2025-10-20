import { pool } from "./db.js";

export const createManualJournalLog = async (
  journalId,
  accountId,
  debitAmount,
  creditAmount
) => {
  try {
    const [accountResult] = await pool.query(
      `SELECT Account_Name FROM accounting_accounts WHERE idAccounting_Accounts = ?`,
      [accountId]
    );

    const accountName = accountResult[0]?.Account_Name || null;

    const [result] = await pool.query(
      `INSERT INTO manual_journal_logs 
      (Manual_Journal_idManual_Journal, Account_Name, Debit_Amount, Credit_Amount, Accounting_Accounts_idAccounting_Accounts) 
      VALUES (?, ?, ?, ?, ?)`,
      [journalId, accountName, debitAmount, creditAmount, accountId]
    );
  } catch (error) {
    console.error("Error creating manual journal log:", error);
    throw error;
  }
};
