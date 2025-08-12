import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  getUserCardStyles,
  updateCardStyle,
  resetUserCardStyles
} from "../controllers/cardStyle.controller.js";

const route = express.Router();

// Get all card styles for a user
route.get("/:userId", protectedRoute, getUserCardStyles);

// Update a card style
route.put("/:userId/:cardId", protectedRoute, updateCardStyle);

// Reset all card styles for a user
route.delete("/:userId", protectedRoute, resetUserCardStyles);

export default route;