/**
 * Human-readable action labels for Pawning mutating routes.
 * First matching pattern wins. `:param` segments are wildcards.
 */
const ACTION_PATTERNS = [
  // Auth
  { method: "POST", pattern: "/api/auth/login", action: "Logged in" },
  { method: "POST", pattern: "/api/auth/logout", action: "Logged out" },
  { method: "POST", pattern: "/api/auth/forget-password", action: "Requested password reset" },
  { method: "POST", pattern: "/api/auth/verify-mobile-otp-for-password-reset", action: "Verified password reset OTP" },
  { method: "POST", pattern: "/api/auth/reset-password/:token/:userId", action: "Reset password" },
  { method: "PATCH", pattern: "/api/auth/update-profile", action: "Updated profile" },
  { method: "PUT", pattern: "/api/auth/update-profile", action: "Updated profile" },

  // Customer
  { method: "POST", pattern: "/api/customer/:branchId/create", action: "Created a customer" },
  { method: "POST", pattern: "/api/customer/:branchId/link-existing", action: "Linked an existing customer" },
  { method: "POST", pattern: "/api/customer/:branchId/create-from-approval", action: "Created customer from approval" },
  { method: "POST", pattern: "/api/customer/:branchId/customer-updated-after-approval", action: "Updated customer after approval" },
  { method: "PATCH", pattern: "/api/customer/:branchId/customer/:id/edit", action: "Updated a customer" },
  { method: "DELETE", pattern: "/api/customer/:branchId/customer/:customerId/delete-documents/:documentId", action: "Deleted a customer document" },
  { method: "PATCH", pattern: "/api/customer/:branchId/blacklist-customer/:customerId", action: "Blacklisted a customer" },
  { method: "PATCH", pattern: "/api/customer/blacklist", action: "Updated customer blacklist status" },
  { method: "POST", pattern: "/api/customer/:branchId/link-customer", action: "Linked customer from Account Center" },
  { method: "PATCH", pattern: "/api/customer/batch-update-customer-numbers", action: "Batch updated customer numbers" },
  { method: "PATCH", pattern: "/api/customer/update-customer-number-format", action: "Updated customer number format" },
  { method: "POST", pattern: "/api/customer/:branchId/check-customer-nic", action: "Checked customer NIC" },

  // Products
  { method: "POST", pattern: "/api/pawning-product/:branchId/create", action: "Created a pawning product" },
  { method: "POST", pattern: "/api/pawning-product/:branchId/create-for-branches", action: "Created pawning products for branches" },
  { method: "PATCH", pattern: "/api/pawning-product/:branchId/:productId", action: "Updated a pawning product" },
  { method: "DELETE", pattern: "/api/pawning-product/:branchId/:productId", action: "Deleted a pawning product" },

  // Tickets
  { method: "POST", pattern: "/api/pawning-ticket/:branchId/create", action: "Created a pawning ticket" },
  { method: "PATCH", pattern: "/api/pawning-ticket/:branchId/ticket-status-to-approve-before-loan-disbursement/:ticketId", action: "Approved a pawning ticket" },
  { method: "PATCH", pattern: "/api/pawning-ticket/:branchId/ticket-status-to-reject/:ticketId", action: "Rejected a pawning ticket" },
  { method: "PATCH", pattern: "/api/pawning-ticket/:branchId/mark-ticket-as-active/:ticketId", action: "Activated a pawning ticket" },
  { method: "POST", pattern: "/api/pawning-ticket/:branchId/ticket-comment", action: "Added a ticket comment" },
  { method: "PATCH", pattern: "/api/pawning-ticket/:branchId/mark-ticket-as-printed/:ticketId", action: "Marked a ticket as printed" },
  { method: "POST", pattern: "/api/pawning-ticket/deduct-pawning-advance", action: "Deducted pawning advance" },
  { method: "PATCH", pattern: "/api/pawning-ticket/mark-ticket-as-active", action: "Marked ticket active after disbursement" },
  { method: "POST", pattern: "/api/pawning-ticket/batch-update-ticket-numbers", action: "Batch updated ticket numbers" },

  // Payments
  { method: "POST", pattern: "/api/pawning-ticket-payment/:branchId/ticket/:ticketId/part-payment", action: "Made a part payment" },
  { method: "POST", pattern: "/api/pawning-ticket-payment/:branchId/ticket/:ticketId/renewal-payment", action: "Made a renewal payment" },
  { method: "POST", pattern: "/api/pawning-ticket-payment/:branchId/ticket/:ticketId/settlement-payment", action: "Settled a pawning ticket" },
  { method: "POST", pattern: "/api/pawning-ticket-payment/:branchId/ticket/:ticketId/additional-charges", action: "Added an additional charge" },
  { method: "PATCH", pattern: "/api/pawning-ticket-payment/:branchId/ticket/:ticketId/note-update", action: "Updated ticket note" },
  { method: "PATCH", pattern: "/api/pawning-ticket-payment/:branchId/ticket/:ticketId/renewal-request", action: "Requested ticket renewal" },
  { method: "PATCH", pattern: "/api/pawning-ticket-payment/:branchId/ticket/:ticketId/renewal-request-approval", action: "Reviewed ticket renewal request" },

  // Company / settings
  { method: "PATCH", pattern: "/api/company/details", action: "Updated company details" },
  { method: "POST", pattern: "/api/company/designation", action: "Created a designation" },
  { method: "POST", pattern: "/api/company/assign-privileges", action: "Assigned privileges" },
  { method: "POST", pattern: "/api/company/article-type", action: "Created an article type" },
  { method: "PATCH", pattern: "/api/company/article-type/:id", action: "Updated an article type" },
  { method: "DELETE", pattern: "/api/company/article-type/:id", action: "Deleted an article type" },
  { method: "POST", pattern: "/api/company/article-category", action: "Created an article category" },
  { method: "PATCH", pattern: "/api/company/article-category/:id", action: "Updated an article category" },
  { method: "DELETE", pattern: "/api/company/article-category/:id", action: "Deleted an article category" },
  { method: "POST", pattern: "/api/company/user", action: "Created a user" },
  { method: "PATCH", pattern: "/api/company/user/:id", action: "Updated a user" },
  { method: "POST", pattern: "/api/company/branch", action: "Created a branch" },
  { method: "PATCH", pattern: "/api/company/branch/:id", action: "Updated a branch" },
  { method: "POST", pattern: "/api/company/assign-user-to-branch", action: "Assigned user to branch" },
  { method: "PATCH", pattern: "/api/company/pawning-ticket-number-format", action: "Updated ticket number format" },
  { method: "PATCH", pattern: "/api/company/customer-number-format", action: "Updated customer number format" },
  { method: "POST", pattern: "/api/company/article-condition", action: "Created an article condition" },
  { method: "PATCH", pattern: "/api/company/article-condition/:id", action: "Updated an article condition" },
  { method: "DELETE", pattern: "/api/company/article-condition/:id", action: "Deleted an article condition" },
  { method: "POST", pattern: "/api/company/sms-template", action: "Saved SMS template" },
  { method: "PATCH", pattern: "/api/company/sms-template/:id/status", action: "Updated SMS template status" },
  { method: "POST", pattern: "/api/company/assessed-values/bulk-update", action: "Updated assessed values" },
  { method: "POST", pattern: "/api/company/pawning-ticket-approval-range", action: "Created ticket approval range" },
  { method: "PATCH", pattern: "/api/company/pawning-ticket-approval-range/:id", action: "Updated ticket approval range" },
  { method: "DELETE", pattern: "/api/company/pawning-ticket-approval-range/:id", action: "Deleted ticket approval range" },
  { method: "PATCH", pattern: "/api/company/approve-ticket-after-creation", action: "Updated auto-approve ticket setting" },
  { method: "POST", pattern: "/api/company/letter-template", action: "Saved letter template" },

  // UI / dashboard settings (actual routes use POST + branchId + card_id)
  { method: "POST", pattern: "/api/ui-settings/:branchId/dashboard-card-visibility/:cardId", action: "Updated dashboard card visibility" },
  { method: "POST", pattern: "/api/ui-settings/:branchId/dashboard-card-colors/:cardId", action: "Updated dashboard card colors" },
  { method: "PATCH", pattern: "/api/ui-settings/dashboard-card-visibility", action: "Updated dashboard card visibility" },
  { method: "PATCH", pattern: "/api/ui-settings/dashboard-card-colors", action: "Updated dashboard card colors" },
];

/** Path-keyword → friendly phrase (used when no exact pattern matches). */
const PATH_PHRASE_HINTS = [
  { test: /dashboard-card-visibility/i, phrase: "Updated dashboard card visibility" },
  { test: /dashboard-card-colors/i, phrase: "Updated dashboard card colors" },
  { test: /dashboard-cards/i, phrase: "Viewed dashboard cards" },
  { test: /part-payment/i, phrase: "Made a part payment" },
  { test: /renewal-payment/i, phrase: "Made a renewal payment" },
  { test: /settlement-payment/i, phrase: "Settled a pawning ticket" },
  { test: /additional-charge/i, phrase: "Added an additional charge" },
  { test: /blacklist/i, phrase: "Updated customer blacklist" },
  { test: /assessed-value/i, phrase: "Updated assessed values" },
  { test: /letter-template/i, phrase: "Updated letter template" },
  { test: /sms-template/i, phrase: "Updated SMS template" },
  { test: /pawning-product/i, phrase: "Updated a pawning product" },
  { test: /pawning-ticket/i, phrase: "Updated a pawning ticket" },
  { test: /customer/i, phrase: "Updated customer information" },
  { test: /ui-settings/i, phrase: "Updated dashboard settings" },
];

const METHOD_VERB = {
  POST: "Created / submitted",
  PUT: "Updated",
  PATCH: "Updated",
  DELETE: "Deleted",
};

const SKIP_PATH_PREFIXES = ["/api/health", "/api/activity-logs"];

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

function humanizePathSegment(segment) {
  return String(segment || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * Build a plain-language fallback from method + path.
 * Strips numeric IDs and HTTP jargon so staff can read the log.
 */
export function friendlyActionFromPath(method, path) {
  const raw = String(path || "").split("?")[0];
  for (const hint of PATH_PHRASE_HINTS) {
    if (hint.test.test(raw)) return hint.phrase;
  }

  const parts = raw
    .replace(/^\/api\//i, "")
    .split("/")
    .filter(Boolean)
    // Drop pure numeric / UUID-like path params (branch ids, card ids, etc.)
    .filter((p) => !/^\d+$/.test(p) && !/^[0-9a-f-]{8,}$/i.test(p));

  const area = parts.length
    ? parts.map(humanizePathSegment).join(" → ")
    : "system record";

  const verb = METHOD_VERB[String(method || "").toUpperCase()] || "Updated";
  return `${verb} ${area}`.replace(/\s+/g, " ").trim();
}

/**
 * Normalize an already-stored action for display (covers older technical logs).
 */
export function formatActivityActionForDisplay(action) {
  const text = String(action || "").trim();
  if (!text) return "Activity";

  // Already friendly (no HTTP verb prefix)
  if (!/^(GET|POST|PUT|PATCH|DELETE)\b/i.test(text)) {
    return text;
  }

  const match = text.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(.+)$/i);
  if (!match) return text;

  const method = match[1].toUpperCase();
  let path = match[2].trim();
  if (!path.startsWith("/")) path = `/api/${path.replace(/^\/+/, "")}`;
  if (!path.startsWith("/api/")) path = `/api/${path.replace(/^\/+/, "")}`;

  return friendlyActionFromPath(method, path);
}

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

  return friendlyActionFromPath(method, path);
}
