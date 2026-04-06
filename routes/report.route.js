import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import {
  fullTicketDetailsReport,
  articlesInHandReport,
  paymentsReport,
  dailyTicketIncomeReport,
} from "../controllers/report.controller.js";

const route = express.Router();

// Route to get Full Ticket Details Report
route.get(
  "/:branchId/full-ticket-details",
  protectedRoute,
  checkUserBranchAccess,
  fullTicketDetailsReport,
);

// Route to get Articles In Hand Report
route.get(
  "/:branchId/articles-in-hand",
  protectedRoute,
  checkUserBranchAccess,
  articlesInHandReport,
);

// Route to get Payments Report
route.get(
  "/:branchId/payments",
  protectedRoute,
  checkUserBranchAccess,
  paymentsReport,
);

// Route to get Daily Ticket Income Report
route.get(
  "/:branchId/daily-ticket-income",
  protectedRoute,
  checkUserBranchAccess,
  dailyTicketIncomeReport,
);

export default route;
