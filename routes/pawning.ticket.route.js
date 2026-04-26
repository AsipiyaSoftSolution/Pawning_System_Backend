import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import { checkUserSelectedHeadBranch } from "../middlewares/headBranch.middleware.js";
import { checkCompanyTicketApprovalRanges } from "../middlewares/companyTicketApprovalRanges.js";
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

// Account Center letter templates — must be before /:branchId/* routes
router.get(
  "/letter-template/:ticketId",
  protectedRoute,
  getPawningTicketDataByIdAndFields,
);

router.post(
  "/:branchId/create",
  protectedRoute,
  checkUserBranchAccess,
  createPawningTicket,
);
// Get Grand SEQ.No for today
router.get(
  "/:branchId/grant-seq-no",
  protectedRoute,
  checkUserBranchAccess,
  getGrandSeqNo,
);
// Get products and their interest methods
router.get(
  "/:branchId/products-and-interest-method",
  protectedRoute,
  checkUserBranchAccess,
  getProductsAndInterestMethod,
);
// Get unique period types of a specific pawning product's product plans to frontend
router.get(
  "/:branchId/period-types-and-data/:productId",
  protectedRoute,
  checkUserBranchAccess,
  getProductPlanPeriods,
);

// Get max and min period of a specific pawning product's product plans to frontend
router.get(
  "/:branchId/max-min-period/:productId/:periodType",
  protectedRoute,
  checkUserBranchAccess,
  getMaxMinPeriod,
);
// Search customer by NIC and get their details
router.get(
  "/:branchId/search-customer/:nic",
  protectedRoute,
  checkUserBranchAccess,
  searchCustomerByNIC,
);

// Get caratage amount and selected product item data
router.get(
  "/:branchId/get-caratage-and-data",
  protectedRoute,
  checkUserBranchAccess,
  sendCaratageAmountForSelectedProductItem,
);

// Send assessed values to frontend based on caratage amount
router.get(
  "/:branchId/assessed-value",
  protectedRoute,
  checkUserBranchAccess,
  sendAssessedValues,
);

// Get ticket grant summary data
router.get(
  "/:branchId/grant-summary-data",
  protectedRoute,
  checkUserBranchAccess,
  getTicketGrantSummaryData,
);

router.get(
  "/:branchId/ticket/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  getTicketDataById,
); // Get ticket all data by ID

router.get(
  "/:branchId/ticket-comments/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  getTicketComments,
); // Get ticket comments by ticket ID

router.post(
  "/:branchId/ticket-comment",
  protectedRoute,
  checkUserBranchAccess,
  createTicketComment,
); // Create a new ticket comment

router.get(
  "/:branchId/tickets-for-approval",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  checkCompanyTicketApprovalRanges,
  getPawningTicketsForApproval,
); // Get pawning tickets for approval

router.patch(
  "/:branchId/ticket-status-to-approve-before-loan-disbursement/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  checkCompanyTicketApprovalRanges,
  approvePawningTicket,
); // Approve a pawning ticket status to -1 before loan disbursement

router.patch(
  "/:branchId/ticket-status-to-reject/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  rejectPawningTicket,
); // Reject a pawning ticket

router.get(
  "/:branchId/approved-tickets",
  protectedRoute,
  checkUserBranchAccess,
  getApprovedPawningTickets,
); // Get all approved pawning tickets

// Server-to-server endpoint called by Account Center Disbursement page
router.get(
  "/:branchId/disbursement-approved-tickets",
  protectedRoute,
  checkUserBranchAccess,
  getApprovedTicketsForDisbursement,
); // Get approved (-1) tickets for Account Center disbursement page

// Server-to-server deduct the pawning advance from the pawning ticket
router.post(
  "/deduct-pawning-advance",
  protectedRoute,
  deductAdvanceFromPawningTicket,
);
// Server-to-server mark ticket as active after disbursement
router.patch(
  "/mark-ticket-as-active",
  protectedRoute,
  updateTicketStatusAfterLoanDisbursement,
);

// here we disburse the loan to the customer and activate the ticket
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
  sendActiveTickets,
); // Get all active pawning tickets

router.get(
  "/:branchId/settled-tickets",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  sendSettledTickets,
); // Get all settled pawning tickets

router.get(
  "/:branchId/overdue-tickets",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  sendOverdueTickets,
); // Get all overdue pawning tickets

router.get(
  "/:branchId/tickets-for-printing",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  sendTicketsForPrinting,
); // Get all tickets for printing

router.patch(
  "/:branchId/mark-ticket-as-printed/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  markTicketAsPrinted,
); // Mark a ticket as printed (make Print_Status = '1')

router.get(
  "/:branchId/generate-ticket-number",
  protectedRoute,
  checkUserBranchAccess,
  generatePawningTicketNumber,
); // Generate pawning ticket number

router.get(
  "/:branchId/check-if-tickets-exist",
  protectedRoute,
  checkUserBranchAccess,
  checkIfTicketsExistInCompany,
); // Check if tickets exist in the company

router.get(
  "/company-branches-for-ticket-filters",
  protectedRoute,
  getCompanyBranchesForTicketFilters,
); // Get company branches for ticket page filters

router.get(
  "/:branchId/customer-ticket-history/:customerId",
  protectedRoute,
  checkUserBranchAccess,
  getCustomerTickets,
);

router.get("/all-tickets-for-company", protectedRoute, getAllTicketsForCompany); // Get all tickets for company
router.patch(
  "/batch-update-ticket-numbers",
  protectedRoute,
  batchUpdateTicketNumbers,
); // Batch update ticket numbers from Account Center

router.get(
  "/:branchId/find-ticket-by-search-input",
  protectedRoute,
  checkUserBranchAccess,
  findTicketBySearchInput,
); // Find ticket by search input

router.get(
  "/:branchId/pawning-ticket-print-available-page",
  protectedRoute,
  checkUserBranchAccess,
  getPawningTicketPrintAvailability,
); // Get pawning ticket print available page

router.get(
  "/:branchId/check-ticket-print-original-or-duplicate/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  checkTicketPrintOriginalOrDuplicate,
); // Check ticket print original or duplicate

export default router;
