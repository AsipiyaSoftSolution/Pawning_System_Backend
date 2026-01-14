import { pool } from "../utils/db.js";
import { createCustomerLogOnTicketPenality } from "./customer.logs.js";

// Helper: record accounting entries for accrued interest
const recordInterestAccountingEntries = async (
  ticket,
  interestAmount,
  note,
) => {
  if (!interestAmount || interestAmount <= 0) return;

  const branchId = ticket?.Branch_idBranch;
  if (!branchId) return;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Fetch required accounts for this branch
    const [[pawningInterestReceivableAccount]] = await connection.query(
      "SELECT idAccounting_Accounts, Account_Balance FROM accounting_accounts WHERE Account_Type = 'Pawning Interest Receivable' AND Group_Of_Type = 'Assets' AND Branch_idBranch = ? LIMIT 1",
      [branchId],
    );

    const [[pawningInterestRevenueAccount]] = await connection.query(
      "SELECT idAccounting_Accounts, Account_Balance FROM accounting_accounts WHERE Account_Type = 'Pawning Interest Revenue' AND Group_Of_Type = 'Revenue' AND Branch_idBranch = ? LIMIT 1",
      [branchId],
    );

    if (!pawningInterestReceivableAccount || !pawningInterestRevenueAccount) {
      await connection.rollback();
      throw new Error(
        "Missing required accounting accounts for interest accrual",
      );
    }

    const ticketLabel = ticket?.Ticket_No
      ? `Ticket No: ${ticket.Ticket_No}`
      : `Ticket ID: ${ticket.idPawning_Ticket}`;
    const descriptionText =
      note || `Interest accrued for ${ticketLabel} (Daily process)`;

    // Debit Pawning Interest Receivable (Assets)
    const currentReceivableBalance =
      parseFloat(pawningInterestReceivableAccount.Account_Balance) || 0;
    const newReceivableBalance = currentReceivableBalance + interestAmount;

    await connection.query(
      "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ?",
      [
        newReceivableBalance,
        pawningInterestReceivableAccount.idAccounting_Accounts,
      ],
    );

    await connection.query(
      "INSERT INTO accounting_accounts_log (Accounting_Accounts_idAccounting_Accounts, Date_Time, Type, Description, Debit, Credit, Balance, Contra_Account, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        pawningInterestReceivableAccount.idAccounting_Accounts,
        new Date(),
        "Pawning Interest Accrual",
        descriptionText,
        interestAmount,
        0,
        newReceivableBalance,
        pawningInterestRevenueAccount.idAccounting_Accounts,
        null,
      ],
    );

    // Credit Pawning Interest Revenue (Revenue)
    const currentRevenueBalance =
      parseFloat(pawningInterestRevenueAccount.Account_Balance) || 0;
    const newRevenueBalance = currentRevenueBalance + interestAmount;

    await connection.query(
      "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ?",
      [newRevenueBalance, pawningInterestRevenueAccount.idAccounting_Accounts],
    );

    await connection.query(
      "INSERT INTO accounting_accounts_log (Accounting_Accounts_idAccounting_Accounts, Date_Time, Type, Description, Debit, Credit, Balance, Contra_Account, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        pawningInterestRevenueAccount.idAccounting_Accounts,
        new Date(),
        "Pawning Interest Accrual",
        descriptionText,
        0,
        interestAmount,
        newRevenueBalance,
        pawningInterestReceivableAccount.idAccounting_Accounts,
        null,
      ],
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error("Failed to record interest accounting entries:", err);
  } finally {
    connection.release();
  }
};

// Helper: record accounting entries for accrued penalties/overdue charges
const recordPenaltyAccountingEntries = async (ticket, penaltyAmount, note) => {
  if (!penaltyAmount || penaltyAmount <= 0) return;

  const branchId = ticket?.Branch_idBranch;
  if (!branchId) return;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[penaltyReceivableAccount]] = await connection.query(
      "SELECT idAccounting_Accounts, Account_Balance FROM accounting_accounts WHERE Account_Type = 'Penalty / Overdue Charges Receivable' AND Group_Of_Type = 'Assets' AND Branch_idBranch = ? LIMIT 1",
      [branchId],
    );

    const [[penaltyRevenueAccount]] = await connection.query(
      "SELECT idAccounting_Accounts, Account_Balance FROM accounting_accounts WHERE Account_Type = 'Penalty / Overdue Charges Revenue' AND Group_Of_Type = 'Revenue' AND Branch_idBranch = ? LIMIT 1",
      [branchId],
    );

    if (!penaltyReceivableAccount || !penaltyRevenueAccount) {
      await connection.rollback();
      throw new Error(
        "Missing required accounting accounts for penalty accrual",
      );
    }

    const ticketLabel = ticket?.Ticket_No
      ? `Ticket No: ${ticket.Ticket_No}`
      : `Ticket ID: ${ticket.idPawning_Ticket}`;
    const descriptionText =
      note || `Penalty accrued for ${ticketLabel} (Daily process)`;

    // Debit Penalty / Overdue Charges Receivable (Assets)
    const currentReceivableBalance =
      parseFloat(penaltyReceivableAccount.Account_Balance) || 0;
    const newReceivableBalance = currentReceivableBalance + penaltyAmount;

    await connection.query(
      "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ?",
      [newReceivableBalance, penaltyReceivableAccount.idAccounting_Accounts],
    );

    await connection.query(
      "INSERT INTO accounting_accounts_log (Accounting_Accounts_idAccounting_Accounts, Date_Time, Type, Description, Debit, Credit, Balance, Contra_Account, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        penaltyReceivableAccount.idAccounting_Accounts,
        new Date(),
        "Penalty Accrual",
        descriptionText,
        penaltyAmount,
        0,
        newReceivableBalance,
        penaltyRevenueAccount.idAccounting_Accounts,
        null,
      ],
    );

    // Credit Penalty / Overdue Charges Revenue (Revenue)
    const currentRevenueBalance =
      parseFloat(penaltyRevenueAccount.Account_Balance) || 0;
    const newRevenueBalance = currentRevenueBalance + penaltyAmount;

    await connection.query(
      "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ?",
      [newRevenueBalance, penaltyRevenueAccount.idAccounting_Accounts],
    );

    await connection.query(
      "INSERT INTO accounting_accounts_log (Accounting_Accounts_idAccounting_Accounts, Date_Time, Type, Description, Debit, Credit, Balance, Contra_Account, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        penaltyRevenueAccount.idAccounting_Accounts,
        new Date(),
        "Penalty Accrual",
        descriptionText,
        0,
        penaltyAmount,
        newRevenueBalance,
        penaltyReceivableAccount.idAccounting_Accounts,
        null,
      ],
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error("Failed to record penalty accounting entries:", err);
  } finally {
    connection.release();
  }
};
// this runs when a new pawning ticket is created
export const createPawningTicketLogOnCreate = async (
  ticketId,
  type,
  userId,
  amount,
) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO ticket_log (
        Pawning_Ticket_idPawning_Ticket, Type, Type_Id, User_idUser, Date_Time,
        Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Aditional_Charge_Balance, Total_Balance, Late_Charges_Balance
      ) VALUES (?, ?, ?, ?, NOW(), ?, ?, 0, 0, 0, ?, 0)`,
      [ticketId, type, ticketId, userId, amount, amount, amount],
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to create pawning ticket log");
    }
  } catch (error) {
    console.error("Error creating pawning ticket log:", error);
    throw new Error("Error creating pawning ticket log");
  }
};

// after the above log is created, this runs in order to mark the service charge
export const markServiceChargeInTicketLog = async (
  ticketId,
  type,
  userId,
  serviceCharge,
) => {
  try {
    const [latestChargeResult] = await pool.query(
      "SELECT Advance_Balance FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
      [ticketId],
    );

    const advanceBalance = Number(latestChargeResult[0]?.Advance_Balance) || 0;
    const totalBalance = advanceBalance + Number(serviceCharge);

    const [result] = await pool.query(
      "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser,Date_Time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      [
        ticketId,
        type,
        serviceCharge,
        advanceBalance,
        0,
        serviceCharge,
        0,
        0,
        totalBalance,
        userId,
      ],
    );
    if (result.affectedRows === 0) {
      throw new Error("Failed to mark service charge in pawning ticket log");
    }
  } catch (error) {
    console.error("Error marking service charge in pawning ticket log:", error);
    throw new Error("Error marking service charge in pawning ticket log");
  }
};

// run every day 12AM to add ticket logs (includes missed days)
export const addDailyTicketLog = async () => {
  try {
    // go through every ticket in the db and get only tickets that are Status = '1' (active)
    const [activeTicketResult] = await pool.query(
      "SELECT * FROM pawning_ticket WHERE Status = '1'",
    );

    // circle through each ticket
    for (const ticket of activeTicketResult) {
      const ticketId = ticket.idPawning_Ticket;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if ticket has stage-based interest system
      const hasStages =
        ticket.stage1StartDate &&
        ticket.stage1EndDate &&
        ticket.stage2StartDate &&
        ticket.stage2EndDate &&
        ticket.stage3StartDate &&
        ticket.stage3EndDate &&
        ticket.stage4StartDate &&
        ticket.stage4EndDate;

      if (hasStages) {
        // STAGE-BASED INTEREST SYSTEM
        const ticketStartDate = new Date(ticket.Date_Time);
        ticketStartDate.setHours(0, 0, 0, 0);

        // Parse stage data
        const stages = [
          {
            num: 1,
            startDay: parseInt(ticket.stage1StartDate),
            endDay: parseInt(ticket.stage1EndDate),
            interest: parseFloat(ticket.stage1Interest) || 0,
          },
          {
            num: 2,
            startDay: parseInt(ticket.stage2StartDate),
            endDay: parseInt(ticket.stage2EndDate),
            interest: parseFloat(ticket.stage2Interest) || 0,
          },
          {
            num: 3,
            startDay: parseInt(ticket.stage3StartDate),
            endDay: parseInt(ticket.stage3EndDate),
            interest: parseFloat(ticket.stage3Interest) || 0,
          },
          {
            num: 4,
            startDay: parseInt(ticket.stage4StartDate),
            endDay: parseInt(ticket.stage4EndDate),
            interest: parseFloat(ticket.stage4Interest) || 0,
          },
        ];

        // Calculate days since ticket creation
        const daysSinceCreation = Math.floor(
          (today - ticketStartDate) / (1000 * 60 * 60 * 24),
        );

        // Process stages 1-3 (one-time interest)
        for (let i = 0; i < 3; i++) {
          const stage = stages[i];

          // Only process this stage if we have reached or passed it (daysSinceCreation >= stage.startDay)
          if (daysSinceCreation >= stage.startDay) {
            // Check if interest log already exists for this stage
            const [existingStageLog] = await pool.query(
              "SELECT 1 FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'INTEREST' AND Description LIKE ?",
              [ticketId, `%Stage ${stage.num}%`],
            );

            // If log exists, skip this stage
            if (existingStageLog.length === 0) {
              // Calculate the actual date for stage start
              const stageStartDate = new Date(ticketStartDate);
              stageStartDate.setDate(stageStartDate.getDate() + stage.startDay);
              const stageStartDateString = stageStartDate
                .toISOString()
                .split("T")[0];

              // Get the latest log for this ticket
              const [latestLogResult] = await pool.query(
                "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
                [ticketId],
              );

              const latestAdvanceBalance =
                parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
              const interestAmount =
                (latestAdvanceBalance * stage.interest) / 100;

              const latestInterestBalance =
                parseFloat(latestLogResult[0]?.Interest_Balance) || 0;
              const latestServiceChargeBalance =
                parseFloat(latestLogResult[0]?.Service_Charge_Balance) || 0;
              const latestLateChargesBalance =
                parseFloat(latestLogResult[0]?.Late_Charges_Balance) || 0;
              const latestAdditionalChargeBalance =
                parseFloat(latestLogResult[0]?.Aditional_Charge_Balance) || 0;

              const totalBalance =
                latestAdvanceBalance +
                (latestInterestBalance + interestAmount) +
                latestServiceChargeBalance +
                latestLateChargesBalance +
                latestAdditionalChargeBalance;

              // Insert stage interest log
              await pool.query(
                "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                  ticketId,
                  "INTEREST",
                  `${stageStartDateString} - Stage ${stage.num}`,
                  interestAmount,
                  latestAdvanceBalance,
                  latestInterestBalance + interestAmount,
                  latestServiceChargeBalance,
                  latestLateChargesBalance,
                  latestAdditionalChargeBalance,
                  totalBalance,
                  null,
                ],
              );

              await recordInterestAccountingEntries(
                ticket,
                interestAmount,
                `${stageStartDateString} - Stage ${stage.num} interest accrual`,
              );
            }
          }
        }

        // Process stage 4 (daily interest)
        const stage4 = stages[3];

        // Only process stage 4 if we have reached or passed it
        if (daysSinceCreation >= stage4.startDay) {
          const stage4StartDate = new Date(ticketStartDate);
          stage4StartDate.setDate(stage4StartDate.getDate() + stage4.startDay);
          stage4StartDate.setHours(0, 0, 0, 0);

          // Get the last stage 4 log to determine where to start
          const [lastStage4Log] = await pool.query(
            "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'INTEREST' AND Description LIKE '%Stage 4%' ORDER BY idTicket_Log DESC LIMIT 1",
            [ticketId],
          );

          let startDate = new Date(stage4StartDate);
          if (lastStage4Log.length > 0) {
            const lastLogDateStr = lastStage4Log[0].Description.split(" - ")[0];
            const lastLogDate = new Date(lastLogDateStr);
            lastLogDate.setHours(0, 0, 0, 0);
            startDate = new Date(lastLogDate);
            startDate.setDate(startDate.getDate() + 1); // Start from next day
          }

          // Add daily interest logs for stage 4
          for (
            let currentDate = new Date(startDate);
            currentDate <= today;
            currentDate.setDate(currentDate.getDate() + 1)
          ) {
            const dateString = currentDate.toISOString().split("T")[0];

            // Get the latest log for this ticket
            const [latestLogResult] = await pool.query(
              "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
              [ticketId],
            );

            const latestAdvanceBalance =
              parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
            const dailyInterestRate = stage4.interest / 30; // Monthly rate to daily
            const interestAmount =
              (latestAdvanceBalance * dailyInterestRate) / 100;

            const latestInterestBalance =
              parseFloat(latestLogResult[0]?.Interest_Balance) || 0;
            const latestServiceChargeBalance =
              parseFloat(latestLogResult[0]?.Service_Charge_Balance) || 0;
            const latestLateChargesBalance =
              parseFloat(latestLogResult[0]?.Late_Charges_Balance) || 0;
            const latestAdditionalChargeBalance =
              parseFloat(latestLogResult[0]?.Aditional_Charge_Balance) || 0;

            const totalBalance =
              latestAdvanceBalance +
              (latestInterestBalance + interestAmount) +
              latestServiceChargeBalance +
              latestLateChargesBalance +
              latestAdditionalChargeBalance;

            // Insert daily stage 4 interest log
            await pool.query(
              "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [
                ticketId,
                "INTEREST",
                `${dateString} - Stage 4`,
                interestAmount,
                latestAdvanceBalance,
                latestInterestBalance + interestAmount,
                latestServiceChargeBalance,
                latestLateChargesBalance,
                latestAdditionalChargeBalance,
                totalBalance,
                null,
              ],
            );

            await recordInterestAccountingEntries(
              ticket,
              interestAmount,
              `${dateString} - Stage 4 interest accrual`,
            );
          }
        }

        // Handle penalty for stage-based system (daily penalties after maturity)
        const maturityDate = new Date(ticket.Maturity_date);
        maturityDate.setHours(0, 0, 0, 0);

        if (today > maturityDate) {
          // Get the last penalty log to determine where to start
          const [lastPenaltyLog] = await pool.query(
            "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'PENALTY' ORDER BY idTicket_Log DESC LIMIT 1",
            [ticketId],
          );

          let penaltyStartDate = new Date(maturityDate);
          penaltyStartDate.setDate(penaltyStartDate.getDate() + 1); // Start from day after maturity

          if (lastPenaltyLog.length > 0) {
            const lastPenaltyDateStr = lastPenaltyLog[0].Description;
            const lastPenaltyDate = new Date(lastPenaltyDateStr);
            lastPenaltyDate.setHours(0, 0, 0, 0);
            penaltyStartDate = new Date(lastPenaltyDate);
            penaltyStartDate.setDate(penaltyStartDate.getDate() + 1); // Start from next day
          }

          // Add interest and penalty for each day from penaltyStartDate to today
          for (
            let currentDate = new Date(penaltyStartDate);
            currentDate <= today;
            currentDate.setDate(currentDate.getDate() + 1)
          ) {
            const dateString = currentDate.toISOString().split("T")[0];

            // FIRST: Add interest log for the day
            const [latestLogForInterest] = await pool.query(
              "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
              [ticketId],
            );

            const latestAdvanceBalanceForInterest =
              parseFloat(latestLogForInterest[0]?.Advance_Balance) || 0;

            // Determine which stage we're in for interest calculation
            const daysSinceCreationForInterest = Math.floor(
              (currentDate - ticketStartDate) / (1000 * 60 * 60 * 24),
            );
            let interestAmount = 0;
            let interestDescription = "";

            // Check if we're in stage 4 (daily interest)
            if (daysSinceCreationForInterest >= stage4.startDay) {
              const dailyInterestRate = stage4.interest / 30;
              interestAmount =
                (latestAdvanceBalanceForInterest * dailyInterestRate) / 100;
              interestDescription = `${dateString} - Stage 4`;
            }

            if (interestAmount > 0) {
              const latestInterestBalanceForInterest =
                parseFloat(latestLogForInterest[0]?.Interest_Balance) || 0;
              const latestServiceChargeBalanceForInterest =
                parseFloat(latestLogForInterest[0]?.Service_Charge_Balance) ||
                0;
              const latestLateChargesBalanceForInterest =
                parseFloat(latestLogForInterest[0]?.Late_Charges_Balance) || 0;
              const latestAdditionalChargeBalanceForInterest =
                parseFloat(latestLogForInterest[0]?.Aditional_Charge_Balance) ||
                0;

              const totalBalanceForInterest =
                latestAdvanceBalanceForInterest +
                (latestInterestBalanceForInterest + interestAmount) +
                latestServiceChargeBalanceForInterest +
                latestLateChargesBalanceForInterest +
                latestAdditionalChargeBalanceForInterest;

              await pool.query(
                "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                  ticketId,
                  "INTEREST",
                  interestDescription,
                  interestAmount,
                  latestAdvanceBalanceForInterest,
                  latestInterestBalanceForInterest + interestAmount,
                  latestServiceChargeBalanceForInterest,
                  latestLateChargesBalanceForInterest,
                  latestAdditionalChargeBalanceForInterest,
                  totalBalanceForInterest,
                  null,
                ],
              );

              await recordInterestAccountingEntries(
                ticket,
                interestAmount,
                `${interestDescription} accrual`,
              );
            }

            // SECOND: Add penalty log for the day (after interest)
            const [latestLogForPenalty] = await pool.query(
              "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
              [ticketId],
            );

            const lateChargePercentage =
              parseFloat(ticket.Late_charge_Presentage) || 0;
            const latestAdvanceBalance =
              parseFloat(latestLogForPenalty[0]?.Advance_Balance) || 0;
            const penaltyAmount =
              (latestAdvanceBalance * lateChargePercentage) / 100;

            const latestInterestBalance =
              parseFloat(latestLogForPenalty[0]?.Interest_Balance) || 0;
            const latestServiceChargeBalance =
              parseFloat(latestLogForPenalty[0]?.Service_Charge_Balance) || 0;
            const latestLateChargesBalance =
              parseFloat(latestLogForPenalty[0]?.Late_Charges_Balance) || 0;
            const latestAdditionalChargeBalance =
              parseFloat(latestLogForPenalty[0]?.Aditional_Charge_Balance) || 0;

            const totalBalance =
              latestAdvanceBalance +
              latestInterestBalance +
              latestServiceChargeBalance +
              (latestLateChargesBalance + penaltyAmount) +
              latestAdditionalChargeBalance;

            await createCustomerLogOnTicketPenality(
              "TICKET PENALTY",
              `Penalty of ${penaltyAmount} added to ticket ID ${ticketId} on ${dateString}`,
              ticket.Customer_idCustomer,
              null,
            );

            await pool.query(
              "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [
                ticketId,
                "PENALTY",
                dateString,
                penaltyAmount,
                latestAdvanceBalance,
                latestInterestBalance,
                latestServiceChargeBalance,
                latestLateChargesBalance + penaltyAmount,
                latestAdditionalChargeBalance,
                totalBalance,
                null,
              ],
            );

            await recordPenaltyAccountingEntries(
              ticket,
              penaltyAmount,
              `${dateString} penalty accrual`,
            );
          }

          // Update ticket status to '3' (overdue) if not already
          if (ticket.Status !== "3") {
            await pool.query(
              "UPDATE pawning_ticket SET Status = '3' WHERE idPawning_Ticket = ?",
              [ticketId],
            );
          }
        }
      } else {
        // ORIGINAL INTEREST SYSTEM (NO STAGES)
        const interestApplyOn = new Date(ticket.Interest_apply_on);
        const maturityDate = new Date(ticket.Maturity_date);

        interestApplyOn.setHours(0, 0, 0, 0);
        maturityDate.setHours(0, 0, 0, 0);

        const [lastLogResult] = await pool.query(
          "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND (Type = 'INTEREST' OR Type = 'PENALTY') ORDER BY idTicket_Log DESC LIMIT 1",
          [ticketId],
        );

        let startDate = new Date(interestApplyOn);
        if (lastLogResult.length > 0) {
          const lastLogDate = new Date(lastLogResult[0].Description);
          lastLogDate.setHours(0, 0, 0, 0);
          startDate = new Date(lastLogDate);
          startDate.setDate(startDate.getDate() + 1);
        }

        for (
          let currentDate = new Date(startDate);
          currentDate <= today;
          currentDate.setDate(currentDate.getDate() + 1)
        ) {
          const dateString = currentDate.toISOString().split("T")[0];

          if (currentDate < interestApplyOn) {
            continue;
          }

          const shouldAddInterest = currentDate >= interestApplyOn;
          const shouldAddPenalty = currentDate > maturityDate;

          // Add interest log first if needed
          if (shouldAddInterest) {
            const [existingInterestLog] = await pool.query(
              "SELECT 1 FROM ticket_log WHERE Description = ? AND Type = 'INTEREST' AND Pawning_Ticket_idPawning_Ticket = ?",
              [dateString, ticketId],
            );

            if (existingInterestLog.length === 0) {
              const [latestLogResult] = await pool.query(
                "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
                [ticketId],
              );

              const interestTypeDuration =
                ticket.Interest_Rate_Duration || "N/A";
              const interestRateType = ticket.Interest_Rate_Type || "FLAT";
              let interestRate = parseFloat(ticket.Interest_Rate) || 0;

              const latestAdvanceBalance =
                parseFloat(latestLogResult[0]?.Advance_Balance) || 0;

              if (interestTypeDuration === "perMonth") {
                interestRate = interestRate / 30;
              } else if (interestTypeDuration === "perYear") {
                interestRate = interestRate / 365;
              } else if (interestTypeDuration === "perWeek") {
                interestRate = interestRate / 7;
              }

              const interestAmount =
                (latestAdvanceBalance * interestRate) / 100;

              const latestInterestBalance =
                parseFloat(latestLogResult[0]?.Interest_Balance) || 0;
              const latestServiceChargeBalance =
                parseFloat(latestLogResult[0]?.Service_Charge_Balance) || 0;
              const latestLateChargesBalance =
                parseFloat(latestLogResult[0]?.Late_Charges_Balance) || 0;
              const latestAdditionalChargeBalance =
                parseFloat(latestLogResult[0]?.Aditional_Charge_Balance) || 0;

              const totalBalance =
                latestAdvanceBalance +
                (latestInterestBalance + interestAmount) +
                latestServiceChargeBalance +
                latestLateChargesBalance +
                latestAdditionalChargeBalance;

              const [result] = await pool.query(
                "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                  ticketId,
                  "INTEREST",
                  dateString,
                  interestAmount,
                  latestAdvanceBalance,
                  latestInterestBalance + interestAmount,
                  latestServiceChargeBalance,
                  latestLateChargesBalance,
                  latestAdditionalChargeBalance,
                  totalBalance,
                  null,
                ],
              );

              if (result.affectedRows === 0) {
                throw new Error(
                  `Failed to add interest ticket log for ${dateString}`,
                );
              }

              await recordInterestAccountingEntries(
                ticket,
                interestAmount,
                `${dateString} interest accrual`,
              );
            }
          }

          // Add penalty log after interest (if needed)
          if (shouldAddPenalty) {
            const [existingPenaltyLog] = await pool.query(
              "SELECT 1 FROM ticket_log WHERE Description = ? AND Type = 'PENALTY' AND Pawning_Ticket_idPawning_Ticket = ?",
              [dateString, ticketId],
            );

            if (existingPenaltyLog.length === 0) {
              const [latestLogResult] = await pool.query(
                "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
                [ticketId],
              );

              const lateChargePercentage =
                parseFloat(ticket.Late_charge_Presentage) || 0;
              const latestAdvanceBalance =
                parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
              const penaltyAmount =
                (latestAdvanceBalance * lateChargePercentage) / 100;

              const latestInterestBalance =
                parseFloat(latestLogResult[0]?.Interest_Balance) || 0;
              const latestServiceChargeBalance =
                parseFloat(latestLogResult[0]?.Service_Charge_Balance) || 0;
              const latestLateChargesBalance =
                parseFloat(latestLogResult[0]?.Late_Charges_Balance) || 0;
              const latestAdditionalChargeBalance =
                parseFloat(latestLogResult[0]?.Aditional_Charge_Balance) || 0;

              const totalBalance =
                latestAdvanceBalance +
                latestInterestBalance +
                latestServiceChargeBalance +
                (latestLateChargesBalance + penaltyAmount) +
                latestAdditionalChargeBalance;

              await createCustomerLogOnTicketPenality(
                "TICKET PENALTY",
                `Penalty of ${penaltyAmount} added to ticket ID ${ticketId} on ${dateString}`,
                ticket.Customer_idCustomer,
                null,
              );

              await pool.query(
                "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                  ticketId,
                  "PENALTY",
                  dateString,
                  penaltyAmount,
                  latestAdvanceBalance,
                  latestInterestBalance,
                  latestServiceChargeBalance,
                  latestLateChargesBalance + penaltyAmount,
                  latestAdditionalChargeBalance,
                  totalBalance,
                  null,
                ],
              );

              // Update ticket status to '3' (overdue) only once
              if (ticket.Status !== "3") {
                const [updateResult] = await pool.query(
                  "UPDATE pawning_ticket SET Status = '3' WHERE idPawning_Ticket = ?",
                  [ticketId],
                );

                if (updateResult.affectedRows === 0) {
                  throw new Error(
                    `Failed to update ticket status to overdue for ticket ID ${ticketId}`,
                  );
                }
              }

              await recordPenaltyAccountingEntries(
                ticket,
                penaltyAmount,
                `${dateString} penalty accrual`,
              );
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error adding daily ticket log:", error);
    throw new Error("Error adding daily ticket log");
  }
};

// Function to process logs for a single ticket (used when creating old pawning tickets)
export const addTicketLogsByTicketId = async (ticketId) => {
  try {
    // Get the specific ticket
    const [ticketResult] = await pool.query(
      "SELECT * FROM pawning_ticket WHERE idPawning_Ticket = ?",
      [ticketId],
    );

    if (ticketResult.length === 0) {
      throw new Error(`Ticket with ID ${ticketId} not found or not active`);
    }

    const ticket = ticketResult[0];
    const interestApplyOn = new Date(ticket.Interest_apply_on);
    const maturityDate = new Date(ticket.Maturity_date);
    const today = new Date();

    // Set time to start of day for consistent comparison
    today.setHours(0, 0, 0, 0);
    interestApplyOn.setHours(0, 0, 0, 0);
    maturityDate.setHours(0, 0, 0, 0);

    // Get the last log date for this ticket to determine where to start backfilling
    const [lastLogResult] = await pool.query(
      "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND (Type = 'INTEREST' OR Type = 'PENALTY') ORDER BY idTicket_Log DESC LIMIT 1",
      [ticketId],
    );

    // Determine the start date for processing logs
    let startDate = new Date(interestApplyOn);
    if (lastLogResult.length > 0) {
      const lastLogDate = new Date(lastLogResult[0].Description);
      lastLogDate.setHours(0, 0, 0, 0);
      startDate = new Date(lastLogDate);
      startDate.setDate(startDate.getDate() + 1); // Start from the day after the last log
    }

    // Process each day from startDate to today
    for (
      let currentDate = new Date(startDate);
      currentDate <= today;
      currentDate.setDate(currentDate.getDate() + 1)
    ) {
      const dateString = currentDate.toISOString().split("T")[0];

      // Skip if this date is before interest apply on date
      if (currentDate < interestApplyOn) {
        continue;
      }

      // Determine what logs to add for this date
      const shouldAddInterest = currentDate >= interestApplyOn;
      const shouldAddPenalty = currentDate > maturityDate;

      // ADD INTEREST LOG

      if (shouldAddInterest) {
        // Check if interest log already exists for this date
        const [existingInterestLog] = await pool.query(
          "SELECT 1 FROM ticket_log WHERE Description = ? AND Type = 'INTEREST' AND Pawning_Ticket_idPawning_Ticket = ?",
          [dateString, ticketId],
        );

        if (existingInterestLog.length === 0) {
          // Get the latest log for this ticket to get the latest balances
          const [latestLogResult] = await pool.query(
            "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
            [ticketId],
          );

          // Calculate interest
          const interestRate = parseFloat(ticket.Interest_Rate) || 0;
          const latestAdvanceBalance =
            parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
          const interestAmount = (latestAdvanceBalance * interestRate) / 100;

          const latestInterestBalance =
            parseFloat(latestLogResult[0]?.Interest_Balance) || 0;
          const latestServiceChargeBalance =
            parseFloat(latestLogResult[0]?.Service_Charge_Balance) || 0;
          const latestLateChargesBalance =
            parseFloat(latestLogResult[0]?.Late_Charges_Balance) || 0;
          const latestAdditionalChargeBalance =
            parseFloat(latestLogResult[0]?.Aditional_Charge_Balance) || 0;

          const totalBalance =
            latestAdvanceBalance +
            (latestInterestBalance + interestAmount) +
            latestServiceChargeBalance +
            latestLateChargesBalance +
            latestAdditionalChargeBalance;

          // Insert interest log
          const [result] = await pool.query(
            "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              ticketId,
              "INTEREST",
              dateString,
              interestAmount,
              latestAdvanceBalance,
              latestInterestBalance + interestAmount,
              latestServiceChargeBalance,
              latestLateChargesBalance,
              latestAdditionalChargeBalance,
              totalBalance,
              null,
            ],
          );

          if (result.affectedRows === 0) {
            throw new Error(
              `Failed to add interest ticket log for ${dateString}`,
            );
          }
        }
      }

      // ADD PENALTY LOG

      if (shouldAddPenalty) {
        // Check if penalty log already exists for this date
        const [existingPenaltyLog] = await pool.query(
          "SELECT 1 FROM ticket_log WHERE Description = ? AND Type = 'PENALTY' AND Pawning_Ticket_idPawning_Ticket = ?",
          [dateString, ticketId],
        );

        if (existingPenaltyLog.length === 0) {
          // Get the latest log for this ticket to get the latest balances
          const [latestLogResult] = await pool.query(
            "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
            [ticketId],
          );

          // Calculate penalty
          const lateChargePercentage =
            parseFloat(ticket.Late_charge_Precentage) || 0;
          const latestAdvanceBalance =
            parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
          const penaltyAmount =
            (latestAdvanceBalance * lateChargePercentage) / 100;

          const latestInterestBalance =
            parseFloat(latestLogResult[0]?.Interest_Balance) || 0;
          const latestServiceChargeBalance =
            parseFloat(latestLogResult[0]?.Service_Charge_Balance) || 0;
          const latestLateChargesBalance =
            parseFloat(latestLogResult[0]?.Late_Charges_Balance) || 0;
          const latestAdditionalChargeBalance =
            parseFloat(latestLogResult[0]?.Aditional_Charge_Balance) || 0;

          const totalBalance =
            latestAdvanceBalance +
            latestInterestBalance +
            latestServiceChargeBalance +
            (latestLateChargesBalance + penaltyAmount) +
            latestAdditionalChargeBalance;

          // Insert penalty log
          const [result] = await pool.query(
            "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              ticketId,
              "PENALTY",
              dateString,
              penaltyAmount,
              latestAdvanceBalance,
              latestInterestBalance,
              latestServiceChargeBalance,
              latestLateChargesBalance + penaltyAmount,
              latestAdditionalChargeBalance,
              totalBalance,
              null,
            ],
          );

          if (result.affectedRows === 0) {
            throw new Error(
              `Failed to add penalty ticket log for ${dateString}`,
            );
          }

          await recordPenaltyAccountingEntries(
            ticket,
            penaltyAmount,
            `${dateString} penalty accrual`,
          );

          if (ticket.Status !== "3") {
            // Update ticket status to '3' which stand for overdue
            const [updateResult] = await pool.query(
              "UPDATE pawning_ticket SET Status = '3' WHERE idPawning_Ticket = ?",
              [ticketId],
            );
          }
          if (updateResult.affectedRows === 0) {
            throw new Error(
              `Failed to update ticket status to overdue for ticket ID ${ticketId}`,
            );
          }

          // Create customer log for penalty

          await createCustomerLogOnTicketPenality(
            "TICKET PENALTY",
            `Penalty of ${penaltyAmount} added to ticket ID ${ticketId} on ${dateString}`,
            ticketResult.Customer_idCustomer,
            null,
          );
        }
      }
    }

    return {
      success: true,
      message: `Successfully processed ticket ${ticketId}`,
    };
  } catch (error) {
    console.error(`Error adding ticket logs for ticket ${ticketId}:`, error);
    throw new Error(
      `Error adding ticket logs for ticket ${ticketId}: ${error.message}`,
    );
  }
};

// Function to run on when a ticket got a new additonal charge
export const createPawningTicketLogOnAdditionalCharge = async (
  ticketId,
  type,
  userId,
  amount,
) => {
  try {
    const [latestLogResult] = await pool.query(
      "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
      [ticketId],
    );

    const latestAdvanceBalance =
      parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
    const latestInterestBalance =
      parseFloat(latestLogResult[0]?.Interest_Balance) || 0;
    const latestServiceChargeBalance =
      parseFloat(latestLogResult[0]?.Service_Charge_Balance) || 0;
    const latestLateChargesBalance =
      parseFloat(latestLogResult[0]?.Late_Charges_Balance) || 0;
    const latestAdditionalChargeBalance =
      parseFloat(latestLogResult[0]?.Aditional_Charge_Balance) || 0;
    const newAdditionalCharge = parseFloat(amount) || 0;

    const totalBalance =
      latestAdvanceBalance +
      latestInterestBalance +
      latestServiceChargeBalance +
      latestLateChargesBalance +
      (latestAdditionalChargeBalance + newAdditionalCharge);

    const [result] = await pool.query(
      "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser, Date_Time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      [
        ticketId,
        type,
        newAdditionalCharge,
        latestAdvanceBalance,
        latestInterestBalance,
        latestServiceChargeBalance,
        latestLateChargesBalance,
        latestAdditionalChargeBalance + newAdditionalCharge,
        totalBalance,
        userId,
      ],
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to create additional charge ticket log");
    }
  } catch (error) {
    console.error("Error creating additional charge ticket log:", error);
    throw new Error("Error creating additional charge ticket log");
  }
};

// create a log when a ticket is approved
export const createPawningTicketLogOnApprovalandLoanDisbursement = async (
  ticketId,
  typeId,
  type,
  description,
  userId,
) => {
  try {
    // get the lastest ticket log
    const [latestLogResult] = await pool.query(
      "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
      [ticketId],
    );

    const latestAdvanceBalance =
      parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
    const latestInterestBalance =
      parseFloat(latestLogResult[0]?.Interest_Balance) || 0;
    const latestServiceChargeBalance =
      parseFloat(latestLogResult[0]?.Service_Charge_Balance) || 0;
    const latestLateChargesBalance =
      parseFloat(latestLogResult[0]?.Late_Charges_Balance) || 0;
    const latestAdditionalChargeBalance =
      parseFloat(latestLogResult[0]?.Aditional_Charge_Balance) || 0;
    const latestAmount = parseFloat(latestLogResult[0]?.Amount) || 0;
    const latestTotalBalance =
      parseFloat(latestLogResult[0]?.Total_Balance) || 0;

    const [result] = await pool.query(
      "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Type_Id, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser, Date_Time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      [
        ticketId,
        type,
        typeId,
        description,
        type === "APPROVE-TICKET" || type === "LOAN-DISBURSEMENT"
          ? 0
          : latestAmount,
        latestAdvanceBalance,
        latestInterestBalance,
        latestServiceChargeBalance,
        latestLateChargesBalance,
        latestAdditionalChargeBalance,
        latestTotalBalance,
        userId,
      ],
    );
  } catch (error) {
    throw new Error("Error creating approval ticket log");
  }
};

// Add ticket logs for a single ticket by ticket ID RUNS AFTER CREATE PAWNING TICKET
export const addTicketLogForSingleTicket = async (ticketId) => {
  try {
    // Get the specific ticket from the db
    const [ticketResult] = await pool.query(
      "SELECT * FROM pawning_ticket WHERE idPawning_Ticket = ? AND Status = '1'",
      [ticketId],
    );

    if (ticketResult.length === 0) {
      throw new Error(`Ticket with ID ${ticketId} not found or not active`);
    }

    const ticket = ticketResult[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if ticket has stage-based interest system
    const hasStages =
      ticket.stage1StartDate &&
      ticket.stage1EndDate &&
      ticket.stage2StartDate &&
      ticket.stage2EndDate &&
      ticket.stage3StartDate &&
      ticket.stage3EndDate &&
      ticket.stage4StartDate &&
      ticket.stage4EndDate;

    if (hasStages) {
      // STAGE-BASED INTEREST SYSTEM
      const ticketStartDate = new Date(ticket.Date_Time);
      ticketStartDate.setHours(0, 0, 0, 0);

      // Parse stage data
      const stages = [
        {
          num: 1,
          startDay: parseInt(ticket.stage1StartDate),
          endDay: parseInt(ticket.stage1EndDate),
          interest: parseFloat(ticket.stage1Interest) || 0,
        },
        {
          num: 2,
          startDay: parseInt(ticket.stage2StartDate),
          endDay: parseInt(ticket.stage2EndDate),
          interest: parseFloat(ticket.stage2Interest) || 0,
        },
        {
          num: 3,
          startDay: parseInt(ticket.stage3StartDate),
          endDay: parseInt(ticket.stage3EndDate),
          interest: parseFloat(ticket.stage3Interest) || 0,
        },
        {
          num: 4,
          startDay: parseInt(ticket.stage4StartDate),
          endDay: parseInt(ticket.stage4EndDate),
          interest: parseFloat(ticket.stage4Interest) || 0,
        },
      ];

      // Calculate days since ticket creation
      const daysSinceCreation = Math.floor(
        (today - ticketStartDate) / (1000 * 60 * 60 * 24),
      );

      // Process stages 1-3 (one-time interest)
      for (let i = 0; i < 3; i++) {
        const stage = stages[i];

        // Only process this stage if we have reached or passed it (daysSinceCreation >= stage.startDay)
        if (daysSinceCreation >= stage.startDay) {
          // Check if interest log already exists for this stage
          const [existingStageLog] = await pool.query(
            "SELECT 1 FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'INTEREST' AND Description LIKE ?",
            [ticketId, `%Stage ${stage.num}%`],
          );

          // If log exists, skip this stage
          if (existingStageLog.length === 0) {
            // Calculate the actual date for stage start
            const stageStartDate = new Date(ticketStartDate);
            stageStartDate.setDate(stageStartDate.getDate() + stage.startDay);
            const stageStartDateString = stageStartDate
              .toISOString()
              .split("T")[0];

            // Get the latest log for this ticket
            const [latestLogResult] = await pool.query(
              "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
              [ticketId],
            );

            const latestAdvanceBalance =
              parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
            const interestAmount =
              (latestAdvanceBalance * stage.interest) / 100;

            const latestInterestBalance =
              parseFloat(latestLogResult[0]?.Interest_Balance) || 0;
            const latestServiceChargeBalance =
              parseFloat(latestLogResult[0]?.Service_Charge_Balance) || 0;
            const latestLateChargesBalance =
              parseFloat(latestLogResult[0]?.Late_Charges_Balance) || 0;
            const latestAdditionalChargeBalance =
              parseFloat(latestLogResult[0]?.Aditional_Charge_Balance) || 0;

            const totalBalance =
              latestAdvanceBalance +
              (latestInterestBalance + interestAmount) +
              latestServiceChargeBalance +
              latestLateChargesBalance +
              latestAdditionalChargeBalance;

            // Insert stage interest log
            await pool.query(
              "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [
                ticketId,
                "INTEREST",
                `${stageStartDateString} - Stage ${stage.num}`,
                interestAmount,
                latestAdvanceBalance,
                latestInterestBalance + interestAmount,
                latestServiceChargeBalance,
                latestLateChargesBalance,
                latestAdditionalChargeBalance,
                totalBalance,
                null,
              ],
            );
          }
        }
      }

      // Process stage 4 (daily interest)
      const stage4 = stages[3];

      // Only process stage 4 if we have reached or passed it
      if (daysSinceCreation >= stage4.startDay) {
        const stage4StartDate = new Date(ticketStartDate);
        stage4StartDate.setDate(stage4StartDate.getDate() + stage4.startDay);
        stage4StartDate.setHours(0, 0, 0, 0);

        // Get the last stage 4 log to determine where to start
        const [lastStage4Log] = await pool.query(
          "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'INTEREST' AND Description LIKE '%Stage 4%' ORDER BY idTicket_Log DESC LIMIT 1",
          [ticketId],
        );

        let startDate = new Date(stage4StartDate);
        if (lastStage4Log.length > 0) {
          const lastLogDateStr = lastStage4Log[0].Description.split(" - ")[0];
          const lastLogDate = new Date(lastLogDateStr);
          lastLogDate.setHours(0, 0, 0, 0);
          startDate = new Date(lastLogDate);
          startDate.setDate(startDate.getDate() + 1); // Start from next day
        }

        // Add daily interest logs for stage 4
        for (
          let currentDate = new Date(startDate);
          currentDate <= today;
          currentDate.setDate(currentDate.getDate() + 1)
        ) {
          const dateString = currentDate.toISOString().split("T")[0];

          // Get the latest log for this ticket
          const [latestLogResult] = await pool.query(
            "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
            [ticketId],
          );

          const latestAdvanceBalance =
            parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
          const dailyInterestRate = stage4.interest / 30; // Monthly rate to daily
          const interestAmount =
            (latestAdvanceBalance * dailyInterestRate) / 100;

          const latestInterestBalance =
            parseFloat(latestLogResult[0]?.Interest_Balance) || 0;
          const latestServiceChargeBalance =
            parseFloat(latestLogResult[0]?.Service_Charge_Balance) || 0;
          const latestLateChargesBalance =
            parseFloat(latestLogResult[0]?.Late_Charges_Balance) || 0;
          const latestAdditionalChargeBalance =
            parseFloat(latestLogResult[0]?.Aditional_Charge_Balance) || 0;

          const totalBalance =
            latestAdvanceBalance +
            (latestInterestBalance + interestAmount) +
            latestServiceChargeBalance +
            latestLateChargesBalance +
            latestAdditionalChargeBalance;

          // Insert daily stage 4 interest log
          await pool.query(
            "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              ticketId,
              "INTEREST",
              `${dateString} - Stage 4`,
              interestAmount,
              latestAdvanceBalance,
              latestInterestBalance + interestAmount,
              latestServiceChargeBalance,
              latestLateChargesBalance,
              latestAdditionalChargeBalance,
              totalBalance,
              null,
            ],
          );
        }
      }

      // Handle penalty for stage-based system (daily penalties after maturity)
      const maturityDate = new Date(ticket.Maturity_date);
      maturityDate.setHours(0, 0, 0, 0);

      if (today > maturityDate) {
        // Get the last penalty log to determine where to start
        const [lastPenaltyLog] = await pool.query(
          "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'PENALTY' ORDER BY idTicket_Log DESC LIMIT 1",
          [ticketId],
        );

        let penaltyStartDate = new Date(maturityDate);
        penaltyStartDate.setDate(penaltyStartDate.getDate() + 1); // Start from day after maturity

        if (lastPenaltyLog.length > 0) {
          const lastPenaltyDateStr = lastPenaltyLog[0].Description;
          const lastPenaltyDate = new Date(lastPenaltyDateStr);
          lastPenaltyDate.setHours(0, 0, 0, 0);
          penaltyStartDate = new Date(lastPenaltyDate);
          penaltyStartDate.setDate(penaltyStartDate.getDate() + 1); // Start from next day
        }

        // Add interest and penalty for each day from penaltyStartDate to today
        for (
          let currentDate = new Date(penaltyStartDate);
          currentDate <= today;
          currentDate.setDate(currentDate.getDate() + 1)
        ) {
          const dateString = currentDate.toISOString().split("T")[0];

          // FIRST: Add interest log for the day
          const [latestLogForInterest] = await pool.query(
            "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
            [ticketId],
          );

          const latestAdvanceBalanceForInterest =
            parseFloat(latestLogForInterest[0]?.Advance_Balance) || 0;

          // Determine which stage we're in for interest calculation
          const daysSinceCreationForInterest = Math.floor(
            (currentDate - ticketStartDate) / (1000 * 60 * 60 * 24),
          );
          let interestAmount = 0;
          let interestDescription = "";

          // Check if we're in stage 4 (daily interest)
          if (daysSinceCreationForInterest >= stage4.startDay) {
            const dailyInterestRate = stage4.interest / 30;
            interestAmount =
              (latestAdvanceBalanceForInterest * dailyInterestRate) / 100;
            interestDescription = `${dateString} - Stage 4`;
          }

          if (interestAmount > 0) {
            const latestInterestBalanceForInterest =
              parseFloat(latestLogForInterest[0]?.Interest_Balance) || 0;
            const latestServiceChargeBalanceForInterest =
              parseFloat(latestLogForInterest[0]?.Service_Charge_Balance) || 0;
            const latestLateChargesBalanceForInterest =
              parseFloat(latestLogForInterest[0]?.Late_Charges_Balance) || 0;
            const latestAdditionalChargeBalanceForInterest =
              parseFloat(latestLogForInterest[0]?.Aditional_Charge_Balance) ||
              0;

            const totalBalanceForInterest =
              latestAdvanceBalanceForInterest +
              (latestInterestBalanceForInterest + interestAmount) +
              latestServiceChargeBalanceForInterest +
              latestLateChargesBalanceForInterest +
              latestAdditionalChargeBalanceForInterest;

            await pool.query(
              "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [
                ticketId,
                "INTEREST",
                interestDescription,
                interestAmount,
                latestAdvanceBalanceForInterest,
                latestInterestBalanceForInterest + interestAmount,
                latestServiceChargeBalanceForInterest,
                latestLateChargesBalanceForInterest,
                latestAdditionalChargeBalanceForInterest,
                totalBalanceForInterest,
                null,
              ],
            );
          }

          // SECOND: Add penalty log for the day (after interest)
          const [latestLogForPenalty] = await pool.query(
            "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
            [ticketId],
          );

          const lateChargePercentage =
            parseFloat(ticket.Late_charge_Presentage) || 0;
          const latestAdvanceBalance =
            parseFloat(latestLogForPenalty[0]?.Advance_Balance) || 0;
          const penaltyAmount =
            (latestAdvanceBalance * lateChargePercentage) / 100;

          const latestInterestBalance =
            parseFloat(latestLogForPenalty[0]?.Interest_Balance) || 0;
          const latestServiceChargeBalance =
            parseFloat(latestLogForPenalty[0]?.Service_Charge_Balance) || 0;
          const latestLateChargesBalance =
            parseFloat(latestLogForPenalty[0]?.Late_Charges_Balance) || 0;
          const latestAdditionalChargeBalance =
            parseFloat(latestLogForPenalty[0]?.Aditional_Charge_Balance) || 0;

          const totalBalance =
            latestAdvanceBalance +
            latestInterestBalance +
            latestServiceChargeBalance +
            (latestLateChargesBalance + penaltyAmount) +
            latestAdditionalChargeBalance;

          await createCustomerLogOnTicketPenality(
            "TICKET PENALTY",
            `Penalty of ${penaltyAmount} added to ticket ID ${ticketId} on ${dateString}`,
            ticket.Customer_idCustomer,
            null,
          );

          await pool.query(
            "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              ticketId,
              "PENALTY",
              dateString,
              penaltyAmount,
              latestAdvanceBalance,
              latestInterestBalance,
              latestServiceChargeBalance,
              latestLateChargesBalance + penaltyAmount,
              latestAdditionalChargeBalance,
              totalBalance,
              null,
            ],
          );
        }

        // Update ticket status to '3' (overdue) if not already
        if (ticket.Status !== "3") {
          await pool.query(
            "UPDATE pawning_ticket SET Status = '3' WHERE idPawning_Ticket = ?",
            [ticketId],
          );
        }
      }
    } else {
      // ORIGINAL INTEREST SYSTEM (NO STAGES)
      const interestApplyOn = new Date(ticket.Interest_apply_on);
      const maturityDate = new Date(ticket.Maturity_date);

      interestApplyOn.setHours(0, 0, 0, 0);
      maturityDate.setHours(0, 0, 0, 0);

      const [lastLogResult] = await pool.query(
        "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND (Type = 'INTEREST' OR Type = 'PENALTY') ORDER BY idTicket_Log DESC LIMIT 1",
        [ticketId],
      );

      let startDate = new Date(interestApplyOn);
      if (lastLogResult.length > 0) {
        const lastLogDate = new Date(lastLogResult[0].Description);
        lastLogDate.setHours(0, 0, 0, 0);
        startDate = new Date(lastLogDate);
        startDate.setDate(startDate.getDate() + 1);
      }

      for (
        let currentDate = new Date(startDate);
        currentDate <= today;
        currentDate.setDate(currentDate.getDate() + 1)
      ) {
        const dateString = currentDate.toISOString().split("T")[0];

        if (currentDate < interestApplyOn) {
          continue;
        }

        const shouldAddInterest = currentDate >= interestApplyOn;
        const shouldAddPenalty = currentDate > maturityDate;

        // Add interest log first if needed
        if (shouldAddInterest) {
          const [existingInterestLog] = await pool.query(
            "SELECT 1 FROM ticket_log WHERE Description = ? AND Type = 'INTEREST' AND Pawning_Ticket_idPawning_Ticket = ?",
            [dateString, ticketId],
          );

          if (existingInterestLog.length === 0) {
            const [latestLogResult] = await pool.query(
              "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
              [ticketId],
            );

            const interestTypeDuration = ticket.Interest_Rate_Duration || "N/A";
            const interestRateType = ticket.Interest_Rate_Type || "FLAT";
            let interestRate = parseFloat(ticket.Interest_Rate) || 0;

            const latestAdvanceBalance =
              parseFloat(latestLogResult[0]?.Advance_Balance) || 0;

            if (interestTypeDuration === "perMonth") {
              interestRate = interestRate / 30;
            } else if (interestTypeDuration === "perYear") {
              interestRate = interestRate / 365;
            } else if (interestTypeDuration === "perWeek") {
              interestRate = interestRate / 7;
            }

            const interestAmount = (latestAdvanceBalance * interestRate) / 100;

            const latestInterestBalance =
              parseFloat(latestLogResult[0]?.Interest_Balance) || 0;
            const latestServiceChargeBalance =
              parseFloat(latestLogResult[0]?.Service_Charge_Balance) || 0;
            const latestLateChargesBalance =
              parseFloat(latestLogResult[0]?.Late_Charges_Balance) || 0;
            const latestAdditionalChargeBalance =
              parseFloat(latestLogResult[0]?.Aditional_Charge_Balance) || 0;

            const totalBalance =
              latestAdvanceBalance +
              (latestInterestBalance + interestAmount) +
              latestServiceChargeBalance +
              latestLateChargesBalance +
              latestAdditionalChargeBalance;

            const [result] = await pool.query(
              "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [
                ticketId,
                "INTEREST",
                dateString,
                interestAmount,
                latestAdvanceBalance,
                latestInterestBalance + interestAmount,
                latestServiceChargeBalance,
                latestLateChargesBalance,
                latestAdditionalChargeBalance,
                totalBalance,
                null,
              ],
            );

            if (result.affectedRows === 0) {
              throw new Error(
                `Failed to add interest ticket log for ${dateString}`,
              );
            }
          }
        }

        // Add penalty log after interest (if needed)
        if (shouldAddPenalty) {
          const [existingPenaltyLog] = await pool.query(
            "SELECT 1 FROM ticket_log WHERE Description = ? AND Type = 'PENALTY' AND Pawning_Ticket_idPawning_Ticket = ?",
            [dateString, ticketId],
          );

          if (existingPenaltyLog.length === 0) {
            const [latestLogResult] = await pool.query(
              "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
              [ticketId],
            );

            const lateChargePercentage =
              parseFloat(ticket.Late_charge_Presentage) || 0;
            const latestAdvanceBalance =
              parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
            const penaltyAmount =
              (latestAdvanceBalance * lateChargePercentage) / 100;

            const latestInterestBalance =
              parseFloat(latestLogResult[0]?.Interest_Balance) || 0;
            const latestServiceChargeBalance =
              parseFloat(latestLogResult[0]?.Service_Charge_Balance) || 0;
            const latestLateChargesBalance =
              parseFloat(latestLogResult[0]?.Late_Charges_Balance) || 0;
            const latestAdditionalChargeBalance =
              parseFloat(latestLogResult[0]?.Aditional_Charge_Balance) || 0;

            const totalBalance =
              latestAdvanceBalance +
              latestInterestBalance +
              latestServiceChargeBalance +
              (latestLateChargesBalance + penaltyAmount) +
              latestAdditionalChargeBalance;

            await createCustomerLogOnTicketPenality(
              "TICKET PENALTY",
              `Penalty of ${penaltyAmount} added to ticket ID ${ticketId} on ${dateString}`,
              ticket.Customer_idCustomer,
              null,
            );

            await pool.query(
              "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [
                ticketId,
                "PENALTY",
                dateString,
                penaltyAmount,
                latestAdvanceBalance,
                latestInterestBalance,
                latestServiceChargeBalance,
                latestLateChargesBalance + penaltyAmount,
                latestAdditionalChargeBalance,
                totalBalance,
                null,
              ],
            );

            // Update ticket status to '3' (overdue) only once
            if (ticket.Status !== "3") {
              const [updateResult] = await pool.query(
                "UPDATE pawning_ticket SET Status = '3' WHERE idPawning_Ticket = ?",
                [ticketId],
              );

              if (updateResult.affectedRows === 0) {
                throw new Error(
                  `Failed to update ticket status to overdue for ticket ID ${ticketId}`,
                );
              }
            }
          }
        }
      }
    }

    return {
      success: true,
      message: `Successfully added ticket logs for ticket ID ${ticketId}`,
    };
  } catch (error) {
    console.error(`Error adding ticket log for ticket ID ${ticketId}:`, error);
    throw new Error(
      `Error adding ticket log for ticket ID ${ticketId}: ${error.message}`,
    );
  }
};
