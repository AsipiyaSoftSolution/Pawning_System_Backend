import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import {
  createPawningTicket,
  getGrandSeqNo,
  getProductsAndInterestMethod,
  getProductPlanPeriods,
  searchCustomerByNIC,
  sendCaratageAmountForSelectedProductItem,
  getMaxMinPeriod,
  sendAssessedValues,
  getTicketGrantSummaryData,
  getTicketDataById,
  getTicketComments,
} from "../controllers/pawning.ticket.controller.js";
const router = express.Router();

router.post(
  "/:branchId/create",
  protectedRoute,
  checkUserBranchAccess,
  createPawningTicket
);
// Get Grand SEQ.No for today
router.get(
  "/:branchId/grant-seq-no",
  protectedRoute,
  checkUserBranchAccess,
  getGrandSeqNo
);
// Get products and their interest methods
router.get(
  "/:branchId/products-and-interest-method",
  protectedRoute,
  checkUserBranchAccess,
  getProductsAndInterestMethod
);
// Get unique period types of a specific pawning product's product plans to frontend
router.get(
  "/:branchId/period-types-and-data/:productId",
  protectedRoute,
  checkUserBranchAccess,
  getProductPlanPeriods
);

// Get max and min period of a specific pawning product's product plans to frontend
router.get(
  "/:branchId/max-min-period/:productId/:periodType",
  protectedRoute,
  checkUserBranchAccess,
  getMaxMinPeriod
);
// Search customer by NIC and get their details
router.get(
  "/:branchId/search-customer/:nic",
  protectedRoute,
  checkUserBranchAccess,
  searchCustomerByNIC
);

// Get caratage amount and selected product item data
router.get(
  "/:branchId/get-caratage-and-data",
  protectedRoute,
  checkUserBranchAccess,
  sendCaratageAmountForSelectedProductItem
);

// Send assessed values to frontend based on caratage amount
router.get(
  "/:branchId/assessed-value",
  protectedRoute,
  checkUserBranchAccess,
  sendAssessedValues
);

// Get ticket grant summary data
router.get(
  "/:branchId/grant-summary-data",
  protectedRoute,
  checkUserBranchAccess,
  getTicketGrantSummaryData
);

router.get(
  "/:branchId/ticket/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  getTicketDataById
); // Get ticket all data by ID

router.get(
  "/:branchId/ticket-comments/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  getTicketComments
); // Get ticket comments by ticket ID
export default router;
