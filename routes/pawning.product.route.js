import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import {
  createPawningProduct,
  createPawningProductForBranches,
  getPawningProductById,
  getPawningProducts,
  deletePawningProductById,
  updatePawningProductById,
} from "../controllers/pawning.product.controller.js";
import {
  checkUserSelectedHeadBranch,
  requireHeadBranch,
} from "../middlewares/headBranch.middleware.js";
import { checkUserHasPrivileges } from "../middlewares/privilages.middleware.js";
import { PAWNING_PRIVILEGES as P } from "../constants/pawningPrivileges.js";

const route = express.Router();

route.post(
  "/:branchId/create",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.PRODUCT_CREATE]),
  createPawningProduct,
);

route.post(
  "/:branchId/create-for-branches",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  requireHeadBranch,
  checkUserHasPrivileges([P.PRODUCT_CREATE]),
  createPawningProductForBranches,
);

route.get(
  "/:branchId/:productId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.PRODUCT_VIEW, P.PRODUCT_UPDATE, P.PRODUCT_CREATE]),
  getPawningProductById,
);

route.get(
  "/:branchId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  checkUserHasPrivileges([P.PRODUCT_VIEW, P.PRODUCT_UPDATE, P.PRODUCT_CREATE]),
  getPawningProducts,
);

route.delete(
  "/:branchId/:productId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.PRODUCT_UPDATE]),
  deletePawningProductById,
);

route.patch(
  "/:branchId/:productId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.PRODUCT_UPDATE]),
  updatePawningProductById,
);

export default route;
