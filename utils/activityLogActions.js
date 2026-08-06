/**
 * Human-readable action labels for common Pawning mutating routes.
 * First matching pattern wins. `:param` segments are wildcards.
 */
const ACTION_PATTERNS = [
  // Auth
  { method: "POST", pattern: "/api/auth/login", action: "Log In" },
  { method: "POST", pattern: "/api/auth/logout", action: "Log Out" },
  { method: "POST", pattern: "/api/auth/forget-password", action: "Forget Password Request" },
  { method: "POST", pattern: "/api/auth/verify-mobile-otp", action: "Verify Password Reset OTP" },
  { method: "POST", pattern: "/api/auth/reset-password", action: "Reset Password" },
  { method: "PATCH", pattern: "/api/auth/update-profile", action: "Update Profile" },
  { method: "PUT", pattern: "/api/auth/update-profile", action: "Update Profile" },

  // Customer
  { method: "POST", pattern: "/api/customer/:branchId/create", action: "Create Customer" },
  { method: "POST", pattern: "/api/customer/:branchId/link-existing", action: "Link Existing Customer" },
  { method: "POST", pattern: "/api/customer/:branchId/create-from-approval", action: "Create Customer From Approval" },
  { method: "POST", pattern: "/api/customer/:branchId/customer-updated-after-approval", action: "Customer Updated After Approval" },
  { method: "PATCH", pattern: "/api/customer/:branchId/customer/:id/edit", action: "Update Customer" },
  { method: "DELETE", pattern: "/api/customer/:branchId/customer/:customerId/delete-documents/:documentId", action: "Delete Customer Documents" },
  { method: "PATCH", pattern: "/api/customer/:branchId/blacklist-customer/:customerId", action: "Blacklist Customer" },
  { method: "PATCH", pattern: "/api/customer/blacklist", action: "Blacklist Customer Callback" },
  { method: "POST", pattern: "/api/customer/:branchId/link-customer", action: "Link Customer Callback" },
  { method: "PATCH", pattern: "/api/customer/batch-update-customer-numbers", action: "Batch Update Customer Numbers" },
  { method: "PATCH", pattern: "/api/customer/update-customer-number-format", action: "Update Customer Number Format" },
  { method: "POST", pattern: "/api/customer/:branchId/check-customer-nic", action: "Check Customer NIC" },

  // Products
  { method: "POST", pattern: "/api/pawning-product/:branchId/create", action: "Create Pawning Product" },
  { method: "POST", pattern: "/api/pawning-product/:branchId/create-for-branches", action: "Create Pawning Product For Branches" },
  { method: "PATCH", pattern: "/api/pawning-product/:branchId/:productId", action: "Update Pawning Product" },
  { method: "DELETE", pattern: "/api/pawning-product/:branchId/:productId", action: "Delete Pawning Product" },

  // Tickets
  { method: "POST", pattern: "/api/pawning-ticket/:branchId/create", action: "Create Pawning Ticket" },
  { method: "PATCH", pattern: "/api/pawning-ticket/:branchId/ticket-status-to-approve-before-loan-disbursement/:ticketId", action: "Approve Pawning Ticket" },
  { method: "PATCH", pattern: "/api/pawning-ticket/:branchId/ticket-status-to-reject/:ticketId", action: "Reject Pawning Ticket" },
  { method: "PATCH", pattern: "/api/pawning-ticket/:branchId/mark-ticket-as-active/:ticketId", action: "Activate Pawning Ticket" },
  { method: "POST", pattern: "/api/pawning-ticket/:branchId/ticket-comment", action: "Create Ticket Comment" },
  { method: "PATCH", pattern: "/api/pawning-ticket/:branchId/mark-ticket-as-printed/:ticketId", action: "Mark Ticket As Printed" },
  { method: "POST", pattern: "/api/pawning-ticket/deduct-pawning-advance", action: "Deduct Pawning Advance" },
  { method: "PATCH", pattern: "/api/pawning-ticket/mark-ticket-as-active", action: "Mark Ticket Active After Disbursement" },
  { method: "POST", pattern: "/api/pawning-ticket/batch-update-ticket-numbers", action: "Batch Update Ticket Numbers" },

  // Payments
  { method: "POST", pattern: "/api/pawning-ticket-payment/:branchId/ticket/:ticketId/part-payment", action: "Create Ticket Payment" },
  { method: "POST", pattern: "/api/pawning-ticket-payment/:branchId/ticket/:ticketId/renewal-payment", action: "Create Ticket Renewal Payment" },
  { method: "POST", pattern: "/api/pawning-ticket-payment/:branchId/ticket/:ticketId/settlement-payment", action: "Create Ticket Settlement Payment" },
  { method: "POST", pattern: "/api/pawning-ticket-payment/:branchId/ticket/:ticketId/additional-charges", action: "Create Ticket Additional Charge" },
  { method: "PATCH", pattern: "/api/pawning-ticket-payment/:branchId/ticket/:ticketId/note-update", action: "Update Ticket Note" },
  { method: "PATCH", pattern: "/api/pawning-ticket-payment/:branchId/ticket/:ticketId/renewal-request", action: "Request Ticket Renewal Access" },
  { method: "PATCH", pattern: "/api/pawning-ticket-payment/:branchId/ticket/:ticketId/renewal-request-approval", action: "Approve Or Reject Ticket Renewal Request" },

  // Company / settings
  { method: "PATCH", pattern: "/api/company/details", action: "Update Company Details" },
  { method: "POST", pattern: "/api/company/designation", action: "Create Designation" },
  { method: "POST", pattern: "/api/company/assign-privileges", action: "Assign Privileges" },
  { method: "POST", pattern: "/api/company/article-type", action: "Create Article Type" },
  { method: "PATCH", pattern: "/api/company/article-type/:id", action: "Update Article Type" },
  { method: "DELETE", pattern: "/api/company/article-type/:id", action: "Delete Article Type" },
  { method: "POST", pattern: "/api/company/article-category", action: "Create Article Category" },
  { method: "PATCH", pattern: "/api/company/article-category/:id", action: "Update Article Category" },
  { method: "DELETE", pattern: "/api/company/article-category/:id", action: "Delete Article Category" },
  { method: "POST", pattern: "/api/company/user", action: "Create User" },
  { method: "PATCH", pattern: "/api/company/user/:id", action: "Update User" },
  { method: "POST", pattern: "/api/company/branch", action: "Create Branch" },
  { method: "PATCH", pattern: "/api/company/branch/:id", action: "Update Branch" },
  { method: "POST", pattern: "/api/company/assign-user-to-branch", action: "Assign User To Branch" },
  { method: "PATCH", pattern: "/api/company/pawning-ticket-number-format", action: "Update Ticket Number Format" },
  { method: "PATCH", pattern: "/api/company/customer-number-format", action: "Update Customer Number Format" },
  { method: "POST", pattern: "/api/company/article-condition", action: "Create Article Condition" },
  { method: "PATCH", pattern: "/api/company/article-condition/:id", action: "Update Article Condition" },
  { method: "DELETE", pattern: "/api/company/article-condition/:id", action: "Delete Article Condition" },
  { method: "POST", pattern: "/api/company/sms-template", action: "Save SMS Template" },
  { method: "PATCH", pattern: "/api/company/sms-template/:id/status", action: "Update SMS Template Status" },
  { method: "POST", pattern: "/api/company/assessed-values/bulk-update", action: "Bulk Update Assessed Values" },
  { method: "POST", pattern: "/api/company/pawning-ticket-approval-range", action: "Create Ticket Approval Range" },
  { method: "PATCH", pattern: "/api/company/pawning-ticket-approval-range/:id", action: "Update Ticket Approval Range" },
  { method: "DELETE", pattern: "/api/company/pawning-ticket-approval-range/:id", action: "Delete Ticket Approval Range" },
  { method: "PATCH", pattern: "/api/company/approve-ticket-after-creation", action: "Update Auto-Approve Ticket Setting" },
  { method: "POST", pattern: "/api/company/letter-template", action: "Save Letter Template" },

  // UI settings
  { method: "PATCH", pattern: "/api/ui-settings/dashboard-card-visibility", action: "Update Dashboard Card Visibility" },
  { method: "PATCH", pattern: "/api/ui-settings/dashboard-card-colors", action: "Update Dashboard Card Colors" },
];

const SKIP_PATH_PREFIXES = [
  "/api/health",
  "/api/activity-logs",
];

function pathToRegex(pattern) {
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/:([A-Za-z0-9_]+)/g, "[^/]+");
  return new RegExp(`^${escaped}/?$`, "i");
}

const COMPILED = ACTION_PATTERNS.map((entry) => ({
  ...entry,
  regex: pathToRegex(entry.pattern),
}));

export function shouldSkipActivityLog(req) {
  if (req.skipActivityLog) return true;
  const path = (req.originalUrl || req.url || "").split("?")[0];
  return SKIP_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function resolveActivityAction(req) {
  if (req.activityLogAction) return String(req.activityLogAction);

  const method = String(req.method || "").toUpperCase();
  const path = (req.originalUrl || req.url || "").split("?")[0];

  for (const entry of COMPILED) {
    if (entry.method === method && entry.regex.test(path)) {
      return entry.action;
    }
  }

  // Fallback: readable method + short path
  const shortPath = path.replace(/^\/api\//, "").replace(/\/+$/, "");
  return `${method} ${shortPath || path}`;
}
