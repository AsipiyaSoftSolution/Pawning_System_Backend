import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  getCardVisibility,
  updateCardVisibility,
  updateMultipleCardVisibility,
  resetCardVisibility,
  initializeCardVisibility,
  getCardVisibilityStats,
  getCardVisibilityByBranch
} from "../controllers/cardVisibility.controller.js";

const router = express.Router();

// Get all card visibility settings for a user
router.get("/:userId", protectedRoute, getCardVisibility);

// Get card visibility by branch
router.get("/:userId/branch/:branchId", protectedRoute, getCardVisibilityByBranch);

// Update single card visibility
router.put("/:userId/card", protectedRoute, updateCardVisibility);

// Update multiple cards visibility (for toggle all functionality)
router.put("/:userId/bulk", protectedRoute, updateMultipleCardVisibility);

// Reset card visibility to defaults
router.put("/:userId/reset", protectedRoute, resetCardVisibility);

// Initialize default card visibility for a new user
router.post("/:userId/initialize", protectedRoute, initializeCardVisibility);

// Get card visibility statistics
router.get("/:userId/stats", protectedRoute, getCardVisibilityStats);

export default router;
