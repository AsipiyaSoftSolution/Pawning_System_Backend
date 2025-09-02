import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import {
  createPawningTicket,
  getGrandSeqNo,
  getProductsAndInterestMethod,
  getPeriodTypesAndData,
  searchCustomerByNIC,
  getCaratages,
} from "../controllers/pawning.ticket.controller.js";
const router = express.Router();

router.post("/", protectedRoute, checkUserBranchAccess, createPawningTicket);
// Get Grand SEQ.No for today
router.get(
  "/:branchId/grand-seq-no",
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
// Get period types and period data of a specific pawning product
router.get(
  "/:branchId/period-types-and-data/:productId",
  protectedRoute,
  checkUserBranchAccess,
  getPeriodTypesAndData
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
