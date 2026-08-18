import express from "express";
import { getDashboardMetrics } from "../controllers/dashboard.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import { checkUserSelectedHeadBranch } from "../middlewares/headBranch.middleware.js";

const router = express.Router();

// GET /api/dashboard/:branchId/metrics?cards=new_loans,expiring_articles,loans_vs_redemptions
router.get(
  "/:branchId/metrics",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  getDashboardMetrics,
);

export default router;
