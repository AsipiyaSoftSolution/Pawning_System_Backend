import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  updateCardVisibilitySimple
} from "../controllers/cardVisibility.controller.js";

const router = express.Router();

// Simple update card visibility (new route)
router.put("/update", protectedRoute, updateCardVisibilitySimple);

export default router;
