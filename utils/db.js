import mysql2 from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const connectDB = async () => {
  try {
    await pool.getConnection();
    console.log("Database connection established successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};
