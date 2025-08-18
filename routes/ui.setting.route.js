import express from "express";
import {
  getDashboardCardVisibility,
  updateDashboardCardVisibility
} from "../controllers/ui.setting.controller.js";

import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";

const router = express.Router();

router.get("/dashboard-cards/:branchId/:companyId", protectedRoute, checkUserBranchAccess, getDashboardCardVisibility);
router.put("/dashboard-cards/:branchId/:companyId", protectedRoute, checkUserBranchAccess, updateDashboardCardVisibility);
 

export default router;
