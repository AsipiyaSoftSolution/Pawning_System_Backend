import mysql from "mysql2/promise";
import dotenv from "dotenv";
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
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
