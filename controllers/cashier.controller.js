import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";
import {
  addAccountTransferLogs,
  addCashierRegistryStartLog,
} from "../utils/accounting.account.logs.js";

export const startCashierRegistryForDay = async (req, res, next) => {
  let connection;

  try {
    const { fromAccountId, toAccountId, entries } = req.body;
    if (!fromAccountId || !toAccountId || !entries || entries.length === 0) {
      return next(
        errorHandler(400, "fromAccountId, toAccountId and entries are required")
      );
    }

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
    const denomination = [1, 2, 5, 10, 50, 100, 500, 1000, 5000];

    // validate entries
    for (const entry of entries) {
      if (!entry.amount || entry.amount <= 0) {
        return next(errorHandler(400, "Amount must be greater than 0"));
      }

      if (entry.denomination && entry.denomination <= 0) {
        return next(errorHandler(400, "Denomination must be greater than 0"));
      }
      if (entry.denomination && !denomination.includes(entry.denomination)) {
        return next(
          errorHandler(400, `Denomination ${entry.denomination} is not valid`)
        );
      }

      if (!entry.quantity || entry.quantity <= 0) {
        return next(errorHandler(400, "Quantity must be greater than 0"));
      }
    }

    // Calculate total amount from entries
    let totalAmount = 0;
    entries.forEach((entry) => {
      totalAmount += entry.amount * entry.quantity;
    });

    // Check if transfer from account has sufficient balance
    if (parseFloat(fromAccount[0].Account_Balance) < parseFloat(totalAmount)) {
      return next(
        errorHandler(400, "Insufficient balance in Transfer From Account")
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // deduct amount from fromAccount
      const newFromAccountBalance =
        parseFloat(fromAccount[0].Account_Balance) - totalAmount;
      await connection.query(
        "UPDATE accounting_accounts SET Current_Balance = ? WHERE idAccounting_Accounts = ?",
        [newFromAccountBalance, fromAccountId]
      );

      // add amount to toAccount
      const newToAccountBalance =
        parseFloat(toAccount[0].Account_Balance) + totalAmount;
      await connection.query(
        "UPDATE accounting_accounts SET Current_Balance = ? WHERE idAccounting_Accounts = ?",
        [newToAccountBalance, toAccountId]
      );

      // add account transfer logs for both accounts
      await addAccountTransferLogs(
        fromAccountId,
        toAccountId,
        fromAccount[0].Name,
        toAccount[0].Name,
        totalAmount,
        newFromAccountBalance,
        newToAccountBalance,
        "To get cash for cashier account",
        req.userId
      );

      // Check if there is already a cashier registry started for the day
      const [existingRegistry] = await connection.query(
        "SELECT * FROM daily_registry WHERE User_idUser = ? AND Date = CURDATE() AND Description = 'Day Start'",
        [req.userId]
      );

      if (existingRegistry.length > 0) {
        // insert entries to daily_registry and daily_registry_has_cash tables
        const [dailyRegistryResult] = await connection.query(
          "INSERT INTO daily_registry (Date,Time, Description, User_idUser,Total_Amount) VALUES (CURDATE(), CURTIME(), ?, ?,?)",
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
          const result = await connection.query(
            "INSERT INTO daily_registry_has_cash (Daily_registry_idDaily_Registry, Denomination, Quantity, Amount) VALUES (?, ?, ?, ?)",
            [
              dailyRegistryId,
              entry.denomination,
              entry.quantity,
              entry.amount * entry.quantity,
            ]
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
          "INSERT INTO daily_registry (Date,Time, Description, User_idUser,Total_Amount) VALUES (CURDATE(), CURTIME(), ?, ?,?)",
          ["Day Start", req.userId, totalAmount]
        );

        if (!dailyRegistryResult || dailyRegistryResult.affectedRows === 0) {
          await connection.rollback();
          return next(
            errorHandler(500, "Failed to create daily registry record")
          );
        }

        const dailyRegistryId = dailyRegistryResult.insertId;
        for (const entry of entries) {
          const result = await connection.query(
            "INSERT INTO daily_registry_has_cash (Daily_registry_idDaily_Registry, Denomination, Quantity, Amount) VALUES (?, ?, ?, ?)",
            [
              dailyRegistryId,
              entry.denomination,
              entry.quantity,
              entry.amount * entry.quantity,
            ]
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
