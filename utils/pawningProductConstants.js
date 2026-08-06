/**
 * Shared vocabulary for pawning product configuration.
 *
 * These values are persisted as free-text columns, so historical rows contain
 * several spellings of the same concept (e.g. the stage interest method was
 * saved with a trailing space, and the "runs until the ticket is settled"
 * sentinel exists as both "Until Settlement" and "To maturity date").
 * Always compare through the helpers below instead of using `===`.
 */

export const INTEREST_METHOD_PERIOD = "Interest For Period";
export const INTEREST_METHOD_AMOUNT = "Interest For Pawning Amount";

export const INTEREST_METHODS = [
  INTEREST_METHOD_PERIOD,
  INTEREST_METHOD_AMOUNT,
];

/** Value written to product_plan.interestApplicableMethod for staged interest. */
export const STAGE_INTEREST_METHOD = "calculate for stages ";
export const DEFAULT_INTEREST_METHOD = "default";

export const LATE_CHARGE_FOR_PRODUCT = "Charge For Product";
export const LATE_CHARGE_FOR_PRODUCT_ITEM = "Charge For Product Item";
export const CHARGE_INACTIVE = "inactive";

/** Canonical sentinel meaning "this stage runs until the ticket is settled". */
export const UNTIL_SETTLEMENT = "Until Settlement";
const UNTIL_SETTLEMENT_ALIASES = [
  "until settlement",
  "to maturity date",
  "to maturity",
];

const normalize = (value) =>
  value === undefined || value === null
    ? ""
    : String(value).trim().toLowerCase();

export const isStageInterestMethod = (value) =>
  normalize(value) === normalize(STAGE_INTEREST_METHOD);

export const isUntilSettlement = (value) =>
  UNTIL_SETTLEMENT_ALIASES.includes(normalize(value));

export const isValidInterestMethod = (value) =>
  INTEREST_METHODS.some((method) => normalize(method) === normalize(value));

/**
 * Normalise a stage end boundary for storage: the sentinel collapses to its
 * canonical form, everything else becomes an integer day offset or null.
 */
export const normalizeStageEnd = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (isUntilSettlement(value)) return UNTIL_SETTLEMENT;
  const parsed = parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
};
