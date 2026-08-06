import dotenv from "dotenv";
dotenv.config();
import { pool } from "../utils/db.js";

const REMOVE_IDS = [5, 8, 23, 27, 41, 43, 50];

const RENAMES = [
  [1, "Articles Expiring"],
  [2, "Overdue Articles"],
  [3, "Full Transaction Log"],
  [4, "High-Value Transactions"],
  [6, "Full Active Article List"],
  [7, "Vault Inventory Ledger"],
  [9, "Customer List (CRM)"],
  [10, "Last Month Settled Articles"],
  [11, "New Loans"],
  [12, "Redemptions"],
  [13, "Interest & Fees Collected"],
  [14, "Net Cash Flow"],
  [15, "New Pledges"],
  [16, "Week-to-Date (WTD) New Loans"],
  [17, "Month-to-Date (MTD) Interest Income"],
  [18, "Pledges Renewed this Month"],
  [19, "Total Active Loan Capital"],
  [20, "Total Articles in Vault"],
  [21, "Loan vs Redemption Trend"],
  [22, "Monthly Income Trend"],
  [24, "Revenue Sources Breakdown"],
  [25, "Busiest Hours of the Day"],
  [26, "New vs Repeat Customers"],
  [28, "Customer Acquisition Trend"],
  [29, "Loan Value Distribution"],
  [30, "Gold Karat Distribution"],
  [31, "Total Gold Weight Held"],
  [32, "Average Loan-to-Value (LTV) Ratio"],
  [33, "Articles Expiring in 7 Days"],
  [34, "Overdue Articles Count"],
  [39, "New Customers"],
  [40, "Last Month Renewals"],
  [42, "User Activity Log"],
  [44, "Top Customers by Loan Volume"],
  [45, "Articles by Status"],
  [46, "Loan-to-Value (LTV) Ratio Distribution"],
  [47, "This Month vs Last Month Performance"],
  [48, "Weekly Performance Snapshot"],
  [49, "Upcoming Expiry Volume"],
];

const connection = await pool.getConnection();
try {
  await connection.beginTransaction();

  await connection.query(
    `DELETE FROM user_card_visibility WHERE card_id IN (?)`,
    [REMOVE_IDS],
  );
  await connection.query(`DELETE FROM dashboard_cards WHERE card_id IN (?)`, [
    REMOVE_IDS,
  ]);

  for (const [id, name] of RENAMES) {
    await connection.query(
      `UPDATE dashboard_cards SET card_name = ? WHERE card_id = ?`,
      [name, id],
    );
  }

  await connection.commit();

  const [rows] = await connection.query(
    `SELECT card_id, card_name, card_category FROM dashboard_cards ORDER BY card_id`,
  );
  console.log("dashboard_cards count:", rows.length);
  console.table(rows);
} catch (err) {
  await connection.rollback();
  throw err;
} finally {
  connection.release();
  await pool.end();
}
