import dotenv from "dotenv";
import express from "express";
import cron from "node-cron";
dotenv.config();

import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB, pool } from "./utils/db.js";
import { verifyConnection } from "./utils/mailConfig.js";
// routes import
import authRoutes from "./routes/auth.route.js";
import companyRoutes from "./routes/company.route.js";
import customerRoutes from "./routes/customer.route.js";
import uiSettingRoutes from "./routes/ui.setting.route.js";
import pawningProductRoutes from "./routes/pawning.product.route.js";
import pawningTicketRoutes from "./routes/pawning.ticket.route.js";
import chartAccountRoutes from "./routes/chart.account.route.js";
import pawningTicketPaymentRoutes from "./routes/pawning.ticket.payment.route.js";
import manualJournalRoutes from "./routes/manual.journal.route.js";
import accountRoutes from "./routes/account.route.js";
import cashierRoutes from "./routes/cashier.route.js";

// Shedule cron jobs
import { addDailyTicketLog } from "./utils/pawning.ticket.logs.js";

dotenv.config();

const app = express();
// CORS: exact match, no trailing slash; also allows localhost dev
const CLIENT = (
  process.env.CLIENT_URL || "https://pawning.asipbook.com"
).replace(/\/$/, "");

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // same-origin / server-to-server
      if (origin === CLIENT) return cb(null, true); // production frontend
      if (
        origin === "http://localhost:5173" ||
        origin === "http://127.0.0.1:5173"
      )
        return cb(null, true); // dev
      return cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 204,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/ui-settings", uiSettingRoutes);
app.use("/api/pawning-product", pawningProductRoutes);
app.use("/api/pawning-ticket", pawningTicketRoutes);
app.use("/api/chart-account", chartAccountRoutes);
app.use("/api/pawning-ticket-payment", pawningTicketPaymentRoutes);
app.use("/api/manual-journal", manualJournalRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/cashier", cashierRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  try {
    connectDB();
    verifyConnection();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1); // Exit the process if database connection fails
  }
  console.log(`Server is running on port ${PORT}`);
});

/*
// Manual test endpoint for daily ticket log functions...
app.post("/api/test/daily-ticket-log", async (req, res) => {
  try {
    console.log("Manual test started at:", new Date().toISOString());
    await addDailyTicketLog();
    console.log("Manual test completed successfully");

    res.json({
      success: true,
      message: "Daily ticket log job completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Manual test failed:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
*/

// schedule cron job to run every day at 12AM
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily ticket log job at:", new Date().toISOString());
  try {
    await addDailyTicketLog();
    console.log("Daily ticket log job completed successfully");
  } catch (error) {
    console.error("Daily ticket log job failed:", error);
  }
});

// error handle
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
