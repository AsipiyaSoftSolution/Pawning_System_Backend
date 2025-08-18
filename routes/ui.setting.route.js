import express from "express";
import {
  getDashboardCardVisibility,
  updateDashboardCardVisibility
} from "../controllers/ui.setting.controller.js";

import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/dashboard-cards/:branchId/:companyId", protectedRoute, getDashboardCardVisibility);
router.put("/dashboard-cards/:branchId/:companyId", protectedRoute, updateDashboardCardVisibility);
 

export default router;
