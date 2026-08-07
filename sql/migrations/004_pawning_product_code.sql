-- ---------------------------------------------------------------------------
-- 004_pawning_product_code.sql
--
-- Adds a product code to pawning products and makes it the source of the
-- "Product Code" segment of the generated ticket number.
--
-- Before this change the generator padded idPawning_Product to three digits,
-- so a ticket for product 8 carried "008". The backfill below writes exactly
-- that value into the new column, which means every existing product keeps
-- producing the ticket numbers it produced yesterday. Codes only diverge from
-- the id once someone edits a product and types a real one.
--
-- Take a backup before running.
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- PART 0 — PREFLIGHT (read only)
-- ===========================================================================

-- Products that will be backfilled, and the code each one will receive.
SELECT idPawning_Product, Branch_idBranch, Name,
       LPAD(idPawning_Product, 3, '0') AS backfilled_code
FROM pawning_product
ORDER BY Branch_idBranch, idPawning_Product;


-- ===========================================================================
-- PART 1 — COLUMN, BACKFILL AND UNIQUE KEY
-- ===========================================================================

START TRANSACTION;

ALTER TABLE pawning_product
  ADD COLUMN Product_Code VARCHAR(10) DEFAULT NULL AFTER Name;

-- Reproduce the old generator output so live ticket numbers do not shift.
UPDATE pawning_product
   SET Product_Code = LPAD(idPawning_Product, 3, '0')
 WHERE Product_Code IS NULL OR Product_Code = '';

-- One code per branch, mirroring uq_pawning_product_branch_name. Left
-- nullable so a product created by an older build still inserts; the
-- application requires a code on every create and update.
ALTER TABLE pawning_product
  ADD UNIQUE KEY uq_pawning_product_branch_code (Branch_idBranch, Product_Code);

COMMIT;


-- ===========================================================================
-- PART 2 — VERIFY
-- ===========================================================================

-- Expect zero rows: every product should now carry a code.
SELECT idPawning_Product, Branch_idBranch, Name
FROM pawning_product
WHERE Product_Code IS NULL OR Product_Code = '';
