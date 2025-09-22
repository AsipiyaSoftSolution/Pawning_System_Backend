import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import {
  searchByTickerNumberCustomerNICOrName,
  getTicketDataById,
  getTicketLogDataById,
  getTicketAdditionalChargesById,
  createTicketAdditionalCharge,
  createPaymentForTicket,
  createTicketRenewalPayment,
} from "../controllers/pawning.ticket.payment.controller.js";

const route = express.Router();

route.get(
  "/:branchId/search",
  protectedRoute,
  checkUserBranchAccess,
  searchByTickerNumberCustomerNICOrName
); // Search by ticket number, customer NIC, or name

route.get(
  "/:branchId/ticket/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  getTicketDataById
); // Get ticket data by ID

route.get(
  "/:branchId/ticket/:ticketId/logs",
  protectedRoute,
  checkUserBranchAccess,
  getTicketLogDataById
); // Get ticket log data by ID

route.get(
  "/:branchId/ticket/:ticketId/additional-charges",
  protectedRoute,
  checkUserBranchAccess,
  getTicketAdditionalChargesById
); // Get ticket additional charges by ID

route.post(
  "/:branchId/ticket/:ticketId/additional-charges",
  protectedRoute,
  checkUserBranchAccess,
  createTicketAdditionalCharge
); // Create ticket additional charge

route.post(
  "/:branchId/ticket/:ticketId/part-payment",
  protectedRoute,
  checkUserBranchAccess,
  createPaymentForTicket
); // Create payment for ticket

route.post(
  "/:branchId/ticket/:ticketId/renewal-payment",
  protectedRoute,
  checkUserBranchAccess,
  createTicketRenewalPayment
); // Create renewal payment for ticket

export default route;
