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
  getCurrentReceiptBookWithCurrentVoucherNo,
  checkUserHasReceiptBook,
} from "../controllers/pawning.ticket.payment.controller.js";
import { checkUserSelectedHeadBranch } from "../middlewares/headBranch.middleware.js";
import { checkUserHasPrivileges } from "../middlewares/privilages.middleware.js";
import { PAWNING_PRIVILEGES as P } from "../constants/pawningPrivileges.js";

const route = express.Router();

route.get(
  "/:branchId/search",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  checkUserHasPrivileges([
    P.TICKET_PAYMENT,
    P.TICKET_SETTLEMENT,
    P.TICKET_RENEWAL,
    P.PAYMENTS_HISTORY_VIEW,
  ]),
  searchByTickerNumberCustomerNICOrName,
);

route.get(
  "/:branchId/ticket/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  checkUserHasPrivileges([
    P.TICKET_PAYMENT,
    P.TICKET_SETTLEMENT,
    P.TICKET_RENEWAL,
    P.TICKET_VIEW,
    P.PAYMENTS_HISTORY_VIEW,
  ]),
  getTicketDataById,
);

route.get(
  "/:branchId/ticket/:ticketId/logs",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_LOG_VIEW, P.TICKET_VIEW, P.TICKET_PAYMENT]),
  getTicketLogDataById,
);

route.get(
  "/:branchId/ticket/:ticketId/additional-charges",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_PAYMENT, P.TICKET_SETTLEMENT]),
  getTicketAdditionalChargesById,
);

route.post(
  "/:branchId/ticket/:ticketId/additional-charges",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_PAYMENT]),
  createTicketAdditionalCharge,
);

route.post(
  "/:branchId/ticket/:ticketId/part-payment",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_PAYMENT]),
  createPaymentForTicket,
);

route.post(
  "/:branchId/ticket/:ticketId/settlement-payment",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_SETTLEMENT]),
  createTicketSettlementPayment,
);

route.post(
  "/:branchId/ticket/:ticketId/renewal-payment",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_RENEWAL, P.TICKET_PAYMENT]),
  createTicketRenewalPayment,
);

route.patch(
  "/:branchId/ticket/:ticketId/note-update",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_PAYMENT, P.TICKET_VIEW]),
  updatePawningTicketNote,
);

route.get(
  "/:branchId/tickets-payments-history",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  checkUserHasPrivileges([
    P.PAYMENTS_HISTORY_VIEW,
    P.TICKET_PAYMENT_HISTORY_VIEW,
  ]),
  getTicketsPaymentsHistory,
);

route.patch(
  "/:branchId/ticket/:ticketId/renewal-request",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_RENEWAL, P.TICKET_PAYMENT]),
  reqAccessForTicketRenew,
);

route.get(
  "/:branchId/tickets-renewal-requests",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_RENEWAL, P.TICKET_APPROVE]),
  sendReqsOfTicketRenewalForApproval,
);

route.patch(
  "/:branchId/ticket/:ticketId/renewal-request-approval",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_RENEWAL, P.TICKET_APPROVE]),
  approveOrRejectReqForTicketRenewal,
);

route.get(
  "/:branchId/current-receipt-book-with-current-voucher-no",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([
    P.TICKET_PAYMENT,
    P.TICKET_SETTLEMENT,
    P.TICKET_RENEWAL,
  ]),
  getCurrentReceiptBookWithCurrentVoucherNo,
);

route.get(
  "/:branchId/check-user-has-receipt-book",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([
    P.TICKET_PAYMENT,
    P.TICKET_SETTLEMENT,
    P.TICKET_RENEWAL,
  ]),
  checkUserHasReceiptBook,
);

export default route;
