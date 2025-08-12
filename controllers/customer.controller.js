import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";

// Create a new customer
export const createCustomer = async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)",
      [name, email, phone]
    );

    res.status(201).json({ message: "Customer created", customerId: result.insertId });
  } catch (error) {
    errorHandler(error, res);
  }
};

// Update an existing customer
export const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?",
      [name, email, phone, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer updated" });
  } catch (error) {
    errorHandler(error, res);
  }
};

// Delete a customer
export const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM customers WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({ message: "Customer deleted" });
  } catch (error) {
    errorHandler(error, res);
  }
};
