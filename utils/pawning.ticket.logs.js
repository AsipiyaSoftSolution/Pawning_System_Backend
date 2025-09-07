import { pool } from "../utils/db.js";

export const createPawningTicketLogOnCreate = async (
  ticketId,
  type,
  userId
) => {
  try {
    const [result] = await pool.query(
      "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket,Type,Type_Id,User_idUser,Date_Time) VALUES (?,?,?,?, NOW())",
      [ticketId, type, ticketId, userId]
    );

    if (result.affectedRows === 1) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error creating pawning ticket log:", error);
    return error;
  }
};
