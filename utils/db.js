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
  acquireTimeout: 60000, // 60 seconds to get a connection
  timeout: 120000, // 120 seconds query timeout
  connectTimeout: 60000, // 60 seconds connection timeout

  // Keep connection alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // Send keepalive after 10 seconds

  // Auto-reconnect settings
  reconnect: true,

  // SSL/TLS settings for remote connections
  ssl: {
    rejectUnauthorized: false,
  },

  // Additional connection options
  idleTimeout: 900000, // 15 minutes
  maxIdle: 10,
  maxReusableConnections: 100,
});

// Add automatic connection validation
pool.on("acquire", (connection) => {
  //console.log("Connection %d acquired", connection.threadId);
});

pool.on("release", (connection) => {
  //console.log("Connection %d released", connection.threadId);
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
  let retries = 3;

  while (retries > 0) {
    try {
      console.log(`Attempting to connect to database... (${4 - retries}/3)`);
      const connection = await pool.getConnection();

      // Test the connection
      await connection.execute("SELECT 1");

      connection.release();
      console.log("Database connection established successfully");
      return true;
    } catch (error) {
      console.error("Database connection error:", error.message);

      // Specific error handling
      if (error.code === "PROTOCOL_CONNECTION_LOST") {
        console.error("Database connection was closed.");
      } else if (error.code === "ER_CON_COUNT_ERROR") {
        console.error("Database has too many connections.");
      } else if (error.code === "ECONNREFUSED") {
        console.error("Database connection was refused.");
      } else if (error.code === "ETIMEDOUT" || error.code === "ENETUNREACH") {
        console.error("Cannot reach database server. Please check:");
        console.error("1. Database server is running");
        console.error("2. Firewall allows connection to port 3306");
        console.error("3. Network connectivity to", process.env.DB_HOST);
        console.error("4. Database server allows remote connections");
      } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
        console.error("Database credentials are incorrect");
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
