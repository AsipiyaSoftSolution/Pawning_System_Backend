import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB, pool } from "./utils/db.js";

// routes import
import authRoutes from "./routes/auth.route.js";
import companyRoutes from "./routes/company.route.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);

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
