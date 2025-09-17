import { pool } from "../utils/db.js";
import { createCustomerLogOnTicketPenality } from "./customer.logs.js";
// this runs when a new pawning ticket is created
export const createPawningTicketLogOnCreate = async (
  ticketId,
  type,
  userId,
  amount
) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO ticket_log (
        Pawning_Ticket_idPawning_Ticket, Type, Type_Id, User_idUser, Date_Time,
        Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Aditional_Charge_Balance, Total_Balance, Late_Charges_Balance
      ) VALUES (?, ?, ?, ?, NOW(), ?, ?, 0, 0, 0, ?, 0)`,
      [ticketId, type, ticketId, userId, amount, amount, amount]
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
  serviceCharge
) => {
  try {
    const [latestChargeResult] = await pool.query(
      "SELECT Advance_Balance FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
      [ticketId]
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
      ]
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
      "SELECT * FROM pawning_ticket WHERE Status = '1'"
    );

    // circle through each ticket
    for (const ticket of activeTicketResult) {
      const ticketId = ticket.idPawning_Ticket;
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
        [ticketId]
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

        // ADD INTEREST LOG IF NEEDED
        if (shouldAddInterest) {
          // Check if interest log already exists for this date
          const [existingInterestLog] = await pool.query(
            "SELECT 1 FROM ticket_log WHERE Description = ? AND Type = 'INTEREST' AND Pawning_Ticket_idPawning_Ticket = ?",
            [dateString, ticketId]
          );

          if (existingInterestLog.length === 0) {
            // Get the latest log for this ticket to get the latest balances
            const [latestLogResult] = await pool.query(
              "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
              [ticketId]
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

            /*
            // Console checks
            console.log(
              `Adding INTEREST log for Ticket ID ${ticketId} on ${dateString}:`
            );
            console.log(`  Interest Rate: ${interestRate}%`);
            console.log(`  Latest Advance Balance: ${latestAdvanceBalance}`);
            console.log(`  Interest Amount: ${interestAmount}`);
            console.log(
              `  New Interest Balance: ${
                latestInterestBalance + interestAmount
              }`
            );
            console.log(`  Total Balance after Interest: ${totalBalance}`);
            */

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
              ]
            );

            if (result.affectedRows === 0) {
              throw new Error(
                `Failed to add interest ticket log for ${dateString}`
              );
            }
          }
        }

        // ADD PENALTY LOG IF NEEDED
        if (shouldAddPenalty) {
          // Check if penalty log already exists for this date
          const [existingPenaltyLog] = await pool.query(
            "SELECT 1 FROM ticket_log WHERE Description = ? AND Type = 'PENALTY' AND Pawning_Ticket_idPawning_Ticket = ?",
            [dateString, ticketId]
          );

          if (existingPenaltyLog.length === 0) {
            // Get the latest log for this ticket to get the latest balances
            const [latestLogResult] = await pool.query(
              "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
              [ticketId]
            );

            // Calculate penalty
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

            /*
            // Console checks
            console.log(
              `Adding PENALTY log for Ticket ID ${ticketId} on ${dateString}:`
            );
            console.log(`  Late Charge Percentage: ${lateChargePercentage}%`);
            console.log(`  Latest Advance Balance: ${latestAdvanceBalance}`);
            console.log(`  Penalty Amount: ${penaltyAmount}`);
            console.log(
              `  New Late Charges Balance: ${
                latestLateChargesBalance + penaltyAmount
              }`
            );
            console.log(`  Total Balance after Penalty: ${totalBalance}`);
            */

            // Create customer log for penalty
            await createCustomerLogOnTicketPenality(
              "TICKET PENALTY",
              `Penalty of ${penaltyAmount} added to ticket ID ${ticketId} on ${dateString}`,
              ticket.Customer_idCustomer,
              null
            );

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
              ]
            );

            if (result.affectedRows === 0) {
              throw new Error(
                `Failed to add penalty ticket log for ${dateString}`
              );
            }

            // Update ticket status to '3' which stand for overdue
            if (ticket.Status !== "3") {
              const [updateResult] = await pool.query(
                "UPDATE pawning_ticket SET Status = '3' WHERE idPawning_Ticket = ?",
                [ticketId]
              );
            }

            if (updateResult.affectedRows === 0) {
              throw new Error(
                `Failed to update ticket status to overdue for ticket ID ${ticketId}`
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
      [ticketId]
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
      [ticketId]
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
          [dateString, ticketId]
        );

        if (existingInterestLog.length === 0) {
          // Get the latest log for this ticket to get the latest balances
          const [latestLogResult] = await pool.query(
            "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
            [ticketId]
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
            ]
          );

          if (result.affectedRows === 0) {
            throw new Error(
              `Failed to add interest ticket log for ${dateString}`
            );
          }
        }
      }

      // ADD PENALTY LOG

      if (shouldAddPenalty) {
        // Check if penalty log already exists for this date
        const [existingPenaltyLog] = await pool.query(
          "SELECT 1 FROM ticket_log WHERE Description = ? AND Type = 'PENALTY' AND Pawning_Ticket_idPawning_Ticket = ?",
          [dateString, ticketId]
        );

        if (existingPenaltyLog.length === 0) {
          // Get the latest log for this ticket to get the latest balances
          const [latestLogResult] = await pool.query(
            "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
            [ticketId]
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
            ]
          );

          if (result.affectedRows === 0) {
            throw new Error(
              `Failed to add penalty ticket log for ${dateString}`
            );
          }

          if (ticket.Status !== "3") {
            // Update ticket status to '3' which stand for overdue
            const [updateResult] = await pool.query(
              "UPDATE pawning_ticket SET Status = '3' WHERE idPawning_Ticket = ?",
              [ticketId]
            );
          }
          if (updateResult.affectedRows === 0) {
            throw new Error(
              `Failed to update ticket status to overdue for ticket ID ${ticketId}`
            );
          }

          // Create customer log for penalty

          await createCustomerLogOnTicketPenality(
            "TICKET PENALTY",
            `Penalty of ${penaltyAmount} added to ticket ID ${ticketId} on ${dateString}`,
            ticketResult.Customer_idCustomer,
            null
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
      `Error adding ticket logs for ticket ${ticketId}: ${error.message}`
    );
  }
};
