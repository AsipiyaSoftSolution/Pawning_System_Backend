import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import {
  startCashierRegistryForDay,
  getTodayCashierRegistry,
} from "../controllers/cashier.controller.js";

const route = express.Router();

// Start or update cashier registry for the day
route.post(
  "/:branchId/cashier-registry-start-or-update",
  protectedRoute,
  checkUserBranchAccess,
  startCashierRegistryForDay
);

// Get today's cashier registry and cash entries
route.get(
  "/:branchId/cashier-registry-today",
  protectedRoute,
  checkUserBranchAccess,
  getTodayCashierRegistry
);

export default route;
