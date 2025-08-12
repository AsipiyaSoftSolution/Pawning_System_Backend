import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { createCustomer } from "../controllers/customer.controller.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";

const router = express.Router();

router.post(
  "/:branchId/create",
  protectedRoute,
  checkUserBranchAccess,
  createCustomer
); // Create a new customer

export default router;
