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

// All routes require authentication
router.use(protectedRoute);

// Get dashboard card visibility settings for a specific branch
router.get("/dashboard-cards/:branchId", getDashboardCardVisibility);

// Update single dashboard card visibility setting
router.put("/dashboard-cards/:branchId", updateDashboardCardVisibility);

// Bulk update dashboard card visibility settings
router.put("/dashboard-cards/:branchId/bulk", bulkUpdateDashboardCardVisibility);

// Delete specific dashboard card visibility setting
router.delete("/dashboard-cards/:branchId/:cardId", deleteDashboardCardVisibility);

// Reset all dashboard card visibility settings for a user in a branch
router.delete("/dashboard-cards/:branchId/reset", resetDashboardCardVisibility);

export default router;
