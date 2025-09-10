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
