import { pool } from "../utils/db.js";
import { createCustomerLogOnTicketPenality } from "./customer.logs.js";
import { pawningPaymentsApi } from "../api/accountCenterApi.js";

// Helper: record accounting entries for accrued interest
const recordInterestAccountingEntries = async (
  ticket,
  interestAmount,
  note,
) => {
  if (!interestAmount || interestAmount <= 0) return;

  const branchId = ticket?.Branch_idBranch;
  if (!branchId) return;

  try {
    const ticketLabel = ticket?.Ticket_No
      ? `Ticket No: ${ticket.Ticket_No}`
      : `Ticket ID: ${ticket.idPawning_Ticket}`;
    const descriptionText =
      note || `Interest accrued for ${ticketLabel} (Daily process)`;

    const data = {
      branchId: branchId,
      interestAmount: interestAmount,
      description: descriptionText,
    };
    try {
      await pawningPaymentsApi.ticketInterestDoubleEntries(data, null);
    } catch (error) {
      console.error("Failed to record interest accounting entries:", error);
      throw error;
    }
  } catch (err) {
    console.error("Failed to record interest accounting entries:", err);
    throw err;
  }
};

// Helper: record accounting entries for accrued penalties/overdue charges
const recordPenaltyAccountingEntries = async (ticket, penaltyAmount, note) => {
  if (!penaltyAmount || penaltyAmount <= 0) return;

  const branchId = ticket?.Branch_idBranch;
  if (!branchId) return;

  try {
    const ticketLabel = ticket?.Ticket_No
      ? `Ticket No: ${ticket.Ticket_No}`
      : `Ticket ID: ${ticket.idPawning_Ticket}`;
    const descriptionText =
      note || `Penalty accrued for ${ticketLabel} (Daily process)`;

    try {
      const data = {
        branchId: branchId,
        penaltyAmount: penaltyAmount,
        description: descriptionText,
      };
      try {
        await pawningPaymentsApi.ticketPenaltyDoubleEntries(data, null);
      } catch (error) {
        console.error("Failed to record penalty accounting entries:", error);
        throw error;
      }
    } catch (err) {
      console.error("Failed to record penalty accounting entries:", err);
      throw err;
    }
  } catch (err) {
    console.error("Failed to record penalty accounting entries:", err);
    throw err;
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
// isPaidFromAdvance = true means service charge is deducted from pawning advance (subtract from balance) and service charge balance is reduced to 0
export const markServiceChargeInTicketLog = async (
  ticketId,
  type,
  userId,
  serviceCharge,
  isPaidFromAdvance = true,
  connection,
) => {
  // Guard: connection is required since this runs inside a transaction
  if (!connection) {
    throw new Error(
      "markServiceChargeInTicketLog: a transaction connection is required",
    );
  }

  try {
    // Get the latest log to retrieve all balances
    const [latestLogResult] = await connection.query(
      "SELECT Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
      [ticketId],
    );

    let advanceBalance = Number(latestLogResult[0]?.Advance_Balance) || 0;
    const interestBalance = Number(latestLogResult[0]?.Interest_Balance) || 0;
    const existingServiceChargeBalance =
      Number(latestLogResult[0]?.Service_Charge_Balance) || 0;
    const lateChargesBalance =
      Number(latestLogResult[0]?.Late_Charges_Balance) || 0;
    const additionalChargeBalance =
      Number(latestLogResult[0]?.Aditional_Charge_Balance) || 0;

    // If paid from advance, reduce the advance balance (clamp to 0 to avoid negative)
    advanceBalance = Math.max(0, advanceBalance - Number(serviceCharge));
    const newServiceChargeBalance = Math.max(
      0,
      existingServiceChargeBalance - Number(serviceCharge),
    );

    let totalBalance;
    // Service charge already deducted from advance, so don't add it again to total
    totalBalance =
      advanceBalance +
      interestBalance +
      lateChargesBalance +
      additionalChargeBalance;

    const [result] = await connection.query(
      "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser,Date_Time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      [
        ticketId,
        type,
        serviceCharge,
        advanceBalance,
        interestBalance,
        newServiceChargeBalance,
        lateChargesBalance,
        additionalChargeBalance,
        totalBalance,
        userId,
      ],
    );
    if (result.affectedRows === 0) {
      throw new Error("Failed to mark service charge in pawning ticket log");
    }
  } catch (error) {
    console.error("Error marking service charge in pawning ticket log:", error);
    throw error; // re-throw original error to preserve stack trace
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

      // Check if ticket has stage-based interest system using noOfStages
      const noOfStages = parseInt(ticket.noOfStages) || 0;
      const hasStages = noOfStages >= 2; // Minimum 2 stages to use stage system

      if (hasStages) {
        // STAGE-BASED INTEREST SYSTEM
        const ticketStartDate = new Date(ticket.Date_Time);
        ticketStartDate.setHours(0, 0, 0, 0);

        // Dynamically build stages array based on noOfStages
        const stages = [];
        for (let i = 1; i <= noOfStages; i++) {
          stages.push({
            num: i,
            startDay: parseInt(ticket[`stage${i}StartDate`]) || 0,
            endDay: parseInt(ticket[`stage${i}EndDate`]) || 0,
            interest: parseFloat(ticket[`stage${i}Interest`]) || 0,
          });
        }

        // Calculate days since ticket creation
        const daysSinceCreation = Math.floor(
          (today - ticketStartDate) / (1000 * 60 * 60 * 24),
        );

        // Process stages 1 to (n-1) as one-time interest (last stage is daily)
        for (let i = 0; i < stages.length - 1; i++) {
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

        // Process last stage (daily interest)
        const lastStage = stages[stages.length - 1];

        // Only process last stage if we have reached or passed it
        if (daysSinceCreation >= lastStage.startDay) {
          const lastStageStartDate = new Date(ticketStartDate);
          lastStageStartDate.setDate(
            lastStageStartDate.getDate() + lastStage.startDay,
          );
          lastStageStartDate.setHours(0, 0, 0, 0);

          // Get the last daily stage log to determine where to start
          const [lastDailyStageLog] = await pool.query(
            "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'INTEREST' AND Description LIKE ? ORDER BY idTicket_Log DESC LIMIT 1",
            [ticketId, `%Stage ${lastStage.num}%`],
          );

          let startDate = new Date(lastStageStartDate);
          if (lastDailyStageLog.length > 0) {
            const lastLogDateStr =
              lastDailyStageLog[0].Description.split(" - ")[0];
            const lastLogDate = new Date(lastLogDateStr);
            lastLogDate.setHours(0, 0, 0, 0);
            startDate = new Date(lastLogDate);
            startDate.setDate(startDate.getDate() + 1); // Start from next day
          }

          // Add daily interest logs for last stage
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
            const dailyInterestRate = lastStage.interest / 30; // Monthly rate to daily
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

            // Insert daily last stage interest log
            await pool.query(
              "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [
                ticketId,
                "INTEREST",
                `${dateString} - Stage ${lastStage.num}`,
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
              `${dateString} - Stage ${lastStage.num} interest accrual`,
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

            // Check if we're in last stage (daily interest)
            if (daysSinceCreationForInterest >= lastStage.startDay) {
              const dailyInterestRate = lastStage.interest / 30;
              interestAmount =
                (latestAdvanceBalanceForInterest * dailyInterestRate) / 100;
              interestDescription = `${dateString} - Stage ${lastStage.num}`;
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

            // OLD PENALTY LOGIC (commented out - replaced by stage-based late charges)
            /*
            const [latestLogForPenalty] = await pool.query(
              "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
              [ticketId],
            );
            const lateChargePercentage = parseFloat(ticket.Late_charge_Presentage) || 0;
            const latestAdvanceBalance = parseFloat(latestLogForPenalty[0]?.Advance_Balance) || 0;
            const penaltyAmount = (latestAdvanceBalance * lateChargePercentage) / 100;
            // ... rest of old penalty logic ...
            */
          }

          // NEW STAGE-BASED LATE CHARGE SYSTEM
          const numberOfLateChargeStages =
            parseInt(ticket.numberOfLateChargeStages) || 0;
          const hasLateChargeStages = numberOfLateChargeStages >= 2;

          if (hasLateChargeStages) {
            const lateChargeStages = [];
            for (let lcs = 1; lcs <= numberOfLateChargeStages; lcs++) {
              lateChargeStages.push({
                num: lcs,
                startDay:
                  parseInt(ticket[`lateChargeStage${lcs}StartDate`]) || 0,
                endDay: parseInt(ticket[`lateChargeStage${lcs}EndDate`]) || 0,
                rate: parseFloat(ticket[`lateChargeStage${lcs}`]) || 0,
              });
            }

            const daysSinceMaturity = Math.floor(
              (today - maturityDate) / (1000 * 60 * 60 * 24),
            );

            // Process stages 1 to (n-1) as one-time penalties
            for (let lci = 0; lci < lateChargeStages.length - 1; lci++) {
              const lcStage = lateChargeStages[lci];

              if (daysSinceMaturity >= lcStage.startDay) {
                const [existingLCStageLog] = await pool.query(
                  "SELECT 1 FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'PENALTY' AND Description LIKE ?",
                  [ticketId, `%Late Charge Stage ${lcStage.num}%`],
                );

                if (existingLCStageLog.length === 0) {
                  const lcStageDate = new Date(maturityDate);
                  lcStageDate.setDate(lcStageDate.getDate() + lcStage.startDay);
                  const lcStageDateString = lcStageDate
                    .toISOString()
                    .split("T")[0];

                  const [latestLogResult] = await pool.query(
                    "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
                    [ticketId],
                  );

                  const latestAdvanceBalance =
                    parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
                  const penaltyAmount =
                    (latestAdvanceBalance * lcStage.rate) / 100;
                  const latestInterestBalance =
                    parseFloat(latestLogResult[0]?.Interest_Balance) || 0;
                  const latestServiceChargeBalance =
                    parseFloat(latestLogResult[0]?.Service_Charge_Balance) || 0;
                  const latestLateChargesBalance =
                    parseFloat(latestLogResult[0]?.Late_Charges_Balance) || 0;
                  const latestAdditionalChargeBalance =
                    parseFloat(latestLogResult[0]?.Aditional_Charge_Balance) ||
                    0;

                  const totalBalance =
                    latestAdvanceBalance +
                    latestInterestBalance +
                    latestServiceChargeBalance +
                    (latestLateChargesBalance + penaltyAmount) +
                    latestAdditionalChargeBalance;

                  await createCustomerLogOnTicketPenality(
                    "TICKET PENALTY",
                    `Penalty of ${penaltyAmount} added to ticket ID ${ticketId} on ${lcStageDateString} (Late Charge Stage ${lcStage.num})`,
                    ticket.Customer_idCustomer,
                    null,
                  );

                  await pool.query(
                    "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                      ticketId,
                      "PENALTY",
                      `${lcStageDateString} - Late Charge Stage ${lcStage.num}`,
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
                    `${lcStageDateString} - Late Charge Stage ${lcStage.num} penalty accrual`,
                  );
                }
              }
            }

            // Process last late charge stage (daily penalty)
            const lastLCStage = lateChargeStages[lateChargeStages.length - 1];

            if (daysSinceMaturity >= lastLCStage.startDay) {
              const lastLCStageStartDate = new Date(maturityDate);
              lastLCStageStartDate.setDate(
                lastLCStageStartDate.getDate() + lastLCStage.startDay,
              );
              lastLCStageStartDate.setHours(0, 0, 0, 0);

              const [lastDailyLCLog] = await pool.query(
                "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'PENALTY' AND Description LIKE ? ORDER BY idTicket_Log DESC LIMIT 1",
                [ticketId, `%Late Charge Stage ${lastLCStage.num}%`],
              );

              let lcStartDate = new Date(lastLCStageStartDate);
              if (lastDailyLCLog.length > 0) {
                const lastLCLogDateStr =
                  lastDailyLCLog[0].Description.split(" - ")[0];
                const lastLCLogDate = new Date(lastLCLogDateStr);
                lastLCLogDate.setHours(0, 0, 0, 0);
                lcStartDate = new Date(lastLCLogDate);
                lcStartDate.setDate(lcStartDate.getDate() + 1);
              }

              for (
                let currentDate = new Date(lcStartDate);
                currentDate <= today;
                currentDate.setDate(currentDate.getDate() + 1)
              ) {
                const dateString = currentDate.toISOString().split("T")[0];

                const [latestLogResult] = await pool.query(
                  "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
                  [ticketId],
                );

                const latestAdvanceBalance =
                  parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
                const dailyLateChargeRate = lastLCStage.rate / 30;
                const penaltyAmount =
                  (latestAdvanceBalance * dailyLateChargeRate) / 100;
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
                    `${dateString} - Late Charge Stage ${lastLCStage.num}`,
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
                  `${dateString} - Late Charge Stage ${lastLCStage.num} penalty accrual`,
                );
              }
            }
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

          // OLD PENALTY LOGIC (commented out - replaced by stage-based late charges)
          /*
          if (shouldAddPenalty) {
            const [existingPenaltyLog] = await pool.query(
              "SELECT 1 FROM ticket_log WHERE Description = ? AND Type = 'PENALTY' AND Pawning_Ticket_idPawning_Ticket = ?",
              [dateString, ticketId],
            );
            if (existingPenaltyLog.length === 0) {
              const lateChargePercentage = parseFloat(ticket.Late_charge_Presentage) || 0;
              const latestAdvanceBalance = parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
              const penaltyAmount = (latestAdvanceBalance * lateChargePercentage) / 100;
              // ... rest of old penalty logic ...
            }
          }
          */
        }
      }

      // NEW STAGE-BASED LATE CHARGE SYSTEM (non-stage interest path)
      const maturityDateForLC = new Date(ticket.Maturity_date);
      maturityDateForLC.setHours(0, 0, 0, 0);

      if (today > maturityDateForLC) {
        const numberOfLateChargeStages =
          parseInt(ticket.numberOfLateChargeStages) || 0;
        const hasLateChargeStages = numberOfLateChargeStages >= 2;

        if (hasLateChargeStages) {
          const lateChargeStages = [];
          for (let lcs = 1; lcs <= numberOfLateChargeStages; lcs++) {
            lateChargeStages.push({
              num: lcs,
              startDay: parseInt(ticket[`lateChargeStage${lcs}StartDate`]) || 0,
              endDay: parseInt(ticket[`lateChargeStage${lcs}EndDate`]) || 0,
              rate: parseFloat(ticket[`lateChargeStage${lcs}`]) || 0,
            });
          }

          const daysSinceMaturity = Math.floor(
            (today - maturityDateForLC) / (1000 * 60 * 60 * 24),
          );

          // Process stages 1 to (n-1) as one-time penalties
          for (let lci = 0; lci < lateChargeStages.length - 1; lci++) {
            const lcStage = lateChargeStages[lci];

            if (daysSinceMaturity >= lcStage.startDay) {
              const [existingLCStageLog] = await pool.query(
                "SELECT 1 FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'PENALTY' AND Description LIKE ?",
                [ticketId, `%Late Charge Stage ${lcStage.num}%`],
              );

              if (existingLCStageLog.length === 0) {
                const lcStageDate = new Date(maturityDateForLC);
                lcStageDate.setDate(lcStageDate.getDate() + lcStage.startDay);
                const lcStageDateString = lcStageDate
                  .toISOString()
                  .split("T")[0];

                const [latestLogResult] = await pool.query(
                  "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
                  [ticketId],
                );

                const latestAdvanceBalance =
                  parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
                const penaltyAmount =
                  (latestAdvanceBalance * lcStage.rate) / 100;
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
                  `Penalty of ${penaltyAmount} added to ticket ID ${ticketId} on ${lcStageDateString} (Late Charge Stage ${lcStage.num})`,
                  ticket.Customer_idCustomer,
                  null,
                );

                await pool.query(
                  "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                  [
                    ticketId,
                    "PENALTY",
                    `${lcStageDateString} - Late Charge Stage ${lcStage.num}`,
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
                  `${lcStageDateString} - Late Charge Stage ${lcStage.num} penalty accrual`,
                );
              }
            }
          }

          // Process last late charge stage (daily penalty)
          const lastLCStage = lateChargeStages[lateChargeStages.length - 1];

          if (daysSinceMaturity >= lastLCStage.startDay) {
            const lastLCStageStartDate = new Date(maturityDateForLC);
            lastLCStageStartDate.setDate(
              lastLCStageStartDate.getDate() + lastLCStage.startDay,
            );
            lastLCStageStartDate.setHours(0, 0, 0, 0);

            const [lastDailyLCLog] = await pool.query(
              "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'PENALTY' AND Description LIKE ? ORDER BY idTicket_Log DESC LIMIT 1",
              [ticketId, `%Late Charge Stage ${lastLCStage.num}%`],
            );

            let lcStartDate = new Date(lastLCStageStartDate);
            if (lastDailyLCLog.length > 0) {
              const lastLCLogDateStr =
                lastDailyLCLog[0].Description.split(" - ")[0];
              const lastLCLogDate = new Date(lastLCLogDateStr);
              lastLCLogDate.setHours(0, 0, 0, 0);
              lcStartDate = new Date(lastLCLogDate);
              lcStartDate.setDate(lcStartDate.getDate() + 1);
            }

            for (
              let currentDate = new Date(lcStartDate);
              currentDate <= today;
              currentDate.setDate(currentDate.getDate() + 1)
            ) {
              const dateString = currentDate.toISOString().split("T")[0];

              const [latestLogResult] = await pool.query(
                "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
                [ticketId],
              );

              const latestAdvanceBalance =
                parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
              const dailyLateChargeRate = lastLCStage.rate / 30;
              const penaltyAmount =
                (latestAdvanceBalance * dailyLateChargeRate) / 100;
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
                  `${dateString} - Late Charge Stage ${lastLCStage.num}`,
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
                `${dateString} - Late Charge Stage ${lastLCStage.num} penalty accrual`,
              );
            }
          }
        }

        // Update ticket status to '3' (overdue) if not already
        if (ticket.Status !== "3") {
          await pool.query(
            "UPDATE pawning_ticket SET Status = '3' WHERE idPawning_Ticket = ?",
            [ticketId],
          );
        }
      }
    }
  } catch (error) {
    console.error("Error adding daily ticket log:", error);
    throw new Error("Error adding daily ticket log");
  }
};

// Function to run on when a ticket got a new additonal charge
export const createPawningTicketLogOnAdditionalCharge = async (
  ticketId,
  type,
  userId,
  amount,
  connection,
) => {
  try {
    const [latestLogResult] = await connection.query(
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

    const [result] = await connection.query(
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
