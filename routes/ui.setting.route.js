import express from "express";
import { getCardSettings, saveCardSettings } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/card-settings", getCardSettings);
router.post("/card-settings", saveCardSettings);

export default router;
