/**
 * Interest schedule helpers for pawning tickets.
 *
 * Product plan.Interest_Calculate_After is the number of days after ticket
 * create/grant before interest may start. 0 means interest starts on the
 * grant date itself.
 */

/** Parse a product-plan "Interest Calculate After" value into whole days. */
export const parseInterestCalculateAfterDays = (value) => {
  if (value === undefined || value === null || value === "") return 0;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 0) {
    return Math.floor(numeric);
  }
  // Legacy free-text values — treat unknown text as 0 (immediate).
  return 0;
};

/** Local calendar YYYY-MM-DD (not UTC via toISOString). */
export const toLocalDateStr = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

/**
 * Interest_apply_on = grant/create date + Interest_Calculate_After days.
 * When days is 0, this is the grant date — interest may run immediately.
 */
export const computeInterestApplyOnDate = (grantDate, interestCalculateAfter) => {
  const base = grantDate ? new Date(grantDate) : new Date();
  if (Number.isNaN(base.getTime())) {
    return toLocalDateStr(new Date());
  }
  base.setHours(0, 0, 0, 0);
  const days = parseInterestCalculateAfterDays(interestCalculateAfter);
  base.setDate(base.getDate() + days);
  return toLocalDateStr(base);
};
