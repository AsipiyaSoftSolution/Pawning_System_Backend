import dotenv from "dotenv";
import express from "express";

dotenv.config();

import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB, pool } from "./utils/db.js";

// routes import
import authRoutes from "./routes/auth.route.js";
import companyRoutes from "./routes/company.route.js";
import customerRoutes from "./routes/customer.route.js";
import uiSettingRoutes from "./routes/ui.setting.route.js";
import pawningProductRoutes from "./routes/pawning.product.route.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  try {
    connectDB();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1); // Exit the process if database connection fails
  }
  console.log(`Server is running on port ${PORT}`);
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
