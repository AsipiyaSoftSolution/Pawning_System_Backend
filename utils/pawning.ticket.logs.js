import { pool } from "../utils/db.js";

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

    if (result.affectedRows === 1) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error creating pawning ticket log:", error);
    return false;
  }
};
