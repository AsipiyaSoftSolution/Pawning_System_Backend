import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import { getCashAndBankAccounts } from "../controllers/account.controller.js";

const route = express.Router();

// get cash and bank accounts
route.get(
  "/:branchId/cash-and-bank-accounts",
  protectedRoute,
  checkUserBranchAccess,
  getCashAndBankAccounts,
);
export default route;
