import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { getActivityLogs } from "../controllers/activityLog.controller.js";

const route = express.Router();

/**
 * Used by:
 * - Account Center subsystem proxy (`GET .../api/activity-logs`)
 * - Pawning Activity Log page
 */
route.get("/", protectedRoute, getActivityLogs);

export default route;
