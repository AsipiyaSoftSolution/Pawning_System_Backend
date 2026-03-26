import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import { fullTicketDetailsReport } from "../controllers/report.controller.js";

const route = express.Router();

// Route to get Full Ticket Details Report
route.get(
  "/:branchId/full-ticket-details",
  protectedRoute,
  fullTicketDetailsReport,
);

export default route;
