import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  createCustomer,
  createFromApproval,
  customerUpdatedAfterApproval,
  getCustomersForTheBranch,
  getCustomerById,
  editCustomer,
  checkCustomerByNICWhenCreating,
  checkCustomerExistsForCreation,
  getCustomerDataByNIC,
  deleteDocuments,
  getCustomerLogsDataById,
  blacklistCustomer,
  getCustomerPaymentHistory,
  getCustomerTickets,
  getKycDataForAccountCenter,
  generateCustomerNumber,
  updateCustomerNumberFormat,
  batchUpdateCustomerNumbers,
  blacklistCustomerCallback,
  linkExistingCustomer,
  linkCustomerCallback,
} from "../controllers/customer.controller.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import { checkUserSelectedHeadBranch } from "../middlewares/headBranch.middleware.js";
import { checkUserHasPrivileges } from "../middlewares/privilages.middleware.js";
import { PAWNING_PRIVILEGES as P } from "../constants/pawningPrivileges.js";

const router = express.Router();

// KYC data for Account Center
router.get(
  "/kyc/:customerId",
  protectedRoute,
  checkUserHasPrivileges([P.KYC_ACCESS, P.CUSTOMER_VIEW]),
  getKycDataForAccountCenter,
);

router.post(
  "/:branchId/create",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.CUSTOMER_CREATE]),
  createCustomer,
);

router.post(
  "/:branchId/link-existing",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.CUSTOMER_CREATE]),
  linkExistingCustomer,
);

// Called by Account Center when CUSTOMER CREATE approval is fully approved (server-to-server)
router.post("/:branchId/create-from-approval", createFromApproval);

// Called by Account Center when CUSTOMER DETAILS UPDATE approval is fully approved (server-to-server)
router.post(
  "/:branchId/customer-updated-after-approval",
  customerUpdatedAfterApproval,
);

router.get(
  "/:branchId/customers",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  checkUserHasPrivileges([P.CUSTOMER_VIEW, P.CUSTOMER_CREATE, P.CUSTOMER_UPDATE]),
  getCustomersForTheBranch,
);

router.get(
  "/:branchId/customer/:id",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  checkUserHasPrivileges([P.CUSTOMER_VIEW, P.CUSTOMER_CREATE, P.CUSTOMER_UPDATE]),
  getCustomerById,
);

router.patch(
  "/:branchId/customer/:id/edit",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.CUSTOMER_UPDATE]),
  editCustomer,
);

router.post(
  "/:branchId/check-customer-nic",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.CUSTOMER_CREATE]),
  checkCustomerByNICWhenCreating,
);

router.get(
  "/:branchId/check-exists-for-creation",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.CUSTOMER_CREATE]),
  checkCustomerExistsForCreation,
);

router.get(
  "/:branchId/customer-data-by-nic/:nic",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.CUSTOMER_VIEW, P.CUSTOMER_CREATE, P.TICKET_CREATE]),
  getCustomerDataByNIC,
);

router.delete(
  "/:branchId/customer/:customerId/delete-documents/:documentId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.CUSTOMER_UPDATE]),
  deleteDocuments,
);

router.get(
  "/:branchId/customer-logs/:customerId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.CUSTOMER_VIEW, P.CUSTOMER_UPDATE]),
  getCustomerLogsDataById,
);

router.get(
  "/:branchId/customer-payment-history/:customerId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([
    P.CUSTOMER_VIEW,
    P.PAYMENTS_HISTORY_VIEW,
    P.TICKET_PAYMENT_HISTORY_VIEW,
  ]),
  getCustomerPaymentHistory,
);

router.get(
  "/:branchId/customer-tickets/:customerId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.CUSTOMER_VIEW, P.TICKET_VIEW]),
  getCustomerTickets,
);

router.patch(
  "/:branchId/blacklist-customer/:customerId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.CUSTOMER_UPDATE]),
  blacklistCustomer,
);

router.get(
  "/:branchId/generate-customer-number",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.CUSTOMER_CREATE]),
  generateCustomerNumber,
);

// Admin / AC sync helpers — auth only (format/migration tools)
router.patch(
  "/update-customer-number-format",
  protectedRoute,
  updateCustomerNumberFormat,
);

router.patch(
  "/batch-update-customer-numbers",
  protectedRoute,
  batchUpdateCustomerNumbers,
);

// Callbacks from Account Center
router.patch("/blacklist", protectedRoute, blacklistCustomerCallback);
router.post("/:branchId/link-customer", protectedRoute, linkCustomerCallback);

export default router;
