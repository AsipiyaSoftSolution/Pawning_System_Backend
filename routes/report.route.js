import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import {
  loanToMarketValueReport,
  getCompanyBranches,
  ticketDayEndReport,
} from "../controllers/report.controller.js";

const route = express.Router();

// Route to get Loan to Market Value report for a specific branch
route.get(
  "/:branchId/loan-to-market-value",
  protectedRoute,
  checkUserBranchAccess,
  loanToMarketValueReport
);

// Route to get Day End Ticket Report
route.get(
  "/:branchId/day-end-ticket-report",
  protectedRoute,
  ticketDayEndReport
);

// New route to get company branches for the filter dropdown
route.get("/company-branches", protectedRoute, getCompanyBranches);
export default route;
