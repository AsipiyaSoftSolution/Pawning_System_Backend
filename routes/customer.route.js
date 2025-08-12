import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  createCustomer,
  getCustomersForTheBranch,
  getCustomerById,
} from "../controllers/customer.controller.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";

const router = express.Router();

router.post(
  "/:branchId/create",
  protectedRoute,
  checkUserBranchAccess,
  createCustomer
); // Create a new customer
router.get(
  "/:branchId/customers",
  protectedRoute,
  checkUserBranchAccess,
  getCustomersForTheBranch
); // Get customers for a specific branch | or search customers by NIC,Mobile NO, Customer Id or Name

router.get(
  "/:branchId/customer/:id",
  protectedRoute,
  checkUserBranchAccess,
  getCustomerById
);
// Get a customer by ID for a specific branch

export default router;
