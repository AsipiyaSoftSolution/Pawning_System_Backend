/**
 * Maps letter template suffixes (part after "Pawning_Ticket_") to pawning_ticket columns
 * or to ticket_articles / resolved labels from account_center.article_types & article_categories.
 */

/** @type {Record<string, string>} */
export const TICKET_SUFFIX_TO_COLUMN = {
  idPawning_Ticket: "idPawning_Ticket",
  No: "Ticket_No",
  SEQ_No: "SEQ_No",
  Date_Time: "Date_Time",
  Note: "Note",
  Period_Type: "Period_Type",
  Period: "Period",
  Maturity_date: "Maturity_date",
  Interest_Rate_Duration: "Interest_Rate_Duration",
  Interest_Rate: "Interest_Rate",
  Interest_apply_on: "Interest_apply_on",
  Service_Charge_Type: "Service_Charge_Type",
  Service_Charge_Rate: "Service_Charge_Rate",
  Late_charge_Precentage: "Late_charge_Precentage",
  Assessed_Value: "Assessed_Value",
  Payble_Value: "Payble_Value",
  Pawning_Advance_Amount: "Pawning_Advance_Amount",
  Service_charge_Amount: "Service_charge_Amount",
  Total_Amount: "Total_Amount",
  Service_Charge_Balance: "Service_Charge_Balance",
  Additiona_Charges_Balance: "Additiona_Charges_Balance",
  Early_Settlement_Charge_Balance: "Early_Settlement_Charge_Balance",
  Late_Charge_Balance: "Late_Charge_Balance",
  Interest_Amount_Balance: "Interest_Amount_Balance",
  Balance_Amount: "Balance_Amount",
  Status: "Status",
  User_idUser: "User_idUser",
  Branch_idBranch: "Branch_idBranch",
  created_at: "created_at",
  updated_at: "updated_at",
};

/** Suffixes read from the first ticket_articles row (by idTicket_Articles ASC) */
/** @type {Record<string, string>} */
export const ARTICLE_SUFFIX_TO_COLUMN = {
  Article_Condition: "Article_Condition",
  Article_Caratage: "Caratage",
  Gross_Weight: "Gross_Weight",
  Net_Weight: "Net_Weight",
  No_Of_Items: "No_Of_Items",
};

/** Resolved via account_center DB (not a direct column on the response row) */
export const ARTICLE_NAME_SUFFIX = "Article_Name";
export const ARTICLE_CATEGORY_SUFFIX = "Article_Category";

/** No matching column in pawning_ticket (template reserved) */
export const UNKNOWN_TICKET_SUFFIXES = new Set([
  "Interest_Rate_Type",
  "Late_charge_Type",
]);

const PREFIX = "Pawning_Ticket_";

/**
 * @param {string} token
 * @returns {string} suffix after Pawning_Ticket_, or the token if already a suffix
 */
export function normalizePawningTemplateFieldToken(token) {
  const t = String(token || "").trim();
  if (!t) return "";
  if (t.startsWith(PREFIX)) return t.slice(PREFIX.length);
  return t;
}

/**
 * @param {string} suffix
 * @returns {string} full template key
 */
export function fullTemplateKey(suffix) {
  return `${PREFIX}${suffix}`;
}
