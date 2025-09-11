import { pool } from "../utils/db.js";

// Create customer log when a ticket is created
export const createCustomerLogOnCreateTicket = async (
  type,
  description,
  customerId,
  userId
) => {
  try {
    const [result] = await pool.query(
      "INSERT INTO customer_log (Type, Description, Customer_idCustomer, User_idUser, Date_Time) VALUES (?, ?, ?, ?, NOW())",
      [type, description, customerId, userId]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to create customer log");
    }
  } catch (error) {
    console.error("Error creating customer log:", error);
    throw new Error("Error creating customer log");
  }
};

// Create a customer log when a ticket penality is applied
export const createCustomerLogOnTicketPenality = async (
  type,
  description,
  customerId,
  userId
) => {
  try {
    const [result] = await pool.query(
      "INSERT INTO customer_log (Type, Description, Customer_idCustomer, User_idUser, Date_Time) VALUES (?, ?, ?, ?, NOW())",
      [type, description, customerId, userId]
    );
    if (result.affectedRows === 0) {
      throw new Error("Failed to create customer log for ticket penality");
    }
  } catch (error) {
    console.error("Error creating customer log for ticket penality:", error);
    throw new Error("Error creating customer log for ticket penality");
  }
};
