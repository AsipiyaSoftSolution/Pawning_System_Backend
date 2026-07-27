import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import { checkUserSelectedHeadBranch } from "../middlewares/headBranch.middleware.js";
import { checkCompanyTicketApprovalRanges } from "../middlewares/companyTicketApprovalRanges.js";
import { checkUserHasPrivileges } from "../middlewares/privilages.middleware.js";
import { PAWNING_PRIVILEGES as P } from "../constants/pawningPrivileges.js";
import {
  createPawningTicket,
  getGrandSeqNo,
  getProductsAndInterestMethod,
  getProductPlanPeriods,
  searchCustomerByNIC,
  sendCaratageAmountForSelectedProductItem,
  getMaxMinPeriod,
  sendAssessedValues,
  getTicketGrantSummaryData,
  getTicketDataById,
  getTicketComments,
  createTicketComment,
  getPawningTicketsForApproval,
  approvePawningTicket,
  rejectPawningTicket,
  getApprovedPawningTickets,
  getApprovedTicketsForDisbursement,
  activatePawningTicket,
  sendActiveTickets,
  sendSettledTickets,
  sendTicketsForPrinting,
  markTicketAsPrinted,
  generatePawningTicketNumber,
  checkIfTicketsExistInCompany,
  getCompanyBranchesForTicketFilters,
  sendOverdueTickets,
  getCustomerTickets,
  deductAdvanceFromPawningTicket,
  updateTicketStatusAfterLoanDisbursement,
  getAllTicketsForCompany,
  batchUpdateTicketNumbers,
  findTicketBySearchInput,
  getPawningTicketDataByIdAndFields,
  getPawningTicketPrintAvailability,
  checkTicketPrintOriginalOrDuplicate,
} from "../controllers/pawning.ticket.controller.js";

const router = express.Router();

const canCreateTicket = checkUserHasPrivileges([P.TICKET_CREATE]);
const canViewTicket = checkUserHasPrivileges([
  P.TICKET_VIEW,
  P.TICKET_CREATE,
  P.TICKET_APPROVE,
  P.TICKET_PRINT,
]);
const canPrintTicket = checkUserHasPrivileges([
  P.TICKET_PRINT,
  P.TICKET_DUPLICATE_PRINT,
]);

// Account Center letter templates — must be before /:branchId/* routes
router.get(
  "/letter-template/:ticketId",
  protectedRoute,
  checkUserHasPrivileges([P.TICKET_VIEW, P.TICKET_PRINT, P.TICKET_DOWNLOAD]),
  getPawningTicketDataByIdAndFields,
);

router.post(
  "/:branchId/create",
  protectedRoute,
  checkUserBranchAccess,
  canCreateTicket,
  createPawningTicket,
);

router.get(
  "/:branchId/grant-seq-no",
  protectedRoute,
  checkUserBranchAccess,
  canCreateTicket,
  getGrandSeqNo,
);

router.get(
  "/:branchId/products-and-interest-method",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_CREATE, P.PRODUCT_VIEW]),
  getProductsAndInterestMethod,
);

router.get(
  "/:branchId/period-types-and-data/:productId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_CREATE, P.PRODUCT_VIEW]),
  getProductPlanPeriods,
);

router.get(
  "/:branchId/max-min-period/:productId/:periodType",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_CREATE, P.PRODUCT_VIEW]),
  getMaxMinPeriod,
);

router.get(
  "/:branchId/search-customer/:nic",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_CREATE, P.CUSTOMER_VIEW]),
  searchCustomerByNIC,
);

router.get(
  "/:branchId/get-caratage-and-data",
  protectedRoute,
  checkUserBranchAccess,
  canCreateTicket,
  sendCaratageAmountForSelectedProductItem,
);

router.get(
  "/:branchId/assessed-value",
  protectedRoute,
  checkUserBranchAccess,
  canCreateTicket,
  sendAssessedValues,
);

router.get(
  "/:branchId/grant-summary-data",
  protectedRoute,
  checkUserBranchAccess,
  canCreateTicket,
  getTicketGrantSummaryData,
);

router.get(
  "/:branchId/ticket/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  canViewTicket,
  getTicketDataById,
);

router.get(
  "/:branchId/ticket-comments/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_LOG_VIEW, P.TICKET_VIEW, P.TICKET_APPROVE]),
  getTicketComments,
);

router.post(
  "/:branchId/ticket-comment",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_VIEW, P.TICKET_APPROVE, P.TICKET_CREATE]),
  createTicketComment,
);

router.get(
  "/:branchId/tickets-for-approval",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  checkCompanyTicketApprovalRanges,
  checkUserHasPrivileges([P.TICKET_APPROVE, P.TICKET_REJECT]),
  getPawningTicketsForApproval,
);

router.patch(
  "/:branchId/ticket-status-to-approve-before-loan-disbursement/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  checkCompanyTicketApprovalRanges,
  checkUserHasPrivileges([P.TICKET_APPROVE]),
  approvePawningTicket,
);

router.patch(
  "/:branchId/ticket-status-to-reject/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_REJECT, P.TICKET_APPROVE]),
  rejectPawningTicket,
);

router.get(
  "/:branchId/approved-tickets",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_VIEW, P.TICKET_APPROVE]),
  getApprovedPawningTickets,
);

// Account Center Disbursement — no PAWNING TICKET DISBURSE privilege (AC owns disbursement)
router.get(
  "/:branchId/disbursement-approved-tickets",
  protectedRoute,
  checkUserBranchAccess,
  getApprovedTicketsForDisbursement,
);

router.post(
  "/deduct-pawning-advance",
  protectedRoute,
  deductAdvanceFromPawningTicket,
);

router.patch(
  "/mark-ticket-as-active",
  protectedRoute,
  updateTicketStatusAfterLoanDisbursement,
);

// Legacy pawning-side activate — keep auth+branch only (AC handles disbursement)
router.patch(
  "/:branchId/mark-ticket-as-active/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  activatePawningTicket,
);

router.get(
  "/:branchId/active-tickets",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  canViewTicket,
  sendActiveTickets,
);

router.get(
  "/:branchId/settled-tickets",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  canViewTicket,
  sendSettledTickets,
);

router.get(
  "/:branchId/overdue-tickets",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  canViewTicket,
  sendOverdueTickets,
);

router.get(
  "/:branchId/tickets-for-printing",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  canPrintTicket,
  sendTicketsForPrinting,
);

router.patch(
  "/:branchId/mark-ticket-as-printed/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  canPrintTicket,
  markTicketAsPrinted,
);

router.get(
  "/:branchId/generate-ticket-number",
  protectedRoute,
  checkUserBranchAccess,
  canCreateTicket,
  generatePawningTicketNumber,
);

router.get(
  "/:branchId/check-if-tickets-exist",
  protectedRoute,
  checkUserBranchAccess,
  canViewTicket,
  checkIfTicketsExistInCompany,
);

router.get(
  "/company-branches-for-ticket-filters",
  protectedRoute,
  canViewTicket,
  getCompanyBranchesForTicketFilters,
);

router.get(
  "/:branchId/customer-ticket-history/:customerId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_VIEW, P.CUSTOMER_VIEW]),
  getCustomerTickets,
);

router.get(
  "/all-tickets-for-company",
  protectedRoute,
  canViewTicket,
  getAllTicketsForCompany,
);

router.patch(
  "/batch-update-ticket-numbers",
  protectedRoute,
  batchUpdateTicketNumbers,
);

router.get(
  "/:branchId/find-ticket-by-search-input",
  protectedRoute,
  checkUserBranchAccess,
  canViewTicket,
  findTicketBySearchInput,
);

router.get(
  "/:branchId/pawning-ticket-print-available-page",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_PRINT, P.TICKET_VIEW, P.TICKET_CREATE]),
  getPawningTicketPrintAvailability,
);

router.get(
  "/:branchId/check-ticket-print-original-or-duplicate/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserHasPrivileges([P.TICKET_PRINT, P.TICKET_DUPLICATE_PRINT]),
  checkTicketPrintOriginalOrDuplicate,
);

export default router;
