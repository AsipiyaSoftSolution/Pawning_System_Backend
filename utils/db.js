import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// Toggle SSL via env if you later move to a server that supports it
// e.g., DB_SSL=true
const USE_SSL = String(process.env.DB_SSL || "").toLowerCase() === "true";
const USE_SSL2 = String(process.env.DB2_SSL || "").toLowerCase() === "true";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,

  // --- Supported pool options ---
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60_000, // valid
  enableKeepAlive: true, // valid
  keepAliveInitialDelay: 10_000, // valid
  maxIdle: 10, // valid in mysql2 v3+
  idleTimeout: 900_000, // valid in mysql2 v3+ (15 min)
  timezone: "+05:30",

  // IMPORTANT: only set ssl if you actually want TLS.
  // Your server currently does not support TLS, so leave it undefined.
  ...(USE_SSL ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Optional: tiny helper with 1 retry on transient errors (no monkey-patching)
export async function execWithRetry(sql, params = []) {
  try {
    return await pool.execute(sql, params);
  } catch (err) {
    if (
      ["PROTOCOL_CONNECTION_LOST", "ECONNRESET", "ETIMEDOUT"].includes(err.code)
    ) {
      await new Promise((r) => setTimeout(r, 100));
      return pool.execute(sql, params);
    }
    throw err;
  }
}

export const connectDB = async () => {
  let retries = 3;

  while (retries > 0) {
    try {
      console.log(`Attempting to connect to database... (${4 - retries}/3)`);
      const conn = await pool.getConnection();
      await conn.execute("SELECT 1");
      conn.release();
      console.log("Database connection established successfully");
      return true;
    } catch (error) {
      console.error("Database connection error:", error.message);

      if (error.code === "PROTOCOL_CONNECTION_LOST") {
        console.error("Database connection was closed.");
      } else if (error.code === "ER_CON_COUNT_ERROR") {
        console.error("Database has too many connections.");
      } else if (error.code === "ECONNREFUSED") {
        console.error("Database connection was refused.");
      } else if (error.code === "ETIMEDOUT" || error.code === "ENETUNREACH") {
        console.error(
          "Cannot reach database server. Check host/port/firewall."
        );
      } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
        console.error("Database credentials are incorrect");
      } else if (error.code === "HANDSHAKE_NO_SSL_SUPPORT") {
        console.error(
          "Server does not support SSL; remove ssl config or set DB_SSL=false"
        );
      }

      retries--;
      if (retries > 0) {
        console.log(`Retrying in 5 seconds... (${retries} attempts remaining)`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        throw error;
      }
    }
  }
};

// ==================== DB2 (account_center_asipiya) ====================

export const pool2 = mysql.createPool({
  host: process.env.DB2_HOST,
  user: process.env.DB2_USER,
  password: process.env.DB2_PASSWORD,
  database: process.env.DB2_NAME,
  port: Number(process.env.DB2_PORT) || 3306,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60_000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
  maxIdle: 10,
  idleTimeout: 900_000,
  timezone: "+05:30",

  ...(USE_SSL2 ? { ssl: { rejectUnauthorized: false } } : {}),
});

// Helper with 1 retry for DB2
export async function execWithRetry2(sql, params = []) {
  try {
    return await pool2.execute(sql, params);
  } catch (err) {
    if (
      ["PROTOCOL_CONNECTION_LOST", "ECONNRESET", "ETIMEDOUT"].includes(err.code)
    ) {
      await new Promise((r) => setTimeout(r, 100));
      return pool2.execute(sql, params);
    }
    throw err;
  }
}

export const connectDB2 = async () => {
  let retries = 3;

  while (retries > 0) {
    try {
      console.log(
        `Attempting to connect to DB2 (account_center)... (${4 - retries}/3)`
      );
      const conn = await pool2.getConnection();
      await conn.execute("SELECT 1");
      conn.release();
      console.log("DB2 (account_center) connection established successfully");
      return true;
    } catch (error) {
      console.error("DB2 connection error:", error.message);

      if (error.code === "PROTOCOL_CONNECTION_LOST") {
        console.error("DB2 connection was closed.");
      } else if (error.code === "ER_CON_COUNT_ERROR") {
        console.error("DB2 has too many connections.");
      } else if (error.code === "ECONNREFUSED") {
        console.error("DB2 connection was refused.");
      } else if (error.code === "ETIMEDOUT" || error.code === "ENETUNREACH") {
        console.error("Cannot reach DB2 server. Check host/port/firewall.");
      } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
        console.error("DB2 credentials are incorrect");
      } else if (error.code === "HANDSHAKE_NO_SSL_SUPPORT") {
        console.error("DB2 server does not support SSL; set DB2_SSL=false");
      }

      retries--;
      if (retries > 0) {
        console.log(
          `Retrying DB2 in 5 seconds... (${retries} attempts remaining)`
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        throw error;
      }
    }
  }
};
