import express from "express";
import {
  getDashboardUIComponents,
  updateDashboardCardVisibility,
  updateDashboardCardColors,
} from "../controllers/ui.setting.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";

const router = express.Router();

router.get(
  "/:branchId/dashboard-cards",
  protectedRoute,
  checkUserBranchAccess,
  getDashboardUIComponents
);
router.post(
  "/:branchId/dashboard-card-visibility/:card_id",
  protectedRoute,
  checkUserBranchAccess,
  updateDashboardCardVisibility
);

router.post(
  "/:branchId/dashboard-card-colors/:card_id",
  protectedRoute,
  checkUserBranchAccess,
  updateDashboardCardColors
);

export default router;
