import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";
import {
  addAccountTransferLogs,
  addCashierRegistryStartLog,
} from "../utils/accounting.account.logs.js";

// Start cashier registry for the day (Start or update if already started)
export const startCashierRegistryForDay = async (req, res, next) => {
  let connection;

  try {
    const { fromAccountId, toAccountId, entries } = req.body;
    if (!fromAccountId || !toAccountId || !entries || entries.length === 0) {
      return next(
        errorHandler(400, "fromAccountId, toAccountId and entries are required")
      );
    }

    // validate accounts id's
    if (fromAccountId === toAccountId) {
      return next(
        errorHandler(400, "from Account and to Account cannot be the same")
      );
    }

    // Parse Account IDs to integers
    const parsedFromAccountId = parseInt(fromAccountId, 10);
    const parsedToAccountId = parseInt(toAccountId, 10);

    // Validate fromAccountId and toAccountId
    const [fromAccount] = await pool.query(
      "SELECT * FROM accounting_accounts WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?",
      [fromAccountId, req.branchId]
    );
    if (fromAccount.length === 0) {
      return next(errorHandler(400, "Invalid Transfer From Account ID"));
    }

    const [toAccount] = await pool.query(
      "SELECT * FROM accounting_accounts WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?",
      [toAccountId, req.branchId]
    );

    if (toAccount.length === 0) {
      return next(errorHandler(400, "Invalid Transfer Cashier Account ID"));
    }

    // bills and coins available in Sri Lanka
    const validDenominations = [1, 2, 5, 10, 50, 100, 500, 1000, 5000];

    // validate entries
    for (const entry of entries) {
      if (!entry.denomination || entry.denomination <= 0) {
        return next(errorHandler(400, "Denomination must be greater than 0"));
      }

      if (!validDenominations.includes(entry.denomination)) {
        return next(
          errorHandler(400, `Denomination ${entry.denomination} is not valid`)
        );
      }

      if (!entry.quantity || entry.quantity <= 0) {
        return next(errorHandler(400, "Quantity must be greater than 0"));
      }

      // Ensure quantity is an integer
      if (!Number.isInteger(entry.quantity)) {
        return next(errorHandler(400, "Quantity must be a whole number"));
      }
    }

    // Calculate total amount from entries (denomination × quantity)
    let totalAmount = 0;
    entries.forEach((entry) => {
      const entryAmount =
        parseFloat(entry.denomination) * parseInt(entry.quantity);
      totalAmount += entryAmount;
    });

    // Round to 2 decimal places to avoid floating point errors
    totalAmount = Math.round(totalAmount * 100) / 100;

    // Check if transfer from account has sufficient balance
    const fromAccountBalance = parseFloat(fromAccount[0].Account_Balance);
    if (fromAccountBalance < totalAmount) {
      return next(
        errorHandler(400, "Insufficient balance in Transfer From Account")
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // deduct amount from fromAccount
      const newFromAccountBalance =
        Math.round((fromAccountBalance - totalAmount) * 100) / 100;
      await connection.query(
        "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ?",
        [newFromAccountBalance, fromAccountId]
      );

      // add amount to toAccount
      const toAccountBalance = parseFloat(toAccount[0].Account_Balance);
      const newToAccountBalance =
        Math.round((toAccountBalance + totalAmount) * 100) / 100;
      await connection.query(
        "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ?",
        [newToAccountBalance, toAccountId]
      );

      // add account transfer logs for both accounts
      await addAccountTransferLogs(
        connection,
        fromAccountId,
        toAccountId,
        fromAccount[0].Account_Name,
        toAccount[0].Account_Name,
        totalAmount,
        newFromAccountBalance,
        newToAccountBalance,
        "To get cash for cashier account",
        req.userId
      );

      // Check if there is already a cashier registry started for the day
      const [existingRegistry] = await connection.query(
        "SELECT * FROM daily_registry WHERE User_idUser = ? AND Date = CURDATE() AND Description = 'Day Start' AND daily_registry_status = ?",
        [req.userId, 1]
      );

      if (existingRegistry.length > 0) {
        // insert entries to daily_registry and daily_registry_has_cash tables
        const [dailyRegistryResult] = await connection.query(
          "INSERT INTO daily_registry (Date, Time, Description, User_idUser, Total_Amount) VALUES (CURDATE(), CURTIME(), ?, ?, ?)",
          ["Day Start Updated", req.userId, totalAmount]
        );

        if (!dailyRegistryResult || dailyRegistryResult.affectedRows === 0) {
          await connection.rollback();
          return next(
            errorHandler(500, "Failed to create daily registry record")
          );
        }

        const dailyRegistryId = dailyRegistryResult.insertId;
        for (const entry of entries) {
          const entryAmount =
            Math.round(
              parseFloat(entry.denomination) * parseInt(entry.quantity) * 100
            ) / 100;

          const result = await connection.query(
            "INSERT INTO daily_registry_has_cash (Daily_registry_idDaily_Registry, Denomination, Quantity, Amount) VALUES (?, ?, ?, ?)",
            [dailyRegistryId, entry.denomination, entry.quantity, entryAmount]
          );

          if (!result || result[0].affectedRows === 0) {
            await connection.rollback();
            return next(
              errorHandler(500, "Failed to create daily registry cash entry")
            );
          }
        }

        // Make a log entry for the cashier registry update
        await addCashierRegistryStartLog(
          connection,
          toAccountId,
          "Cashier Registry Updated",
          `Cashier registry Updated. Total Amount: ${totalAmount}`,
          totalAmount,
          0,
          newToAccountBalance,
          fromAccountId,
          req.userId
        );
      } else {
        // if no existing registry, this is going to be the first registry for the day
        // insert entries to daily_registry and daily_registry_has_cash tables
        const [dailyRegistryResult] = await connection.query(
          "INSERT INTO daily_registry (Date, Time, Description, User_idUser, Total_Amount,daily_registry_status) VALUES (CURDATE(), CURTIME(), ?, ?, ?,?)",
          ["Day Start", req.userId, totalAmount, 1]
        );

        if (!dailyRegistryResult || dailyRegistryResult.affectedRows === 0) {
          await connection.rollback();
          return next(
            errorHandler(500, "Failed to create daily registry record")
          );
        }

        const dailyRegistryId = dailyRegistryResult.insertId;
        for (const entry of entries) {
          const entryAmount =
            Math.round(
              parseFloat(entry.denomination) * parseInt(entry.quantity) * 100
            ) / 100;

          const result = await connection.query(
            "INSERT INTO daily_registry_has_cash (Daily_registry_idDaily_Registry, Denomination, Quantity, Amount) VALUES (?, ?, ?, ?)",
            [dailyRegistryId, entry.denomination, entry.quantity, entryAmount]
          );

          if (!result || result[0].affectedRows === 0) {
            await connection.rollback();
            return next(
              errorHandler(500, "Failed to create daily registry cash entry")
            );
          }
        }

        // Make a log entry for the cashier registry start
        await addCashierRegistryStartLog(
          connection,
          toAccountId,
          "Cashier Registry Start",
          `Cashier registry started for the day. Total Amount: ${totalAmount}`,
          totalAmount,
          0,
          newToAccountBalance,
          fromAccountId,
          req.userId
        );
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message:
          existingRegistry.length > 0
            ? "Cashier registry updated successfully"
            : "Cashier registry started successfully",
        totalAmount: totalAmount,
      });
    } catch (error) {
      console.error("Transaction error:", error);
      await connection.rollback();
      return next(errorHandler(500, "Transaction failed, rolled back"));
    }
  } catch (error) {
    console.error("Start Cashier Registry error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Send daily registry and daily registry cash entries of the day (started data and updated data if any)
export const getTodayCashierRegistry = async (req, res, next) => {
  try {
    let startedRegistry = null;
    let cashEntries = [];
    let updatedRegistries = [];

    // Fetch the started registry for the day
    const [startedRegistryResult] = await pool.query(
      "SELECT dr.idDaily_Registry, dr.Date, dr.Time, dr.Description, dr.Total_Amount, dr.Created_at, u.full_name as enteredUser FROM daily_registry dr JOIN user u ON dr.User_idUser = u.idUser WHERE dr.User_idUser = ? AND dr.Date = CURDATE() AND dr.Description = 'Day Start' ORDER BY dr.Time DESC LIMIT 1",
      [req.userId]
    );

    if (startedRegistryResult.length > 0) {
      startedRegistry = startedRegistryResult[0];

      // Fetch cash entries for the started registry
      const [cashEntriesResult] = await pool.query(
        "SELECT Denomination, Quantity, Amount FROM daily_registry_has_cash WHERE Daily_registry_idDaily_Registry = ? ORDER BY Denomination DESC",
        [startedRegistry.idDaily_Registry]
      );

      cashEntries = cashEntriesResult;
    }

    // Fetch ALL updated registries for the day (can be multiple)
    const [updatedRegistriesResult] = await pool.query(
      "SELECT dr.idDaily_Registry, dr.Time, dr.Description, dr.Total_Amount, dr.Created_at, u.full_name as enteredUser FROM daily_registry dr JOIN user u ON dr.User_idUser = u.idUser WHERE dr.User_idUser = ? AND dr.Date = CURDATE() AND dr.Description = 'Day Start Updated' ORDER BY dr.Time ASC",
      [req.userId]
    );

    if (updatedRegistriesResult.length > 0) {
      // Fetch cash entries for each updated registry
      for (const registry of updatedRegistriesResult) {
        const [updatedCashEntriesResult] = await pool.query(
          "SELECT Denomination, Quantity, Amount FROM daily_registry_has_cash WHERE Daily_registry_idDaily_Registry = ? ORDER BY Denomination DESC",
          [registry.idDaily_Registry]
        );

        updatedRegistries.push({
          ...registry,
          cashEntries: updatedCashEntriesResult,
        });
      }
    }

    // Calculate total cashier balance added today
    let totalCashierBalanceAddedToday = 0;

    // Add started registry amount
    if (startedRegistry) {
      totalCashierBalanceAddedToday +=
        parseFloat(startedRegistry.Total_Amount) || 0;
    }

    // Add all updated registries amounts
    updatedRegistries.forEach((registry) => {
      totalCashierBalanceAddedToday += parseFloat(registry.Total_Amount) || 0;
    });

    // Round to 2 decimal places to avoid floating point errors
    totalCashierBalanceAddedToday =
      Math.round(totalCashierBalanceAddedToday * 100) / 100;

    // Calculate total by denomination across all registries
    const denominationSummary = {};
    const validDenominations = [1, 2, 5, 10, 50, 100, 500, 1000, 5000];

    // Initialize denomination summary
    validDenominations.forEach((denom) => {
      denominationSummary[denom] = {
        denomination: denom,
        totalQuantity: 0,
        totalAmount: 0,
      };
    });

    // Add started registry cash entries to summary
    cashEntries.forEach((entry) => {
      const denom = parseInt(entry.Denomination);
      if (denominationSummary[denom]) {
        denominationSummary[denom].totalQuantity +=
          parseInt(entry.Quantity) || 0;
        denominationSummary[denom].totalAmount += parseFloat(entry.Amount) || 0;
      }
    });

    // Add all updated registries cash entries to summary
    updatedRegistries.forEach((registry) => {
      registry.cashEntries.forEach((entry) => {
        const denom = parseInt(entry.Denomination);
        if (denominationSummary[denom]) {
          denominationSummary[denom].totalQuantity +=
            parseInt(entry.Quantity) || 0;
          denominationSummary[denom].totalAmount +=
            parseFloat(entry.Amount) || 0;
        }
      });
    });

    // Convert denomination summary to array and filter out zero quantities
    const denominationSummaryArray = Object.values(denominationSummary)
      .filter((item) => item.totalQuantity > 0)
      .map((item) => ({
        ...item,
        totalAmount: Math.round(item.totalAmount * 100) / 100,
      }));

    res.status(200).json({
      success: true,
      message: "Today's cashier registry fetched successfully",
      registryData: {
        startedRegistry,
        cashEntries,
        updatedRegistries,
        totalCashierBalanceAddedToday,
        denominationSummary: denominationSummaryArray,
        summaryStats: {
          totalRegistries: (startedRegistry ? 1 : 0) + updatedRegistries.length,
          totalUpdates: updatedRegistries.length,
        },
      },
    });
  } catch (error) {
    console.error("Get Today Cashier Registry error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// send cashier account logs of the day with pagination to cashier dashboard
export const getCashierAccountLogsData = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const cashierAccountId = req.params.accountId || req.params.id;

    if (!cashierAccountId) {
      return next(errorHandler(400, "Cashier Account ID is required"));
    }

    // validate account id
    const [account] = await pool.query(
      "SELECT * FROM accounting_accounts WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?",
      [cashierAccountId, req.branchId]
    );

    if (account.length === 0) {
      return next(errorHandler(400, "Invalid Cashier Account ID"));
    }

    // validate pagination params
    if (page <= 0 || limit <= 0) {
      return next(
        errorHandler(400, "Page and limit must be positive integers")
      );
    }

    // Get total count of logs for pagination
    const paginationData = await getPaginationData(
      "SELECT COUNT(*) as total FROM accounting_accounts_log WHERE Accounting_Accounts_idAccounting_Accounts = ? AND STR_TO_DATE(Date_Time, '%Y-%m-%d') = CURDATE()",
      [cashierAccountId],
      page,
      limit
    );

    // get log data
    const [logs] = await pool.query(
      "SELECT aal.*, u.full_name as enteredUser FROM accounting_accounts_log aal JOIN user u ON aal.User_idUser = u.idUser WHERE aal.Accounting_Accounts_idAccounting_Accounts = ? AND STR_TO_DATE(Date_Time, '%Y-%m-%d') = CURDATE()  ORDER BY aal.idAccounting_Accounts_Log DESC LIMIT ? OFFSET ?",
      [cashierAccountId, limit, offset]
    );

    res.status(200).json({
      success: true,
      message: "Cashier Account Logs fetched successfully",
      logs,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Get Cashier Account Logs Data error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Send day start registry balance, current balance,ticket issued amount and payment received amount for the the current day
export const getCashierDashboardSummary = async (req, res, next) => {
  try {
    const cashierAccountId = req.params.accountId || req.params.id;
    if (!cashierAccountId) {
      return next(errorHandler(400, "Cashier Account ID is required"));
    }

    // validate account id
    const [account] = await pool.query(
      "SELECT * FROM accounting_accounts WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?",
      [cashierAccountId, req.branchId]
    );

    if (account.length === 0) {
      return next(errorHandler(400, "Invalid Cashier Account ID"));
    }

    const currentBalance = parseFloat(account[0].Account_Balance) || 0; // assign current balance from account balance

    let dayStartBalance = 0;
    // get day start registry balance for today
    const [dayStartRegistry] = await pool.query(
      "SELECT Total_Amount FROM daily_registry WHERE User_idUser = ? AND Date = CURDATE() AND Description = 'Day Start' ORDER BY Time DESC LIMIT 1",
      [req.userId]
    );

    if (dayStartRegistry.length > 0) {
      dayStartBalance = parseFloat(dayStartRegistry[0].Total_Amount) || 0;
    }

    // get total ticket issued amount for today
    let ticketIssuedAmount = 0;
    const [ticketIssues] = await pool.query(
      "SELECT SUM(CAST(Credit AS DECIMAL(10,2))) as totalIssued FROM accounting_accounts_log WHERE Accounting_Accounts_idAccounting_Accounts = ? AND User_idUser = ? AND Type = 'Pawning Ticket Issued' AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d %H:%i:%s')) = CURDATE()",
      [cashierAccountId, req.userId]
    );

    if (ticketIssues.length > 0) {
      ticketIssuedAmount = parseFloat(ticketIssues[0].totalIssued) || 0;
    }
    // get payment received amount for today (to be implemented)
    let paymentReceivedAmount = 0;

    res.status(200).json({
      success: true,
      message: "Cashier Dashboard Summary fetched successfully",
      summary: {
        dayStartBalance,
        currentBalance,
        ticketIssuedAmount,
        paymentReceivedAmount,
      },
    });
  } catch (error) {
    console.error("Get Cashier Dashboard Summary error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Send all cashier account's denomination summary (denomination,quantity and amount) for the current day
export const getCashierDenominationSummary = async (req, res, next) => {
  try {
    const cashierAccountId = req.params.accountId || req.params.id;
    if (!cashierAccountId) {
      return next(errorHandler(400, "Cashier Account ID is required"));
    }

    // validate account id
    const [account] = await pool.query(
      "SELECT * FROM accounting_accounts WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?",
      [cashierAccountId, req.branchId]
    );

    if (account.length === 0) {
      return next(errorHandler(400, "Invalid Cashier Account ID"));
    }

    // bills and coins available in Sri Lanka
    const validDenominations = [1, 2, 5, 10, 50, 100, 500, 1000, 5000];
    const denominationSummary = {};
    // Initialize denomination summary
    validDenominations.forEach((denom) => {
      denominationSummary[denom] = {
        denomination: denom,
        totalQuantity: 0,
        totalAmount: 0,
      };
    });

    // get all daily registries for today
    const [dailyRegistries] = await pool.query(
      "SELECT idDaily_Registry FROM daily_registry WHERE User_idUser = ? AND Date = CURDATE()",
      [req.userId]
    );

    if (dailyRegistries.length > 0) {
      // for each registry get cash entries and add to summary
      for (const registry of dailyRegistries) {
        const [cashEntries] = await pool.query(
          "SELECT Denomination, Quantity, Amount FROM daily_registry_has_cash WHERE Daily_registry_idDaily_Registry = ?",
          [registry.idDaily_Registry]
        );
        cashEntries.forEach((entry) => {
          const denom = parseInt(entry.Denomination);
          if (denominationSummary[denom]) {
            denominationSummary[denom].totalQuantity +=
              parseInt(entry.Quantity) || 0;
            denominationSummary[denom].totalAmount +=
              parseFloat(entry.Amount) || 0;
          }
        });
      }

      // Convert denomination summary to array and filter out zero quantities
      const denominationSummaryArray = Object.values(denominationSummary)
        .filter((item) => item.totalQuantity > 0)
        .map((item) => ({
          ...item,
          totalAmount: Math.round(item.totalAmount * 100) / 100,
        }));

      res.status(200).json({
        success: true,
        message: "Cashier Denomination Summary fetched successfully",
        denominationSummary: denominationSummaryArray,
      });
    } else {
      // no registries found for today
      res.status(200).json({
        success: true,
        message: "No cashier registries found for today",
        denominationSummary: [],
      });
    }
  } catch (error) {
    console.error("Get Cashier Denomination Summary error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
