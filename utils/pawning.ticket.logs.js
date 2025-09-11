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
    // go through every ticket in the db and get only tickets that are Status = 1 (active)
    const [activeTicketResult] = await pool.query(
      "SELECT * FROM pawning_tickets WHERE Status = '1'"
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
        "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND (Type = 'Interest' OR Type = 'Penalty') ORDER BY idTicket_Log DESC LIMIT 1",
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

        // Check if we're past maturity date (penalty period)
        const isPenaltyPeriod = currentDate >= maturityDate;
        const logType = isPenaltyPeriod ? "Penalty" : "Interest";

        // Check if log already exists for this date and type
        const [existingLogResult] = await pool.query(
          "SELECT 1 FROM ticket_log WHERE Description = ? AND Type = ? AND Pawning_Ticket_idPawning_Ticket = ?",
          [dateString, logType, ticketId]
        );

        if (existingLogResult.length > 0) {
          // Log already exists for this date and type, skip
          continue;
        }

        // Get the latest log for this ticket to get the latest balances
        const [latestLogResult] = await pool.query(
          "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
          [ticketId]
        );

        let amount, totalBalance;
        const latestAdvanceBalance =
          Number(latestLogResult[0]?.Advance_Balance) || 0;
        const latestInterestBalance =
          Number(latestLogResult[0]?.Interest_Balance) || 0;
        const latestServiceChargeBalance =
          Number(latestLogResult[0]?.Service_Charge_Balance) || 0;
        const latestLateChargesBalance =
          Number(latestLogResult[0]?.Late_Charges_Balance) || 0;
        const latestAdditionalChargeBalance =
          Number(latestLogResult[0]?.Aditional_Charge_Balance) || 0;

        if (isPenaltyPeriod) {
          // Calculate penalty/late charge
          const lateChargePercentage =
            Number(ticket.Late_charge_Precentage) || 0;
          amount = (latestAdvanceBalance * lateChargePercentage) / 100;

          totalBalance =
            latestAdvanceBalance +
            latestInterestBalance +
            latestServiceChargeBalance +
            (latestLateChargesBalance + amount) +
            latestAdditionalChargeBalance;

          // Insert penalty log
          const [result] = await pool.query(
            "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              ticketId,
              logType,
              dateString,
              amount,
              latestAdvanceBalance,
              latestInterestBalance,
              latestServiceChargeBalance,
              latestLateChargesBalance + amount,
              latestAdditionalChargeBalance,
              totalBalance,
            ]
          );

          // create customer log for ticket penality
          await createCustomerLogOnTicketPenality(
            "TICKET PENALTY",
            `Applied penalty of ${amount.toFixed(2)} on ticket No: ${
              ticket.Ticket_no
            } for date ${dateString}`,
            ticket.Customer_idCustomer,
            ticket.User_idUser
          );

          if (result.affectedRows === 0) {
            throw new Error(
              `Failed to add penalty ticket log for ${dateString}`
            );
          }
        } else {
          // Calculate interest
          const interestRate = Number(ticket.Interest_Rate) || 0;
          amount = (latestAdvanceBalance * interestRate) / 100;

          totalBalance =
            latestAdvanceBalance +
            (latestInterestBalance + amount) +
            latestServiceChargeBalance +
            latestLateChargesBalance +
            latestAdditionalChargeBalance;

          // Insert interest log
          const [result] = await pool.query(
            "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              ticketId,
              logType,
              dateString,
              amount,
              latestAdvanceBalance,
              latestInterestBalance + amount,
              latestServiceChargeBalance,
              latestLateChargesBalance,
              latestAdditionalChargeBalance,
              totalBalance,
            ]
          );

          if (result.affectedRows === 0) {
            throw new Error(
              `Failed to add interest ticket log for ${dateString}`
            );
          }
        }
      }
    }
  } catch (error) {
    console.error("Error adding daily ticket log:", error);
    throw new Error("Error adding daily ticket log");
  }
};
