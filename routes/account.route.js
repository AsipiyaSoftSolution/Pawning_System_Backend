import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import {
  createAccount,
  getAccountLogById,
  getAccountsForBranch,
  getAccountsForTransfer,
  transferBetweenAccounts,
} from "../controllers/account.controller.js";

const route = express.Router();

// Create a new account
route.post(
  "/:branchId/create-account",
  protectedRoute,
  checkUserBranchAccess,
  createAccount
);

// get account log by id
route.get(
  "/:branchId/account-log/:accountId",
  protectedRoute,
  checkUserBranchAccess,
  getAccountLogById
);

// get all accounts for a specific branch
route.get(
  "/:branchId/accounts",
  protectedRoute,
  checkUserBranchAccess,
  getAccountsForBranch
);

// get accounts data for transfer and other operations
route.get(
  "/:branchId/accounts-for-operations",
  protectedRoute,
  checkUserBranchAccess,
  getAccountsForTransfer
);

// transfer between accounts
route.post(
  "/:branchId/transfer-between-accounts",
  protectedRoute,
  checkUserBranchAccess,
  transferBetweenAccounts
);
export default route;
