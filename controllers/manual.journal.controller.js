import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";
import { createManualJournalLog } from "../utils/manual.journal.logs.js";
import { addManualJournalCreditDebitLog } from "../utils/accounting.account.logs.js";

// Create a new manual journal entry
export const createManualJournal = async (req, res, next) => {
  try {
    const { narration, journalDate, entries } = req.body;

    // Validate required fields
    if (!narration || !journalDate || !entries || entries.length === 0) {
      return next(
        errorHandler(
          400,
          "Narration, journal date, and at least one entry are required"
        )
      );
    }

    // Validate journal date (cannot be earlier than current date)
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const selectedDate = new Date(journalDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < currentDate) {
      return next(
        errorHandler(
          400,
          "Journal date cannot be earlier than the current date"
        )
      );
    }

    // Validate entries
    for (const entry of entries) {
      if (!entry.account) {
        return next(errorHandler(400, "Account is required for each entry"));
      }

      if (!entry.creditAmount && !entry.debitAmount) {
        return next(
          errorHandler(
            400,
            "Either credit amount or debit amount must be provided for each entry"
          )
        );
      }
    }

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert a row for each entry in manual_journal
      for (const entry of entries) {
        // check account data exists
        const [accountData] = await connection.query(
          `SELECT idAccounting_Accounts,Group_Of_Type, Type,Account_Balance,Account_Name,Account_Code FROM accounting_accounts WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?`,
          [entry.account, req.branchId]
        );

        if (accountData.length === 0) {
          await connection.rollback();
          return next(
            errorHandler(
              400,
              `Account with ID ${entry.account} does not exist in this branch`
            )
          );
        }

        const amount =
          parseFloat(entry.debitAmount || 0) ||
          parseFloat(entry.creditAmount || 0) ||
          0;
        const [journalResult] = await connection.query(
          `INSERT INTO manual_journal 
          (Narration, Date, Branch_idBranch, User_idUser, idAccounting_Accounts, Description, Amount) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            narration,
            journalDate,
            req.branchId,
            req.userId,
            entry.account,
            entry.description,
            amount,
          ]
        );

        // add a manual journal log now
        await createManualJournalLog(
          journalResult.insertId,
          entry.account,
          entry.debitAmount,
          entry.creditAmount
        );

        let typeForLog = `Manual Journal Entry - ${narration}`; // define type for accounting log
        let descriptionForLog;

        // then update the balance in accounting accounts table
        if (
          accountData[0].Group_Of_Type === "Assets" ||
          accountData[0].Group_Of_Type === "Expenses"
        ) {
          // if debit increase, credit decrease
          // check if this is debit or credit
          if (entry.debitAmount) {
            const currentBalance =
              parseFloat(accountData[0].Account_Balance) || 0;
            const debitVal = parseFloat(entry.debitAmount) || 0;
            const newBalance = currentBalance + debitVal;
            await connection.query(
              `UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?`,
              [newBalance, entry.account, req.branchId]
            );
            descriptionForLog = `Amount Debited via Manual Journal - ${narration} | Amount: ${debitVal} | Group of Type: ${accountData[0].Group_Of_Type} | Account Type: ${accountData[0].Type}`;

            // add accounting account log
            await addManualJournalCreditDebitLog(
              entry.account,
              entry.creditAmount || 0,
              entry.debitAmount || 0,
              typeForLog,
              descriptionForLog,
              req.userId,
              newBalance
            );
          } else if (entry.creditAmount) {
            // check if this account has sufficient balance for credit
            const currentBalance =
              parseFloat(accountData[0].Account_Balance) || 0;
            const creditVal = parseFloat(entry.creditAmount) || 0;
            if (currentBalance < creditVal) {
              await connection.rollback();
              return next(
                errorHandler(
                  400,
                  `Insufficient balance in account ${accountData[0].Account_Name} (${accountData[0].Account_Code}) for credit amount ${creditVal}`
                )
              );
            }

            const newBalance = currentBalance - creditVal;
            await connection.query(
              `UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?`,
              [newBalance, entry.account, req.branchId]
            );

            descriptionForLog = `Amount Credited via Manual Journal - ${narration} | Amount: ${creditVal} | Group of Type: ${accountData[0].Group_Of_Type} | Account Type: ${accountData[0].Type}`;
            // add accounting account log
            await addManualJournalCreditDebitLog(
              entry.account,
              entry.creditAmount || 0,
              entry.debitAmount || 0,
              typeForLog,
              descriptionForLog,
              req.userId,
              newBalance
            );
          }
        }

        if (
          accountData[0].Group_Of_Type === "Liabilities" ||
          accountData[0].Group_Of_Type === "Revenue" ||
          accountData[0].Group_Of_Type === "Equity"
        ) {
          // if credit increase, debit decrease
          if (entry.creditAmount) {
            const currentBalance =
              parseFloat(accountData[0].Account_Balance) || 0;
            const creditVal = parseFloat(entry.creditAmount) || 0;
            const newBalance = currentBalance + creditVal;
            await connection.query(
              `UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?`,
              [newBalance, entry.account, req.branchId]
            );

            descriptionForLog = `Amount Credited via Manual Journal - ${narration} | Amount: ${creditVal} | Group of Type: ${accountData[0].Group_Of_Type} | Account Type: ${accountData[0].Type}`;
            // add accounting account log
            await addManualJournalCreditDebitLog(
              entry.account,
              entry.creditAmount || 0,
              entry.debitAmount || 0,
              typeForLog,
              descriptionForLog,
              req.userId,
              newBalance
            );
          } else if (entry.debitAmount) {
            // check if this account has sufficient balance for debit
            const currentBalance =
              parseFloat(accountData[0].Account_Balance) || 0;
            const debitVal = parseFloat(entry.debitAmount) || 0;
            if (currentBalance < debitVal) {
              await connection.rollback();
              return next(
                errorHandler(
                  400,
                  `Insufficient balance in account ${accountData[0].Account_Name} (${accountData[0].Account_Code}) for debit amount ${debitVal}`
                )
              );
            }

            const newBalance = currentBalance - debitVal;
            await connection.query(
              `UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?`,
              [newBalance, entry.account, req.branchId]
            );

            descriptionForLog = `Amount Debited via Manual Journal - ${narration} | Amount: ${debitVal} | Group of Type: ${accountData[0].Group_Of_Type} | Account Type: ${accountData[0].Type}`;
            // add accounting account log
            await addManualJournalCreditDebitLog(
              entry.account,
              entry.creditAmount || 0,
              entry.debitAmount || 0,
              typeForLog,
              descriptionForLog,
              req.userId,
              newBalance
            );
          }
        }
      }

      await connection.commit();
      res.status(201).json({
        message: "Manual journal entries created successfully",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error creating manual journal entries:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Get all manual journal entries
export const getAllManualJournals = async (req, res, next) => {
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
    const {
      page = 1,
      limit = 10,
      narration,
      fromDate,
      toDate,
      fromAmount,
      toAmount,
    } = req.query;

    // Build the query with filters
    let query = `
      SELECT 
        j.Narration,
        j.Date AS Journal_Date,
        SUM(j.Amount) AS Total_Amount,
        MIN(j.idManual_Journal) AS idManual_Journal,
        MIN(j.Description) AS Description,
        MIN(j.User_idUser) AS User_idUser,
        MIN(u.full_name) AS Created_By,
        MIN(j.Date) AS Created_At
      FROM manual_journal j
      LEFT JOIN user u ON j.User_idUser = u.idUser
      WHERE j.Branch_idBranch = ?`;

    const queryParams = [branchId];

    // Add filters if provided
    if (narration) {
      query += " AND j.Narration LIKE ?";
      queryParams.push(`%${narration}%`);
    }

    if (fromDate) {
      query += " AND j.Date >= ?";
      queryParams.push(fromDate);
    }

    if (toDate) {
      query += " AND j.Date <= ?";
      queryParams.push(toDate);
    }

    if (fromAmount) {
      query += " AND j.Amount >= ?";
      queryParams.push(fromAmount);
    }

    if (toAmount) {
      query += " AND j.Amount <= ?";
      queryParams.push(toAmount);
    }

    // Group by Narration and Date (and optionally user)
    query += ` GROUP BY j.Narration, j.Date`;

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) AS total FROM (
        SELECT 1
        FROM manual_journal j
        WHERE j.Branch_idBranch = ?`;
    let countQueryParams = [branchId];
    if (narration) {
      countQuery += " AND j.Narration LIKE ?";
      countQueryParams.push(`%${narration}%`);
    }
    if (fromDate) {
      countQuery += " AND j.Date >= ?";
      countQueryParams.push(fromDate);
    }
    if (toDate) {
      countQuery += " AND j.Date <= ?";
      countQueryParams.push(toDate);
    }
    if (fromAmount) {
      countQuery += " AND j.Amount >= ?";
      countQueryParams.push(fromAmount);
    }
    if (toAmount) {
      countQuery += " AND j.Amount <= ?";
      countQueryParams.push(toAmount);
    }
    countQuery += ` GROUP BY j.Narration, j.Date ) AS grouped`;

    const paginationData = await getPaginationData(
      countQuery,
      countQueryParams,
      page,
      limit
    );

    // Calculate offset based on page and limit
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Add sorting and pagination
    query += " ORDER BY j.Date DESC LIMIT ? OFFSET ?";
    queryParams.push(parseInt(limit), offset);

    // Execute the query
    const [journals] = await pool.query(query, queryParams);

    res.status(200).json({
      message: "Manual journal entries fetched successfully",
      journals,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error fetching manual journal entries:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Get manual journal entry by ID
export const getManualJournalById = async (req, res, next) => {
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

    // Get journal header
    const [journal] = await pool.query(
      `SELECT j.*, u.full_name AS Created_By
       FROM manual_journal j
       JOIN user u ON j.User_idUser = u.idUser
       WHERE j.idManual_Journal = ? AND j.Branch_idBranch = ?`,
      [id, branchId]
    );

    if (!journal[0]) {
      return next(errorHandler(404, "Manual journal entry not found"));
    }

    // Get journal entries for this journal ID
    const [journalEntries] = await pool.query(
      `SELECT je.*, aa.Account_Code, aa.Account_Name 
       FROM manual_journal_logs je
       JOIN accounting_accounts aa ON je.Accounting_Accounts_idAccounting_Accounts = aa.idAccounting_Accounts
       WHERE je.Manual_Journal_idManual_Journal = ?`,
      [id]
    );

    res.status(200).json({
      message: "Manual journal entry fetched successfully",
      journal: journal[0],
      entries: journalEntries,
    });
  } catch (error) {
    console.error("Error fetching manual journal entry:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Get chart of accounts for dropdown
export const getChartAccountsForDropdown = async (req, res, next) => {
  try {
    // Get active accounts
    const [accounts] = await pool.query(
      `SELECT idAccounting_Accounts, Account_Code, Account_Name, Account_Type,Group_Of_Type,Type
       FROM accounting_accounts
       WHERE Branch_idBranch = ? AND Status = 1`,
      [req.branchId]
    );

    res.status(200).json({
      message: "Chart of accounts fetched successfully",
      accounts,
    });
  } catch (error) {
    console.error("Error fetching chart of accounts:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
