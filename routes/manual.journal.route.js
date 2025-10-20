import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  createManualJournal,
  getAllManualJournals,
  getManualJournalById,
  getChartAccountsForDropdown,
} from "../controllers/manual.journal.controller.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";

const router = express.Router();

// Create a new manual journal entry
router.post(
  "/create/:branchId",
  protectedRoute,
  checkUserBranchAccess,
  createManualJournal
);

// Get all manual journal entries
router.get(
  "/all/:branchId",
  protectedRoute,
  checkUserBranchAccess,
  getAllManualJournals
);

// Get manual journal entry by ID
router.get(
  "/get/:branchId/:id",
  protectedRoute,
  checkUserBranchAccess,
  getManualJournalById
);

// Get chart of accounts for dropdown
router.get(
  "/chart-accounts/:branchId",
  protectedRoute,
  checkUserBranchAccess,
  getChartAccountsForDropdown
);

export default router;
