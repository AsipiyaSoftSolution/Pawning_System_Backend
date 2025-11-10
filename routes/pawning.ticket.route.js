import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
import { checkUserSelectedHeadBranch } from "../middlewares/headBranch.middleware.js";
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
  activatePawningTicket,
  sendActiveTickets,
  sendSettledTickets,
  sendTicketsForPrinting,
  markTicketAsPrinted,
  generatePawningTicketNumber,
  checkIfTicketsExistInCompany,
  getCompanyBranchesForTicketFilters,
} from "../controllers/pawning.ticket.controller.js";
const router = express.Router();

router.post(
  "/:branchId/create",
  protectedRoute,
  checkUserBranchAccess,
  createPawningTicket
);
// Get Grand SEQ.No for today
router.get(
  "/:branchId/grant-seq-no",
  protectedRoute,
  checkUserBranchAccess,
  getGrandSeqNo
);
// Get products and their interest methods
router.get(
  "/:branchId/products-and-interest-method",
  protectedRoute,
  checkUserBranchAccess,
  getProductsAndInterestMethod
);
// Get unique period types of a specific pawning product's product plans to frontend
router.get(
  "/:branchId/period-types-and-data/:productId",
  protectedRoute,
  checkUserBranchAccess,
  getProductPlanPeriods
);

// Get max and min period of a specific pawning product's product plans to frontend
router.get(
  "/:branchId/max-min-period/:productId/:periodType",
  protectedRoute,
  checkUserBranchAccess,
  getMaxMinPeriod
);
// Search customer by NIC and get their details
router.get(
  "/:branchId/search-customer/:nic",
  protectedRoute,
  checkUserBranchAccess,
  searchCustomerByNIC
);

// Get caratage amount and selected product item data
router.get(
  "/:branchId/get-caratage-and-data",
  protectedRoute,
  checkUserBranchAccess,
  sendCaratageAmountForSelectedProductItem
);

// Send assessed values to frontend based on caratage amount
router.get(
  "/:branchId/assessed-value",
  protectedRoute,
  checkUserBranchAccess,
  sendAssessedValues
);

// Get ticket grant summary data
router.get(
  "/:branchId/grant-summary-data",
  protectedRoute,
  checkUserBranchAccess,
  getTicketGrantSummaryData
);

router.get(
  "/:branchId/ticket/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  getTicketDataById
); // Get ticket all data by ID

router.get(
  "/:branchId/ticket-comments/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  getTicketComments
); // Get ticket comments by ticket ID

router.post(
  "/:branchId/ticket-comment",
  protectedRoute,
  checkUserBranchAccess,
  createTicketComment
); // Create a new ticket comment

router.get(
  "/:branchId/tickets-for-approval",
  protectedRoute,
  checkUserBranchAccess,
  checkUserSelectedHeadBranch,
  getPawningTicketsForApproval
); // Get pawning tickets for approval

router.patch(
  "/:branchId/ticket-status-to-approve-before-loan-disbursement/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  approvePawningTicket
); // Approve a pawning ticket status to -1 before loan disbursement

router.patch(
  "/:branchId/ticket-status-to-reject/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  rejectPawningTicket
); // Reject a pawning ticket

router.get(
  "/:branchId/approved-tickets",
  protectedRoute,
  checkUserBranchAccess,
  getApprovedPawningTickets
); // Get all approved pawning tickets

router.patch(
  "/:branchId/mark-ticket-as-active/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  activatePawningTicket
); // Activate a pawning ticket

router.get(
  "/:branchId/active-tickets",
  protectedRoute,
  checkUserBranchAccess,
  sendActiveTickets
); // Get all active pawning tickets

router.get(
  "/:branchId/settled-tickets",
  protectedRoute,
  checkUserBranchAccess,
  sendSettledTickets
); // Get all overdue pawning tickets

router.get(
  "/:branchId/tickets-for-printing",
  protectedRoute,
  checkUserBranchAccess,
  sendTicketsForPrinting
); // Get all tickets for printing

router.patch(
  "/:branchId/mark-ticket-as-printed/:ticketId",
  protectedRoute,
  checkUserBranchAccess,
  markTicketAsPrinted
); // Mark a ticket as printed (make Print_Status = '1')

router.get(
  "/:branchId/generate-ticket-number",
  protectedRoute,
  checkUserBranchAccess,
  generatePawningTicketNumber
); // Generate pawning ticket number

router.get(
  "/:branchId/check-if-tickets-exist",
  protectedRoute,
  checkUserBranchAccess,
  checkIfTicketsExistInCompany
); // Check if tickets exist in the company

router.get(
  "/company-branches-for-ticket-filters",
  protectedRoute,
  getCompanyBranchesForTicketFilters
); // Get company branches for ticket page filters
export default router;
