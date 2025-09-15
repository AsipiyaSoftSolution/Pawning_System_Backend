import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";
import { createManualJournalLog } from "../utils/manual.journal.logs.js";

// Create a new manual journal entry
export const createManualJournal = async (req, res, next) => {
  try {
    const { 
      narration, 
      journalDate, 
      entries 
    } = req.body;

    // Validate required fields
    if (!narration || !journalDate || !entries || entries.length === 0) {
      return next(errorHandler(400, "Narration, journal date, and at least one entry are required"));
    }

    // Validate journal date (cannot be earlier than current date)
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const selectedDate = new Date(journalDate);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < currentDate) {
      return next(errorHandler(400, "Journal date cannot be earlier than the current date"));
    }

    // Validate entries
    for (const entry of entries) {
      if (!entry.description || !entry.idAccounting_Accounts) {
        return next(errorHandler(400, "Description and account are required for each entry"));
      }
      if (!entry.debitAmount && !entry.creditAmount) {
        return next(errorHandler(400, "At least one of debit amount or credit amount must be provided for each entry"));
      }
    }

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

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert a row for each entry in manual_journal
      const insertedIds = [];
      for (const entry of entries) {
        const amount = parseFloat(entry.debitAmount || 0) || parseFloat(entry.creditAmount || 0) || 0;
        const [journalResult] = await connection.query(
          `INSERT INTO manual_journal 
          (Narration, Date, Branch_idBranch, User_idUser, idAccounting_Accounts, Description, Amount) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [narration, journalDate, branchId, userId, entry.idAccounting_Accounts, entry.description, amount]
        );
        insertedIds.push(journalResult.insertId);
      }
      // Create log entries for each journal entry
      for (let i = 0; i < insertedIds.length; i++) {
        const journalId = insertedIds[i];
        const accountId = entries[i].idAccounting_Accounts;
        const debitAmount = entries[i].debitAmount || null;
        const creditAmount = entries[i].creditAmount || null;
        await createManualJournalLog(journalId, accountId, debitAmount, creditAmount);
      }
      
      await connection.commit();
      res.status(201).json({
        message: "Manual journal entries created successfully",
        journalIds: insertedIds
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
    const { page = 1, limit = 10, narration, fromDate, toDate, fromAmount, toAmount } = req.query;
    
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
      entries: journalEntries
    });
  } catch (error) {
    console.error("Error fetching manual journal entry:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Get chart of accounts for dropdown
export const getChartAccountsForDropdown = async (req, res, next) => {
  try {
    // Get branch ID - either from request or use the first branch from user's branches
    let branchId;
    if (req.branchId) {
      branchId = req.branchId;
    } else if (req.branches && req.branches.length > 0) {
      branchId = req.branches[0];
    } else {
      console.log('No branch ID found in request, using default branch');
      // For debugging purposes, get all accounts regardless of branch
      const [allAccounts] = await pool.query(
        `SELECT idAccounting_Accounts, Account_Code, Account_Name, Account_Type, Branch_idBranch
         FROM accounting_accounts
         WHERE Status = 1
         ORDER BY Account_Code`
      );
      
      console.log(`Found ${allAccounts.length} accounts across all branches`);
      
      if (allAccounts.length > 0) {
        // Use the branch of the first account as a fallback
        branchId = allAccounts[0].Branch_idBranch;
        console.log(`Using fallback branch ID: ${branchId}`);
      } else {
        return next(errorHandler(400, "No accounts found in the system"));
      }
    }
    
    console.log(`Fetching accounts for branch ID: ${branchId}`);
    
    // Get active accounts
    const [accounts] = await pool.query(
      `SELECT idAccounting_Accounts, Account_Code, Account_Name, Account_Type
       FROM accounting_accounts
       WHERE Branch_idBranch = ? AND Status = 1
       ORDER BY Account_Code`,
      [branchId]
    );
    
    console.log(`Found ${accounts.length} accounts for branch ID: ${branchId}`);
    
    
    res.status(200).json({
      message: "Chart of accounts fetched successfully",
      accounts,
    });
  } catch (error) {
    console.error("Error fetching chart of accounts:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};