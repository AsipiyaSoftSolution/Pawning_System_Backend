import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import {
  startCashierRegistryForDay,
  getTodayCashierRegistry,
  getCashierAccountLogsData,
  getCashierDashboardSummary,
  getCashierDenominationSummary,
} from "../controllers/cashier.controller.js";

const route = express.Router();

// Start or update cashier registry for the day
route.post(
  "/:branchId/cashier-registry-start-or-update",
  protectedRoute,
  checkUserBranchAccess,
  startCashierRegistryForDay
);

// Get today's cashier registry and cash entries
route.get(
  "/:branchId/cashier-registry-today",
  protectedRoute,
  checkUserBranchAccess,
  getTodayCashierRegistry
);

// Get cashier account logs data for current date to cashier dashboard for the current day
route.get(
  "/:branchId/cashier-account-logs-current-date/:accountId",
  protectedRoute,
  checkUserBranchAccess,
  getCashierAccountLogsData
);

// Get cashier dashboard summary data for the day
route.get(
  "/:branchId/cashier-dashboard-summary/:accountId",
  protectedRoute,
  checkUserBranchAccess,
  getCashierDashboardSummary
);

// Get cashier denomination summary data for the day
route.get(
  "/:branchId/cashier-denomination-summary/:accountId",
  protectedRoute,
  checkUserBranchAccess,
  getCashierDenominationSummary
);
export default route;
