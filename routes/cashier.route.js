import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import {
  startCashierRegistryForDay,
  getTodayCashierRegistry,
  getCashierAccountLogsData,
  getCashierDashboardSummary,
  getCashierDenominationSummary,
  getCashierDailyExpenses,
  getCashierAccountDayLogWithSummaryCards,
  checkCashierDayEndAvailability,
  getCashierDayEndPrintData,
  endCashierDay,
  getCashierAccountDataForDashboard,
  getAllCashierAccounts,
} from "../controllers/cashier.controller.js";

const route = express.Router();

// Day Start Routes
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

// Day End Routes
// Check if cashier day end is available to perform day end
route.get(
  "/:branchId/check-cashier-day-end-availability/:accountId",
  protectedRoute,
  checkUserBranchAccess,
  checkCashierDayEndAvailability
);

// Get cashier day end print data
route.get(
  "/:branchId/cashier-day-end-print-data/:endRegistryId/:accountId",
  protectedRoute,
  checkUserBranchAccess,
  getCashierDayEndPrintData
);

// End cashier day
route.post(
  "/:branchId/end-cashier-day",
  protectedRoute,
  checkUserBranchAccess,
  endCashierDay
);

// Cashier Account Day Log and summary data
route.get(
  "/:branchId/cashier-account-day-log-with-summary-cards/:accountId",
  protectedRoute,
  checkUserBranchAccess,
  getCashierAccountDayLogWithSummaryCards
);

// Get cashier denomination summary data for the day
route.get(
  "/:branchId/cashier-denomination-summary/:accountId",
  protectedRoute,
  checkUserBranchAccess,
  getCashierDenominationSummary
);

// Get cashier account data for dashboard
route.get(
  "/:branchId/cashier-dashboard-data/:accountId/:cashierId",
  protectedRoute,
  checkUserBranchAccess,
  getCashierAccountDataForDashboard
);

// Get all cashier accounts for the branch
route.get(
  "/:branchId/cashier-accounts",
  protectedRoute,
  checkUserBranchAccess,
  getAllCashierAccounts
);
export default route;
