import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import { createPawningTicket } from "../controllers/pawning.ticket.controller.js";
const router = express.Router();

router.post("/", protectedRoute, checkUserBranchAccess, createPawningTicket);
export default router;
