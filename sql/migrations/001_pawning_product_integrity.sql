-- ---------------------------------------------------------------------------
-- 001_pawning_product_integrity.sql
--
-- Pawning product data integrity:
--   Part 1  referential integrity + indexes (safe, run first)
--   Part 2  numeric column types (run after reviewing the preflight output)
--
-- Take a backup before running. Part 2 rewrites the two largest configuration
-- tables, so run it during a maintenance window.
--
-- Columns intentionally left as VARCHAR:
--   *EndDate / *_end_day  — hold the sentinels 'Until Settlement' and
--                           'to maturity date' alongside day offsets.
--   Service_Charge_Value, Early_Settlement_Charge_Value
--                         — hold the markers 'N/A' and 'inactive'.
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- PART 0 — PREFLIGHT (read only)
-- ===========================================================================

-- Duplicate product names within a branch. Part 1 adds a unique key, so these
-- must be renamed or removed first; the ALTER will fail while they exist.
SELECT Branch_idBranch, Name, COUNT(*) AS duplicates
FROM pawning_product
WHERE Name IS NOT NULL
GROUP BY Branch_idBranch, Name
HAVING COUNT(*) > 1;

-- Product plans pointing at a product that no longer exists. Part 1 adds a
-- foreign key, so these orphans must be deleted first.
SELECT pp.idProduct_Plan, pp.Pawning_Product_idPawning_Product
FROM product_plan pp
LEFT JOIN pawning_product p
  ON p.idPawning_Product = pp.Pawning_Product_idPawning_Product
WHERE p.idPawning_Product IS NULL;

SELECT esc.idEarly_Settlement_Charges, esc.Pawning_Product_idPawning_Product
FROM early_settlement_charges esc
LEFT JOIN pawning_product p
  ON p.idPawning_Product = esc.Pawning_Product_idPawning_Product
WHERE p.idPawning_Product IS NULL;

-- Values that are not numeric in columns Part 2 converts. Anything listed here
-- becomes NULL during the conversion.
SELECT 'product_plan.Minimum_Period' AS column_name, idProduct_Plan AS id, Minimum_Period AS value
FROM product_plan WHERE Minimum_Period IS NOT NULL AND Minimum_Period NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$'
UNION ALL SELECT 'product_plan.Maximum_Period', idProduct_Plan, Maximum_Period
FROM product_plan WHERE Maximum_Period IS NOT NULL AND Maximum_Period NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$'
UNION ALL SELECT 'product_plan.Minimum_Amount', idProduct_Plan, Minimum_Amount
FROM product_plan WHERE Minimum_Amount IS NOT NULL AND Minimum_Amount NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$'
UNION ALL SELECT 'product_plan.Maximum_Amount', idProduct_Plan, Maximum_Amount
FROM product_plan WHERE Maximum_Amount IS NOT NULL AND Maximum_Amount NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$'
UNION ALL SELECT 'product_plan.Interest', idProduct_Plan, Interest
FROM product_plan WHERE Interest IS NOT NULL AND Interest NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$'
UNION ALL SELECT 'product_plan.Late_Charge', idProduct_Plan, Late_Charge
FROM product_plan WHERE Late_Charge IS NOT NULL AND Late_Charge NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$'
UNION ALL SELECT 'pawning_product.Late_Charge', idPawning_Product, Late_Charge
FROM pawning_product WHERE Late_Charge IS NOT NULL AND Late_Charge NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';


-- ===========================================================================
-- PART 1 — REFERENTIAL INTEGRITY AND INDEXES
-- ===========================================================================

START TRANSACTION;

-- Products are always looked up per branch.
ALTER TABLE pawning_product
  ADD INDEX idx_pawning_product_branch (Branch_idBranch);

-- One product name per branch, so a plan lookup can never hit the wrong product.
ALTER TABLE pawning_product
  ADD UNIQUE KEY uq_pawning_product_branch_name (Branch_idBranch, Name);

-- Deleting a product must take its plans and settlement bands with it.
ALTER TABLE product_plan
  ADD CONSTRAINT fk_product_plan_product
  FOREIGN KEY (Pawning_Product_idPawning_Product)
  REFERENCES pawning_product (idPawning_Product)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE early_settlement_charges
  ADD CONSTRAINT fk_early_settlement_charges_product
  FOREIGN KEY (Pawning_Product_idPawning_Product)
  REFERENCES pawning_product (idPawning_Product)
  ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;


-- ===========================================================================
-- PART 2 — NUMERIC COLUMN TYPES
-- ===========================================================================

-- 2a. Blank out non-numeric values so the conversion cannot truncate silently.
UPDATE product_plan SET Minimum_Period = NULL
  WHERE Minimum_Period IS NOT NULL AND Minimum_Period NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE product_plan SET Maximum_Period = NULL
  WHERE Maximum_Period IS NOT NULL AND Maximum_Period NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE product_plan SET Minimum_Amount = NULL
  WHERE Minimum_Amount IS NOT NULL AND Minimum_Amount NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE product_plan SET Maximum_Amount = NULL
  WHERE Maximum_Amount IS NOT NULL AND Maximum_Amount NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE product_plan SET Interest = NULL
  WHERE Interest IS NOT NULL AND Interest NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE product_plan SET Late_Charge = NULL
  WHERE Late_Charge IS NOT NULL AND Late_Charge NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE product_plan SET Amount_For_22_Caratage = NULL
  WHERE Amount_For_22_Caratage IS NOT NULL AND Amount_For_22_Caratage NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE product_plan SET stage1Interest = NULL
  WHERE stage1Interest IS NOT NULL AND stage1Interest NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE product_plan SET stage2Interest = NULL
  WHERE stage2Interest IS NOT NULL AND stage2Interest NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE product_plan SET stage3Interest = NULL
  WHERE stage3Interest IS NOT NULL AND stage3Interest NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE product_plan SET stage4Interest = NULL
  WHERE stage4Interest IS NOT NULL AND stage4Interest NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE product_plan SET lateChargeStage1 = NULL
  WHERE lateChargeStage1 IS NOT NULL AND lateChargeStage1 NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE product_plan SET lateChargeStage2 = NULL
  WHERE lateChargeStage2 IS NOT NULL AND lateChargeStage2 NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE product_plan SET lateChargeStage3 = NULL
  WHERE lateChargeStage3 IS NOT NULL AND lateChargeStage3 NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE product_plan SET lateChargeStage4 = NULL
  WHERE lateChargeStage4 IS NOT NULL AND lateChargeStage4 NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';

UPDATE pawning_product SET Late_Charge = NULL
  WHERE Late_Charge IS NOT NULL AND Late_Charge NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE pawning_product SET lateChargeStage1 = NULL
  WHERE lateChargeStage1 IS NOT NULL AND lateChargeStage1 NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE pawning_product SET lateChargeStage2 = NULL
  WHERE lateChargeStage2 IS NOT NULL AND lateChargeStage2 NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE pawning_product SET lateChargeStage3 = NULL
  WHERE lateChargeStage3 IS NOT NULL AND lateChargeStage3 NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE pawning_product SET lateChargeStage4 = NULL
  WHERE lateChargeStage4 IS NOT NULL AND lateChargeStage4 NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';

UPDATE early_settlement_charges SET From_Amount = NULL
  WHERE From_Amount IS NOT NULL AND From_Amount NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE early_settlement_charges SET To_Amount = NULL
  WHERE To_Amount IS NOT NULL AND To_Amount NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';
UPDATE early_settlement_charges SET Amount = NULL
  WHERE Amount IS NOT NULL AND Amount NOT REGEXP '^-?[0-9]+(\\.[0-9]+)?$';

-- 2b. Convert the columns.
ALTER TABLE product_plan
  MODIFY COLUMN Minimum_Period INT DEFAULT NULL,
  MODIFY COLUMN Maximum_Period INT DEFAULT NULL,
  MODIFY COLUMN Minimum_Amount DECIMAL(15, 2) DEFAULT NULL,
  MODIFY COLUMN Maximum_Amount DECIMAL(15, 2) DEFAULT NULL,
  MODIFY COLUMN Interest DECIMAL(10, 4) DEFAULT NULL,
  MODIFY COLUMN Late_Charge DECIMAL(10, 4) DEFAULT NULL,
  MODIFY COLUMN Amount_For_22_Caratage DECIMAL(15, 2) DEFAULT NULL,
  MODIFY COLUMN stage1Interest DECIMAL(10, 4) DEFAULT NULL,
  MODIFY COLUMN stage2Interest DECIMAL(10, 4) DEFAULT NULL,
  MODIFY COLUMN stage3Interest DECIMAL(10, 4) DEFAULT NULL,
  MODIFY COLUMN stage4Interest DECIMAL(10, 4) DEFAULT NULL,
  MODIFY COLUMN lateChargeStage1 DECIMAL(10, 4) DEFAULT NULL,
  MODIFY COLUMN lateChargeStage2 DECIMAL(10, 4) DEFAULT NULL,
  MODIFY COLUMN lateChargeStage3 DECIMAL(10, 4) DEFAULT NULL,
  MODIFY COLUMN lateChargeStage4 DECIMAL(10, 4) DEFAULT NULL;

ALTER TABLE pawning_product
  MODIFY COLUMN Late_Charge DECIMAL(10, 4) DEFAULT NULL,
  MODIFY COLUMN lateChargeStage1 DECIMAL(10, 4) DEFAULT NULL,
  MODIFY COLUMN lateChargeStage2 DECIMAL(10, 4) DEFAULT NULL,
  MODIFY COLUMN lateChargeStage3 DECIMAL(10, 4) DEFAULT NULL,
  MODIFY COLUMN lateChargeStage4 DECIMAL(10, 4) DEFAULT NULL;

ALTER TABLE early_settlement_charges
  MODIFY COLUMN From_Amount DECIMAL(15, 2) DEFAULT NULL,
  MODIFY COLUMN To_Amount DECIMAL(15, 2) DEFAULT NULL,
  MODIFY COLUMN Amount DECIMAL(15, 2) DEFAULT NULL;

-- 2c. Band lookups filter on these on every ticket creation.
ALTER TABLE product_plan
  ADD INDEX idx_product_plan_period_band
    (Pawning_Product_idPawning_Product, Period_Type, Minimum_Period, Maximum_Period),
  ADD INDEX idx_product_plan_amount_band
    (Pawning_Product_idPawning_Product, Minimum_Amount, Maximum_Amount);
