import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";
import {
  addAccountTransferLogs,
  addCashierRegistryStartEndLog,
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

    // get the latest record for this user and then check if it's unsettled (status 1 or 2)
    // selecting the latest overall and then checking status avoids missing a more recent day-end record
    const [latestRegistry] = await pool.query(
      "SELECT * FROM daily_registry WHERE User_idUser = ? ORDER BY idDaily_Registry DESC LIMIT 1",
      [req.userId]
    );

    if (
      latestRegistry.length > 0 &&
      (latestRegistry[0].daily_registry_status === 1 ||
        latestRegistry[0].daily_registry_status === 2)
    ) {
      return next(
        errorHandler(
          400,
          "Cannot start a new registry while there is an active registry. Please end the current registry first."
        )
      );
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
          "INSERT INTO daily_registry (Date, Time, Description, User_idUser, Total_Amount,daily_registry_status) VALUES (CURDATE(), CURTIME(), ?, ?, ?,?)",
          ["Day Start Updated", req.userId, totalAmount, 2] // updated status 2 for registry updates
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
        await addCashierRegistryStartEndLog(
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
        await addCashierRegistryStartEndLog(
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
    const date = req.query.date;

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

    // validate date param if provided
    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
      if (!dateRegex.test(date)) {
        return next(errorHandler(400, "Date must be in YYYY-MM-DD format"));
      }
    }

    let paginationData;
    let logs;

    if (date) {
      // Get total count of logs for pagination
      paginationData = await getPaginationData(
        "SELECT COUNT(*) as total FROM accounting_accounts_log WHERE Accounting_Accounts_idAccounting_Accounts = ? AND STR_TO_DATE(Date_Time, '%Y-%m-%d') = ?",
        [cashierAccountId, date],
        page,
        limit
      );

      // get log data
      [logs] = await pool.query(
        "SELECT aal.*, u.full_name as enteredUser FROM accounting_accounts_log aal JOIN user u ON aal.User_idUser = u.idUser WHERE aal.Accounting_Accounts_idAccounting_Accounts = ? AND STR_TO_DATE(Date_Time, '%Y-%m-%d') = ? ORDER BY aal.idAccounting_Accounts_Log DESC LIMIT ? OFFSET ?",
        [cashierAccountId, date, limit, offset]
      );
    }

    // Get total count of logs for pagination
    paginationData = await getPaginationData(
      "SELECT COUNT(*) as total FROM accounting_accounts_log WHERE Accounting_Accounts_idAccounting_Accounts = ? AND STR_TO_DATE(Date_Time, '%Y-%m-%d') = CURDATE()",
      [cashierAccountId],
      page,
      limit
    );

    // get log data
    [logs] = await pool.query(
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
    const date = req.query.date;
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

    // validate date param if provided
    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
      if (!dateRegex.test(date)) {
        return next(errorHandler(400, "Date must be in YYYY-MM-DD format"));
      }
    }

    const currentBalance = parseFloat(account[0].Account_Balance) || 0; // assign current balance from account balance

    let dayStartBalance = 0;
    let paymentReceivedAmount = 0;
    let ticketIssuedAmount = 0;

    let dayStartRegistry;
    let ticketIssues;
    let payments;

    if (date) {
      // get day start registry balance for the provided date
      [dayStartRegistry] = await pool.query(
        "SELECT Total_Amount FROM daily_registry WHERE User_idUser = ? AND Date = ? AND Description = 'Day Start' ORDER BY Time DESC LIMIT 1",
        [req.userId, date]
      );

      if (dayStartRegistry.length > 0) {
        dayStartBalance = parseFloat(dayStartRegistry[0].Total_Amount) || 0;
      }

      // get total ticket issued amount for the provided date
      [ticketIssues] = await pool.query(
        "SELECT SUM(CAST(Credit AS DECIMAL(10,2))) as totalIssued FROM accounting_accounts_log WHERE Accounting_Accounts_idAccounting_Accounts = ? AND User_idUser = ? AND Type = 'Pawning Ticket Issued' AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d %H:%i:%s')) = ?",
        [cashierAccountId, req.userId, date]
      );

      if (ticketIssues.length > 0) {
        ticketIssuedAmount = parseFloat(ticketIssues[0].totalIssued) || 0;
      }

      // get payment received amount for the provided date
      [payments] = await pool.query(
        "SELECT SUM(CAST(Debit AS DECIMAL(10,2))) as totalPayments FROM accounting_accounts_log WHERE Accounting_Accounts_idAccounting_Accounts = ? AND Date(STR_TO_DATE(Date_Time, '%Y-%m-%d %H:%i:%s')) = ? AND Type != 'Cashier Registry Start' AND Type != 'Cashier Registry Updated' ",
        [cashierAccountId, date]
      );

      if (payments.length > 0) {
        paymentReceivedAmount = parseFloat(payments[0].totalPayments) || 0;
      }
    }

    // get day start registry balance for today
    [dayStartRegistry] = await pool.query(
      "SELECT Total_Amount FROM daily_registry WHERE User_idUser = ? AND Date = CURDATE() AND Description = 'Day Start' ORDER BY Time DESC LIMIT 1",
      [req.userId]
    );

    if (dayStartRegistry.length > 0) {
      dayStartBalance = parseFloat(dayStartRegistry[0].Total_Amount) || 0;
    }

    // get total ticket issued amount for today
    [ticketIssues] = await pool.query(
      "SELECT SUM(CAST(Credit AS DECIMAL(10,2))) as totalIssued FROM accounting_accounts_log WHERE Accounting_Accounts_idAccounting_Accounts = ? AND User_idUser = ? AND Type = 'Pawning Ticket Issued' AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d %H:%i:%s')) = CURDATE()",
      [cashierAccountId, req.userId]
    );

    if (ticketIssues.length > 0) {
      ticketIssuedAmount = parseFloat(ticketIssues[0].totalIssued) || 0;
    }
    // get payment received amount for today (to be implemented)
    [payments] = await pool.query(
      "SELECT SUM(CAST(Debit AS DECIMAL(10,2))) as totalPayments FROM accounting_accounts_log WHERE Accounting_Accounts_idAccounting_Accounts = ? AND Date(STR_TO_DATE(Date_Time, '%Y-%m-%d %H:%i:%s')) = CURDATE() AND Type != 'Cashier Registry Start' AND Type != 'Cashier Registry Updated' ",
      [cashierAccountId, req.userId]
    );
    if (payments.length > 0) {
      paymentReceivedAmount = parseFloat(payments[0].totalPayments) || 0;
    }

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

// send all cashier account's daily expenses for the current day or filtered date
export const getCashierDailyExpenses = async (req, res, next) => {
  try {
  } catch (error) {}
};

// Get cashier account logs and card data
export const getCashierAccountDayLogWithSummaryCards = async (
  req,
  res,
  next
) => {
  try {
    const cashierAccountId = req.params.accountId || req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!cashierAccountId) {
      return next(errorHandler(400, "Cashier Account ID is required"));
    }

    // validate pagination params
    if (page <= 0 || limit <= 0) {
      return next(
        errorHandler(400, "Page and limit must be positive integers")
      );
    }

    let logs = [];
    let dayStartBalance = 0;
    let paymentReceivedAmount = 0;
    let ticketIssuedAmount = 0;
    let inAccountTransfers = 0;
    let outAccountTransfers = 0;
    let paidDailyExpenses = 0;
    let currentBalance = 0;

    const [account] = await pool.query(
      "SELECT * FROM accounting_accounts WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?",
      [cashierAccountId, req.branchId]
    );

    if (account.length === 0) {
      return next(errorHandler(400, "Invalid Cashier Account ID"));
    }

    // get the latest not settled daily registry for the user
    const [latestRegistry] = await pool.query(
      "SELECT * FROM daily_registry WHERE User_idUser = ? AND (daily_registry_status = 1 OR daily_registry_status = 2 ) ORDER BY idDaily_Registry DESC LIMIT 1",
      [req.userId]
    );

    if (latestRegistry.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "No active daily registry found for the user. Cannot fetch logs and summary data.",
        logs: [],
        pagination: {},
      });
    }

    // get logs
    // pagination data
    // paginate logs between the registry start date and today (inclusive)
    const paginationData = await getPaginationData(
      "SELECT COUNT(*) as total FROM accounting_accounts_log WHERE Accounting_Accounts_idAccounting_Accounts = ? AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d %H:%i:%s')) BETWEEN ? AND CURDATE()",
      [cashierAccountId, latestRegistry[0].Date],
      page,
      limit
    );

    [logs] = await pool.query(
      "SELECT * FROM accounting_accounts_log WHERE Accounting_Accounts_idAccounting_Accounts = ? AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d %H:%i:%s')) BETWEEN ? AND CURDATE() ORDER BY idAccounting_Accounts_Log DESC LIMIT ? OFFSET ?",
      [cashierAccountId, latestRegistry[0].Date, limit, offset]
    );

    // get summary card data

    // get current balance
    currentBalance = parseFloat(account[0].Account_Balance) || 0;

    // get day start balance
    const [dayStartRegistry] = await pool.query(
      "SELECT Total_Amount FROM daily_registry WHERE User_idUser = ? AND Date = ? AND Description = 'Day Start' ORDER BY Time DESC LIMIT 1",
      [req.userId, latestRegistry[0].Date]
    );

    if (dayStartRegistry.length > 0) {
      dayStartBalance = parseFloat(dayStartRegistry[0].Total_Amount) || 0;
    }

    // get ticket issued amount from the registry start date up to today
    const [ticketIssues] = await pool.query(
      "SELECT SUM(CAST(Credit AS DECIMAL(10,2))) as totalIssued FROM accounting_accounts_log WHERE Accounting_Accounts_idAccounting_Accounts = ? AND User_idUser = ? AND Type = 'Ticket Loan Disbursement' AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d %H:%i:%s')) BETWEEN ? AND CURDATE()",
      [cashierAccountId, req.userId, latestRegistry[0].Date]
    );

    if (ticketIssues.length > 0) {
      ticketIssuedAmount = parseFloat(ticketIssues[0].totalIssued) || 0;
    }

    // get payment received amount between registry date and today
    const [payments] = await pool.query(
      "SELECT SUM(CAST(Debit AS DECIMAL(10,2))) as totalPayments FROM accounting_accounts_log WHERE Accounting_Accounts_idAccounting_Accounts = ? AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d %H:%i:%s')) BETWEEN ? AND CURDATE() AND Type != 'Cashier Registry Start' AND Type != 'Cashier Registry Updated'",
      [cashierAccountId, latestRegistry[0].Date]
    );

    if (payments.length > 0) {
      paymentReceivedAmount = parseFloat(payments[0].totalPayments) || 0;
    }

    // get in account transfers between registry date and today
    const [inTransfers] = await pool.query(
      "SELECT SUM(CAST(Debit AS DECIMAL(10,2))) as totalIn FROM accounting_accounts_log WHERE Accounting_Accounts_idAccounting_Accounts = ? AND Type = 'Internal Account Transfer In' AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d %H:%i:%s')) BETWEEN ? AND CURDATE()",
      [cashierAccountId, latestRegistry[0].Date]
    );

    if (inTransfers.length > 0) {
      inAccountTransfers = parseFloat(inTransfers[0].totalIn) || 0;
    }

    // get out account transfers between registry date and today
    const [outTransfers] = await pool.query(
      "SELECT SUM(CAST(Credit AS DECIMAL(10,2))) as totalOut FROM accounting_accounts_log WHERE Accounting_Accounts_idAccounting_Accounts = ? AND Type = 'Internal Account Transfer Out' AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d %H:%i:%s')) BETWEEN ? AND CURDATE()",
      [cashierAccountId, latestRegistry[0].Date]
    );

    if (outTransfers.length > 0) {
      outAccountTransfers = parseFloat(outTransfers[0].totalOut) || 0;
    }

    // get paid daily expenses between registry date and today
    const [dailyExpenses] = await pool.query(
      "SELECT SUM(CAST(Credit AS DECIMAL(10,2))) as totalExpenses FROM accounting_accounts_log WHERE Accounting_Accounts_idAccounting_Accounts = ? AND Type = 'Daily Expense Paid' AND DATE(STR_TO_DATE(Date_Time, '%Y-%m-%d %H:%i:%s')) BETWEEN ? AND CURDATE()",
      [cashierAccountId, latestRegistry[0].Date]
    );

    if (dailyExpenses.length > 0) {
      paidDailyExpenses = parseFloat(dailyExpenses[0].totalExpenses) || 0;
    }

    res.status(200).json({
      success: true,
      message:
        "Cashier Account Day Log with Summary Cards fetched successfully",
      logs,
      pagination: paginationData,
      summaryCards: {
        dayStartBalance,
        currentBalance,
        ticketIssuedAmount,
        paymentReceivedAmount,
        inAccountTransfers,
        outAccountTransfers,
        paidDailyExpenses,
      },
    });
  } catch (error) {
    console.log("Get Cashier Account Day Log With Summary Cards error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// end cashier day
export const endCashierDay = async (req, res, next) => {
  let connection;

  try {
    const { fromAccountId, toAccountId, entries, note } = req.body;
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

    // validate note
    if (note && typeof note !== "string") {
      return next(errorHandler(400, "Note must be a string"));
    }

    if (note && note.length > 500) {
      return next(errorHandler(400, "Note cannot exceed 500 characters"));
    }

    // Fixed: Use new variable instead of reassigning const parameter
    const trimmedNote = note ? note.trim() : null;

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
        "Cashier Day End Transfer",
        req.userId
      );

      // Fixed: Declare variables at proper scope
      let date;
      let time;
      let existingRegistry;
      let dailyRegistryId;

      // Check if there is already a cashier registry started for the day
      [existingRegistry] = await connection.query(
        "SELECT * FROM daily_registry WHERE User_idUser = ? AND Date = CURDATE() AND (daily_registry_status = 1 OR daily_registry_status = 2) ORDER BY Date DESC, Time DESC LIMIT 1",
        [req.userId]
      );

      if (existingRegistry.length === 0) {
        // it is meaning that day start or update registry is not done for the day
        // and we have to find the latest registry which start or update before today
        [existingRegistry] = await connection.query(
          "SELECT * FROM daily_registry WHERE User_idUser = ? AND Date < CURDATE() AND (daily_registry_status = 1 OR daily_registry_status = 2) ORDER BY Date DESC, Time DESC LIMIT 1",
          [req.userId]
        );

        if (existingRegistry.length === 0) {
          await connection.rollback();
          return next(
            errorHandler(
              400,
              "No existing cashier registry start found to end the day"
            )
          );
        }
      }

      // Assign date and time after confirming existingRegistry has data
      date = existingRegistry[0].Date;
      time = existingRegistry[0].Time;

      // get the current user's latest registry row with 'Day Start' to get the Total_Amount and Created_at
      const [dailyRegistryRows] = await connection.query(
        "SELECT * FROM daily_registry WHERE User_idUser = ? AND Description = 'Day Start' ORDER BY idDaily_Registry DESC LIMIT 1",
        [req.userId]
      );
      if (dailyRegistryRows.length === 0) {
        await connection.rollback();
        return next(
          errorHandler(
            400,
            "No existing daily registry 'Day Start' record found for the user"
          )
        );
      }

      // insert entries to daily_registry and daily_registry_has_cash tables
      const [dailyRegistryResult] = await connection.query(
        "INSERT INTO daily_registry (Date, Time, Description, User_idUser, Total_Amount,daily_registry_status,note,Start_Date_Time,Start_Amount) VALUES (?, ?, ?, ?, ?,?,?,?,?)",
        [
          date,
          time,
          "Day End",
          req.userId,
          totalAmount,
          3,
          trimmedNote,
          dailyRegistryRows[0].Created_at,
          dailyRegistryRows[0].Total_Amount,
        ] // updated status 3 for registry day end
      );

      if (!dailyRegistryResult || dailyRegistryResult.affectedRows === 0) {
        await connection.rollback();
        return next(
          errorHandler(500, "Failed to update daily registry record as day end")
        );
      }

      dailyRegistryId = dailyRegistryResult.insertId;

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
            errorHandler(
              500,
              "Failed to create daily registry cash entry for day end"
            )
          );
        }
      }

      // Make a log entry for the cashier registry update
      await addCashierRegistryStartEndLog(
        connection,
        toAccountId,
        "Cashier Registry End",
        `Cashier registry End. Total Amount: ${totalAmount}`,
        totalAmount,
        0,
        newToAccountBalance,
        fromAccountId,
        req.userId
      );

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "Cashier day ended successfully",
        endRegistryId: dailyRegistryId,
      });
    } catch (error) {
      console.error("Transaction error:", error);
      await connection.rollback();
      return next(errorHandler(500, "Transaction failed, rolled back"));
    }
  } catch (error) {
    console.error("End Cashier Registry error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
// cashier day end print data
export const getCashierDayEndPrintData = async (req, res, next) => {
  try {
    const endRegistryId = req.params.id || req.params.endRegistryId;
    if (!endRegistryId) {
      return next(errorHandler(400, "End Registry ID is required"));
    }

    // fetch end registry data (include User_idUser so we can aggregate other registries for the same user/date)
    const [endRegistryResult] = await pool.query(
      "SELECT dr.idDaily_Registry, dr.Date, dr.Time, dr.Description, dr.Total_Amount, dr.note, dr.User_idUser, dr.Created_at, dr.Start_Date_Time, dr.Start_Amount, u.full_name as enteredUser FROM daily_registry dr JOIN user u ON dr.User_idUser = u.idUser WHERE dr.idDaily_Registry = ?",
      [endRegistryId]
    );

    if (endRegistryResult.length === 0) {
      return next(errorHandler(404, "End Registry not found"));
    }

    const endRegistry = endRegistryResult[0];

    // fetch cash entries for the end registry
    const [cashEntriesResult] = await pool.query(
      "SELECT Denomination, Quantity, Amount FROM daily_registry_has_cash WHERE Daily_registry_idDaily_Registry = ? ORDER BY Denomination DESC",
      [endRegistry.idDaily_Registry]
    );

    let cashEntries = [];
    if (cashEntriesResult.length > 0) {
      cashEntries = cashEntriesResult;
    }

    // Calculate total by denomination across all registries for the same user and date
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

    // get all registries for that user on the same date
    const [dailyRegistries] = await pool.query(
      "SELECT idDaily_Registry FROM daily_registry WHERE User_idUser = ? AND Date = ?",
      [endRegistry.User_idUser, endRegistry.Date]
    );

    if (dailyRegistries.length > 0) {
      // for each registry get cash entries and add to summary
      for (const registry of dailyRegistries) {
        const [entries] = await pool.query(
          "SELECT Denomination, Quantity, Amount FROM daily_registry_has_cash WHERE Daily_registry_idDaily_Registry = ?",
          [registry.idDaily_Registry]
        );

        entries.forEach((entry) => {
          const denom = parseInt(entry.Denomination);
          if (denominationSummary[denom]) {
            denominationSummary[denom].totalQuantity +=
              parseInt(entry.Quantity) || 0;
            denominationSummary[denom].totalAmount +=
              parseFloat(entry.Amount) || 0;
          }
        });
      }
    }

    // Convert denomination summary to array and filter out zero quantities
    const denominationSummaryArray = Object.values(denominationSummary)
      .filter((item) => item.totalQuantity > 0)
      .map((item) => ({
        ...item,
        totalAmount: Math.round(item.totalAmount * 100) / 100,
      }));

    // Logs data
    const [logs] = await pool.query(
      "SELECT aal.*, u.full_name as enteredUser FROM accounting_accounts_log aal JOIN user u ON aal.User_idUser = u.idUser WHERE aal.Accounting_Accounts_idAccounting_Accounts = ? AND DATE(STR_TO_DATE(aal.Date_Time, '%Y-%m-%d %H:%i:%s')) BETWEEN ? AND ? ORDER BY aal.idAccounting_Accounts_Log DESC",
      [
        req.params.accountId,
        endRegistry.Start_Date_Time,
        endRegistry.Created_at,
      ]
    );

    // start balane
    const startBalance = parseFloat(endRegistry.Start_Amount) || 0;

    // total payments received
    let totalPayments = 0;
    logs.forEach((log) => {
      if (
        log.Type !== "Cashier Registry Start" &&
        log.Type !== "Cashier Registry Updated"
      ) {
        totalPayments += parseFloat(log.Debit) || 0;
      }
    });
    totalPayments = Math.round(totalPayments * 100) / 100;

    // total ticket issued
    let totalTicketIssued = 0;
    logs.forEach((log) => {
      if (log.Type === "Ticket Loan Disbursement") {
        totalTicketIssued += parseFloat(log.Credit) || 0;
      }
    });
    totalTicketIssued = Math.round(totalTicketIssued * 100) / 100;

    // total expenses paid
    let totalExpensesPaid = 0;
    logs.forEach((log) => {
      if (log.Type === "Daily Expense Paid") {
        totalExpensesPaid += parseFloat(log.Credit) || 0;
      }
    });
    totalExpensesPaid = Math.round(totalExpensesPaid * 100) / 100;

    // total in account transfers
    let totalInAccountTransfers = 0;
    logs.forEach((log) => {
      if (log.Type === "Account Transfer In") {
        totalInAccountTransfers += parseFloat(log.Debit) || 0;
      }
    });
    totalInAccountTransfers = Math.round(totalInAccountTransfers * 100) / 100;

    // total out account transfers
    let totalOutAccountTransfers = 0;
    logs.forEach((log) => {
      if (log.Type === "Account Transfer Out") {
        totalOutAccountTransfers += parseFloat(log.Credit) || 0;
      }
    });
    totalOutAccountTransfers = Math.round(totalOutAccountTransfers * 100) / 100;

    // cashier account current balance with cashier data
    const [cashierAccount] = await pool.query(
      "SELECT ac.Account_Balance, u.full_name as cashierName, u.Email as cashierEmail, u.Contact_no as cashierContact FROM accounting_accounts ac JOIN user u ON ac.User_idUser = u.idUser WHERE ac.idAccounting_Accounts = ? AND ac.Branch_idBranch = ?",
      [req.params.accountId, req.branchId]
    );

    res.status(200).json({
      success: true,
      message: "Cashier Day End Print Data fetched successfully",
      printData: {
        endRegistry,
        cashEntries,
        denominationSummary: denominationSummaryArray,
        logs,
        summary: {
          startBalance,
          totalPayments,
          totalTicketIssued,
          totalExpensesPaid,
          totalInAccountTransfers,
          totalOutAccountTransfers,
        },
        cashierAccount: cashierAccount.length > 0 ? cashierAccount[0] : null,
      },
    });
  } catch (error) {
    console.error("Get Cashier Day End Print Data error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// check if there is a cashier start day to end
export const checkCashierDayEndAvailability = async (req, res, next) => {
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

    // Check if there is an active daily registry which is unsettled for the user
    const [activeRegistry] = await pool.query(
      "SELECT * FROM daily_registry WHERE User_idUser = ? AND (daily_registry_status = 1 OR daily_registry_status = 2) ORDER BY idDaily_Registry DESC LIMIT 1",
      [req.userId]
    );

    if (activeRegistry.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No active daily registry found to end the day",
        canEndDay: false,
      });
    }

    res.status(200).json({
      success: true,
      message: "Active daily registry found to end the day",
      canEndDay: true,
    });
  } catch (error) {
    console.error("Check Cashier Day End Availability error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
