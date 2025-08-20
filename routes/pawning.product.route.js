import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import { createPawningProduct } from "../controllers/pawning.product.controller.js";

const route = express.Router();

route.post(
  "/:branchId/create",
  protectedRoute,
  checkUserBranchAccess,
  createPawningProduct
); // Create a new product for a specific branch

export default route;
