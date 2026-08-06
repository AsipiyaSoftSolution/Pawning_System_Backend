import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import { pool } from "../utils/db.js";

const sql = fs.readFileSync("./sql/migrations/002_activity_logs.sql", "utf8");
await pool.query(sql);
const [rows] = await pool.query("SHOW TABLES LIKE 'activity_logs'");
console.log("migration ok", rows);
await pool.end();
