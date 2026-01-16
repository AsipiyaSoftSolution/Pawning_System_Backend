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
  updatePawningTicketNote,
  createTicketSettlementPayment,
  getTicketsPaymentsHistory,
  reqAccessForTicketRenew,
  sendReqsOfTicketRenewalForApproval,
  approveOrRejectReqForTicketRenewal,
} from "../controllers/pawning.ticket.payment.controller.js";

const route = express.Router();

route.get(
  "/:branchId/search",
  protectedRoute,
  checkUserBranchAccess,
  searchByTickerNumberCustomerNICOrName,
); // Search by ticket number, customer NIC, or name

route.get(
  "/:branchId/ticket/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  getTicketDataById,
); // Get ticket data by ID

route.get(
  "/:branchId/ticket/:ticketId/logs",
  protectedRoute,
  checkUserBranchAccess,
  getTicketLogDataById,
); // Get ticket log data by ID

route.get(
  "/:branchId/ticket/:ticketId/additional-charges",
  protectedRoute,
  checkUserBranchAccess,
  getTicketAdditionalChargesById,
); // Get ticket additional charges by ID

route.post(
  "/:branchId/ticket/:ticketId/additional-charges",
  protectedRoute,
  checkUserBranchAccess,
  createTicketAdditionalCharge,
); // Create ticket additional charge

route.post(
  "/:branchId/ticket/:ticketId/part-payment",
  protectedRoute,
  checkUserBranchAccess,
  createPaymentForTicket,
); // Create payment for ticket  (Part Payment)

route.post(
  "/:branchId/ticket/:ticketId/settlement-payment",
  protectedRoute,
  checkUserBranchAccess,
  createTicketSettlementPayment,
); // Create settlement payment for ticket

route.post(
  "/:branchId/ticket/:ticketId/renewal-payment",
  protectedRoute,
  checkUserBranchAccess,
  createTicketRenewalPayment,
); // Create renewal payment for ticket

route.patch(
  "/:branchId/ticket/:ticketId/note-update",
  protectedRoute,
  checkUserBranchAccess,
  updatePawningTicketNote,
); // Update ticket note

// get all tickets payment histories data for the branch
route.get(
  "/:branchId/tickets-payments-history",
  protectedRoute,
  checkUserBranchAccess,
  getTicketsPaymentsHistory,
);

// req access for pawning ticket renewal
route.patch(
  "/:branchId/ticket/:ticketId/renewal-request",
  protectedRoute,
  checkUserBranchAccess,
  reqAccessForTicketRenew,
); // Request access for ticket renewal

// send req of ticket renewal for approval
route.get(
  "/:branchId/tickets-renewal-requests",
  protectedRoute,
  checkUserBranchAccess,
  sendReqsOfTicketRenewalForApproval,
); // Send req of ticket renewal for approval

// approve or reject req for ticket renewal
route.patch(
  "/:branchId/ticket/:ticketId/renewal-request-approval",
  protectedRoute,
  checkUserBranchAccess,
  approveOrRejectReqForTicketRenewal,
); // Approve or reject req for ticket renewal

export default route;
