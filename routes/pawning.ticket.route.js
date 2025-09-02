import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import {
  createPawningTicket,
  getGrandSeqNo,
  getProductsAndInterestMethod,
  getProductPlanPeriods,
  searchCustomerByNIC,
  getCaratages,
  getMaxMinPeriod,
} from "../controllers/pawning.ticket.controller.js";
const router = express.Router();

router.post("/", protectedRoute, checkUserBranchAccess, createPawningTicket);
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
// Get caratages
router.get(
  "/:branchId/get-caratages/:productPlanId",
  protectedRoute,
  checkUserBranchAccess,
  getCaratages
);
export default router;
