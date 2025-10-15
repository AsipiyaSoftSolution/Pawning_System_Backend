import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import {
  createChartAccount,
  getAllChartAccounts,
  getChartAccountById,
} from "../controllers/chart.account.controller.js";

const route = express.Router();

// Create a new chart of account
route.post(
  "/:branchId",
  protectedRoute,
  checkUserBranchAccess,
  createChartAccount
);

// Get all chart of accounts
route.get(
  "/:branchId",
  protectedRoute,
  checkUserBranchAccess,
  getAllChartAccounts
);

// Get chart of account by ID
route.get("/:id", protectedRoute, getChartAccountById);

// // Update chart of account
// route.put("/:id", protectedRoute, updateChartAccount);

// // Delete chart of account
// route.delete("/:id", protectedRoute, deleteChartAccount);

export default route;
