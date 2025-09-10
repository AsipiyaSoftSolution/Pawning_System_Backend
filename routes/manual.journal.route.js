import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { 
  createManualJournal, 
  getAllManualJournals, 
  getManualJournalById,
  getChartAccountsForDropdown
} from "../controllers/manual.journal.controller.js";

const router = express.Router();

// Create a new manual journal entry
router.post("/create", protectedRoute, createManualJournal);

// Get all manual journal entries
router.get("/all", protectedRoute, getAllManualJournals);

// Get manual journal entry by ID
router.get("/get/:id", protectedRoute, getManualJournalById);

// Get chart of accounts for dropdown
router.get("/chart-accounts", protectedRoute, getChartAccountsForDropdown);

export default router;