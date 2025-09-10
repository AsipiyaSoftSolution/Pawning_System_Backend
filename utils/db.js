import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,

  // Connection pool settings to prevent timeout issues
  connectionLimit: 10,
  acquireTimeout: 30000, // 30 seconds to get a connection
  timeout: 60000, // 60 seconds query timeout

  // Keep connection alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // Send keepalive after 10 seconds

  // Auto-reconnect settings
  reconnect: true,

  // Retry configuration for connection failures
  retry: {
    count: 5,
    interval: 1000,
    conditions: [
      (error) => error.code === "PROTOCOL_CONNECTION_LOST",
      (error) => error.code === "ECONNRESET",
      (error) => error.code === "ETIMEDOUT",
    ],
  },
});

// Add automatic connection validation
pool.on("acquire", (connection) => {
  console.log("Connection %d acquired", connection.threadId);
});

pool.on("release", (connection) => {
  console.log("Connection %d released", connection.threadId);
});

pool.on("connection", (connection) => {
  // Set up periodic keepalive for each new connection
  setInterval(async () => {
    try {
      await connection.ping();
    } catch (error) {
      console.log("Keepalive ping failed:", error.message);
    }
  }, 30000); // Ping every 30 seconds
});

pool.on("error", (err) => {
  console.error("Pool error:", err);
  // Auto-reconnect logic is built into mysql2
});

// Monkey patch the execute method to handle stale connections
const originalExecute = pool.execute;
pool.execute = async function (...args) {
  try {
    return await originalExecute.apply(this, args);
  } catch (error) {
    if (
      error.code === "PROTOCOL_CONNECTION_LOST" ||
      error.code === "ECONNRESET" ||
      error.code === "ETIMEDOUT"
    ) {
      console.log("Connection stale, retrying query...");

      // Give it a moment and retry
      await new Promise((resolve) => setTimeout(resolve, 100));
      return await originalExecute.apply(this, args);
    }
    throw error;
  }
};

export const connectDB = async () => {
  try {
    const connection = await pool.getConnection();

    // Test the connection
    await connection.execute("SELECT 1");

    connection.release();
    console.log("Database connection established successfully");
    return true;
  } catch (error) {
    console.error("Database connection error:", error);

    // Specific error handling
    if (error.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("Database connection was closed.");
    } else if (error.code === "ER_CON_COUNT_ERROR") {
      console.error("Database has too many connections.");
    } else if (error.code === "ECONNREFUSED") {
      console.error("Database connection was refused.");
    }

    throw error;
  }
};
