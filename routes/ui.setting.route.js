import express from "express";
import {
  getDashboardCardVisibility,
  updateDashboardCardVisibility,
  bulkUpdateDashboardCardVisibility,
  deleteDashboardCardVisibility,
  resetDashboardCardVisibility
} from "../controllers/ui.setting.controller.js";

import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/dashboard-cards/:branchId", protectedRoute, getDashboardCardVisibility);

// Update single dashboard card visibility setting
router.put("/dashboard-cards/:branchId", protectedRoute, updateDashboardCardVisibility);

// Bulk update dashboard card visibility settings
router.put("/dashboard-cards/:branchId/bulk", protectedRoute, bulkUpdateDashboardCardVisibility);

// Delete specific dashboard card visibility setting
router.delete("/dashboard-cards/:branchId/:cardId", protectedRoute, deleteDashboardCardVisibility);

// Reset all dashboard card visibility settings for a user in a branch
router.delete("/dashboard-cards/:branchId/reset", protectedRoute, resetDashboardCardVisibility);

export default router;
