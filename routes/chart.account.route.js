import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  createChartAccount,
  getAllChartAccounts,
  getChartAccountById,
  // updateChartAccount,
  // deleteChartAccount
} from "../controllers/chart.account.controller.js";

const route = express.Router();

// Create a new chart of account
route.post("/", protectedRoute, createChartAccount);

// Get all chart of accounts
route.get("/", protectedRoute, getAllChartAccounts);

// Get chart of account by ID
route.get("/:id", protectedRoute, getChartAccountById);

// // Update chart of account
// route.put("/:id", protectedRoute, updateChartAccount);

// // Delete chart of account
// route.delete("/:id", protectedRoute, deleteChartAccount);

export default route;