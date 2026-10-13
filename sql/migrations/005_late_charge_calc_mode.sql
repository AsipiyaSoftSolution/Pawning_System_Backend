-- ---------------------------------------------------------------------------
-- 005_late_charge_calc_mode.sql
--
-- Lets each pawning product choose how its late-charge stages are calculated.
--
--   once_then_daily  stages 1..N-1 once, last stage daily until settlement
--                    (the behaviour every product had before this change)
--   step_up_monthly  stage rate = total owed on reaching it; only the increase
--                    is added; the schedule restarts each month after maturity
--
-- The product holds the setting. Each ticket copies it when it is created, the
-- same way tickets already copy the late-charge stage rates, so editing a
-- product never changes tickets that were already issued.
--
-- Every existing product and ticket receives 'once_then_daily', so nothing
-- changes until a product is switched on purpose (see PART 3).
--
-- RUN THIS BEFORE DEPLOYING THE NEW BACKEND. The new code reads and writes the
-- column, so the backend fails on product and ticket queries if it is missing.
--
-- Take a backup before running.
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- PART 0 — PREFLIGHT (read only)
-- ===========================================================================

-- Expect zero rows for both. A row means the column already exists and
-- PART 1 should be skipped.
SELECT TABLE_NAME, COLUMN_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME = 'Late_Charge_Calc_Mode'
  AND TABLE_NAME IN ('pawning_product', 'pawning_ticket');

-- Products that use more than one late-charge stage and are therefore
-- affected by the mode. Single-stage and flat products are always daily.
SELECT idPawning_Product, Branch_idBranch, Name, Late_Charge_Create_As,
       numberOfLateChargeStages
FROM pawning_product
WHERE Late_Charge_Status = '1'
ORDER BY Branch_idBranch, idPawning_Product;


-- ===========================================================================
-- PART 1 — COLUMNS
-- ===========================================================================

START TRANSACTION;

ALTER TABLE pawning_product
  ADD COLUMN Late_Charge_Calc_Mode VARCHAR(30) NOT NULL DEFAULT 'once_then_daily'
  AFTER numberOfLateChargeStages;

ALTER TABLE pawning_ticket
  ADD COLUMN Late_Charge_Calc_Mode VARCHAR(30) NOT NULL DEFAULT 'once_then_daily'
  AFTER numberOfLateChargeStages;

COMMIT;


-- ===========================================================================
-- PART 2 — VERIFY
-- ===========================================================================

-- Expect two rows, both NOT NULL with default once_then_daily.
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME = 'Late_Charge_Calc_Mode'
  AND TABLE_NAME IN ('pawning_product', 'pawning_ticket');

-- Expect every row to read once_then_daily.
SELECT Late_Charge_Calc_Mode, COUNT(*) AS products
FROM pawning_product
GROUP BY Late_Charge_Calc_Mode;


-- ===========================================================================
-- PART 3 — OPT IN A PRODUCT (optional, run per product)
--
-- Prefer the Late Charge Calculation Mode dropdown on the product screen for
-- new products. Use this only to switch existing products and the tickets that
-- are already open on them. Replace the id and mode, and run it deliberately.
--
-- Late-charge rows already written to ticket_log are not recalculated. Only
-- days that have not been accrued yet follow the new mode.
-- ===========================================================================

-- START TRANSACTION;
--
-- UPDATE pawning_product
--    SET Late_Charge_Calc_Mode = 'step_up_monthly'
--  WHERE idPawning_Product = 0;                          -- <- product id
--
-- UPDATE pawning_ticket
--    SET Late_Charge_Calc_Mode = 'step_up_monthly'
--  WHERE Pawning_Product_idPawning_Product = 0           -- <- product id
--    AND Status IN ('1', '3');                           -- open tickets only
--
-- COMMIT;
