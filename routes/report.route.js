import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import {
  fullTicketDetailsReport,
  articlesInHandReport,
  paymentsReport,
  dailyTicketIncomeReport,
  fetchAndSendAllProductsForSelectedBranch,
  fetchAndSendAllTicketsForSelectedPawningProduct,
} from "../controllers/report.controller.js";
import { checkUserHasPrivileges } from "../middlewares/privilages.middleware.js";
import { PAWNING_PRIVILEGES as P } from "../constants/pawningPrivileges.js";

const route = express.Router();

const requireReports = checkUserHasPrivileges([P.REPORTS]);

route.get(
  "/:branchId/full-ticket-details",
  protectedRoute,
  checkUserBranchAccess,
  requireReports,
  fullTicketDetailsReport,
);

route.get(
  "/:branchId/articles-in-hand",
  protectedRoute,
  checkUserBranchAccess,
  requireReports,
  articlesInHandReport,
);

route.get(
  "/:branchId/payments",
  protectedRoute,
  checkUserBranchAccess,
  requireReports,
  paymentsReport,
);

route.get(
  "/:branchId/daily-ticket-income",
  protectedRoute,
  checkUserBranchAccess,
  requireReports,
  dailyTicketIncomeReport,
);

route.get(
  "/:branchId/fetch-and-send-all-products",
  protectedRoute,
  checkUserBranchAccess,
  requireReports,
  fetchAndSendAllProductsForSelectedBranch,
);

route.get(
  "/:branchId/fetch-and-send-all-tickets",
  protectedRoute,
  checkUserBranchAccess,
  requireReports,
  fetchAndSendAllTicketsForSelectedPawningProduct,
);

export default route;
