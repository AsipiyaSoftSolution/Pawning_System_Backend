import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import { startCashierRegistryForDay } from "../controllers/cashier.controller.js";

const route = express.Router();

route.post(
  "/:branchId/cashier-registry-start-or-update",
  protectedRoute,
  checkUserBranchAccess,
  startCashierRegistryForDay
);

export default route;
