import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import {
  fullTicketDetailsReport,
  articlesInHandReport,
} from "../controllers/report.controller.js";

const route = express.Router();

// Route to get Full Ticket Details Report
route.get(
  "/:branchId/full-ticket-details",
  protectedRoute,
  fullTicketDetailsReport,
);

// Route to get Articles In Hand Report
route.get("/:branchId/articles-in-hand", protectedRoute, articlesInHandReport);

export default route;
