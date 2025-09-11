import { pool } from "../utils/db.js";

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
      "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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

// run every day 12AM to add ticket logs
export const addDailyTicketLog = async () => {
  try {
    // go through every ticket in the db and get only tickets that are Status = 1 (active)
    const [activeTicketResult] = await pool.query(
      "SELECT * FROM pawning_tickets WHERE Status = '1'"
    );

    // circle through each ticket by checking date difference today and ticket's Interest_apply_on date
    for (const ticekt of activeTicketResult) {
      const ticketId = ticekt.idPawning_Ticket;
      const interestApplyOn = new Date(ticekt.Interest_apply_on);
      const today = new Date();

      // check if the today is interest apply on date or a higher date
      if (today >= interestApplyOn) {
        // first check if there is already a log for today
        const [existingLogResult] = await pool.query(
          "SELECT 1 FROM ticket_log WHERE Description = ? AND Type = 'Interest'",
          [
            today.toISOString().split("T")[0], // format to YYYY-MM-DD
          ]
        );

        if (existingLogResult.length > 0) {
          // there is already a log for today, skip to the next ticket
          continue;
        }
        // get the latest log for this ticket to get the latest balances
        const [latestLogResult] = await pool.query(
          "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
          [ticketId]
        );

        let type = "Interest";
        let description = today.toISOString().split("T")[0]; // format to YYYY-MM-DD
        let interestAmount;
        // get the interest amount by  ticket's interest rate and latest advance balance
        const interestRate = Number(ticekt.Interest_Rate) || 0;
        const latestAdvanceBalance =
          Number(latestLogResult[0]?.Advance_Balance) || 0;
        interestAmount = (latestAdvanceBalance * interestRate) / 100;
        let totalBalance =
          latestAdvanceBalance +
          interestAmount +
          (Number(latestLogResult[0]?.Service_Charge_Balance) || 0) +
          (Number(latestLogResult[0]?.Late_Charges_Balance) || 0) +
          (Number(latestLogResult[0]?.Aditional_Charge_Balance) || 0);

        // Insert a new log to ticket log
        const [result] = await pool.query(
          "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket,Type,Description,Amount,Advance_Balance,Interest_Balance,Service_Charge_Balance,Late_Charges_Balance,Aditional_Charge_Balance,Total_Balance)",
          [
            ticketId,
            type,
            description,
            interestAmount,
            latestAdvanceBalance,
            interestAmount,
            latestLogResult[0]?.Service_Charge_Balance,
            latestLogResult[0]?.Late_Charges_Balance,
            latestLogResult[0]?.Aditional_Charge_Balance,
            latestAdvanceBalance,
            totalBalance,
          ]
        );

        if (result.affectedRows === 0) {
          throw new Error("Failed to add daily interest ticket log");
        }
      }

      // after adding inrerest, check if the ticket's maturity date is today or a past date
      else if (today >= new Date(ticekt.Maturity_date)) {
        // add penalty
        const [existingLogResult] = await pool.query(
          "SELECT 1 FROM ticket_log WHERE Description = ? AND Type = 'Penalty'",
          [
            today.toISOString().split("T")[0], // format to YYYY-MM-DD
          ]
        );
        if (existingLogResult.length > 0) {
          // there is already a log for today, skip to the next ticket
          continue;
        }

        const [latestLogResult] = await pool.query(
          "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
          [ticketId]
        );

        let type = "Penalty";
        let description = today.toISOString().split("T")[0]; // format to YYYY-MM-DD
        let lateChargeAmount;
        // get the late charge amount by ticket's Late_charge_Precentage and latest advance balance
        const lateChargePrecentage = Number(ticekt.Late_charge_Precentage) || 0;
        const latestAdvanceBalance =
          Number(latestLogResult[0]?.Advance_Balance) || 0;
        lateChargeAmount = (latestAdvanceBalance * lateChargePrecentage) / 100;
        // compute the total balance
        let totalBalance =
          latestAdvanceBalance +
          (Number(latestLogResult[0]?.Interest_Balance) || 0) +
          (Number(latestLogResult[0]?.Service_Charge_Balance) || 0) +
          lateChargeAmount +
          (Number(latestLogResult[0]?.Aditional_Charge_Balance) || 0);

        // Insert a new log to ticket log
        const [result] = await pool.query(
          "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket,Type,Description,Amount,Advance_Balance,Interest_Balance,Service_Charge_Balance,Late_Charges_Balance,Aditional_Charge_Balance,Total_Balance)",
          [
            ticekt,
            type,
            description,
            lateChargeAmount,
            latestLogResult[0]?.Advance_Balance,
            latestLogResult[0]?.Interest_Balance,
            latestLogResult[0]?.Service_Charge_Balance,
            lateChargeAmount,
            latestLogResult[0]?.Aditional_Charge_Balance,
            totalBalance,
          ]
        );

        if (result.affectedRows === 0) {
          throw new Error("Failed to add daily penalty ticket log");
        }
      }
    }
  } catch (error) {
    console.error("Error adding daily ticket log:", error);
    throw new Error("Error adding daily ticket log");
  }
};
