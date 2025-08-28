import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import {
  createPawningProduct,
  getPawningProductById,
  getPawningProducts,
  deletePawningProductById,
  updatePawningProductById,
} from "../controllers/pawning.product.controller.js";

const route = express.Router();

route.post(
  "/:branchId/create",
  protectedRoute,
  checkUserBranchAccess,
  createPawningProduct
); // Create a new product for a specific branch */

route.get(
  "/:branchId/:productId",
  protectedRoute,
  checkUserBranchAccess,
  getPawningProductById
); // Get a specific product by ID for a specific branch

route.get(
  "/:branchId",
  protectedRoute,
  checkUserBranchAccess,
  getPawningProducts
); // Get all products for a specific branch

route.delete(
  "/:branchId/:productId",
  protectedRoute,
  checkUserBranchAccess,
  deletePawningProductById
); // Delete a specific product by ID for a specific branch

route.patch(
  "/:branchId/:productId",
  protectedRoute,
  checkUserBranchAccess,
  updatePawningProductById
); // Update/Edit a specific product by ID for a specific branch

export default route;
