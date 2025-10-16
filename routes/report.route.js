import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import { loanToMarketValueReport } from "../controllers/report.controller.js";

const route = express.Router();

route.get(
  "/:branchId/loan-to-market-value",
  protectedRoute,
  checkUserBranchAccess,
  loanToMarketValueReport
);

export default route;
