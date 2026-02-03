import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  createCustomer,
  createFromApproval,
  getCustomersForTheBranch,
  getCustomerById,
  editCustomer,
  checkCustomerByNICWhenCreating,
  getCustomerDataByNIC,
  deleteDocuments,
  getCustomerLogsDataById,
  blacklistCustomer,
  getCustomerPaymentHistory,
  getCustomerTickets,
  getKycDataForAccountCenter,
  // getCustomerCompleteDataById,
  generateCustomerNumber,
} from "../controllers/customer.controller.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import { checkUserSelectedHeadBranch } from "../middlewares/headBranch.middleware.js";

const router = express.Router();

// KYC data for Account Center (server-to-server, no auth) - must be before /:branchId
router.get("/kyc/:customerId", getKycDataForAccountCenter);

router.post(
  "/:branchId/create",
  protectedRoute,
  checkUserBranchAccess,
  createCustomer
); // Create a new customer

// Called by Account Center when CUSTOMER CREATE approval is fully approved (server-to-server)
router.post("/:branchId/create-from-approval", createFromApproval);

router.get(
  "/:branchId/customers",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  getCustomersForTheBranch
); // Get customers for a specific branch | or search customers by NIC,Mobile NO, Customer Id or Name

router.get(
  "/:branchId/customer/:id",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  getCustomerById
);
// Get a customer by ID for a specific branch

router.patch(
  "/:branchId/customer/:id/edit",
  protectedRoute,
  checkUserBranchAccess,
  editCustomer
); // Edit a customer by ID for a specific branch

router.post(
  "/:branchId/check-customer-nic",
  protectedRoute,
  checkUserBranchAccess,
  checkCustomerByNICWhenCreating
); // Check if a customer with the given NIC exists in the system when creating a new customer

router.get(
  "/:branchId/customer-data-by-nic/:nic",
  protectedRoute,
  checkUserBranchAccess,
  getCustomerDataByNIC
); // Get customer data by NIC if there is a user in the system

router.delete(
  "/:branchId/customer/:customerId/delete-documents/:documentId",
  protectedRoute,
  checkUserBranchAccess,
  deleteDocuments
);

// get customer logs data by id
router.get(
  "/:branchId/customer-logs/:customerId",
  protectedRoute,
  checkUserBranchAccess,
  getCustomerLogsDataById
);

// get customer payment history
router.get(
  "/:branchId/customer-payment-history/:customerId",
  protectedRoute,
  checkUserBranchAccess,
  getCustomerPaymentHistory
);

// get customer tickets
router.get(
  "/:branchId/customer-tickets/:customerId",
  protectedRoute,
  checkUserBranchAccess,
  getCustomerTickets
);

/*
// get customer all KYC data by ID
router.get(
  "/:branchId/customer-kyc/:customerId",
  protectedRoute,
  checkUserBranchAccess,
  getCustomerCompleteDataById,
);
*/
// blacklist a customer
router.patch(
  "/:branchId/blacklist-customer/:customerId",
  protectedRoute,
  checkUserBranchAccess,
  blacklistCustomer
);

// generate customer number
router.get(
  "/:branchId/generate-customer-number",
  protectedRoute,
  checkUserBranchAccess,
  generateCustomerNumber
);

export default router;
