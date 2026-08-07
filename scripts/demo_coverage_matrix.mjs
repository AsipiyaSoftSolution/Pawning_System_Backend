import dotenv from "dotenv";
dotenv.config();
import { pool } from "../utils/db.js";

const [rows] = await pool.query(
  `SELECT p.Name AS product, p.Interest_Method AS interestMethod,
          p.Service_Charge AS scStatus, p.Service_Charge_Create_As AS scAs,
          p.Service_Charge_Value_type AS scType,
          p.Late_Charge_Status AS lcStatus, p.Late_Charge_Create_As AS lcAs,
          p.Late_Charge AS lcFlat, p.numberOfLateChargeStages AS lcStages,
          p.Early_Settlement_Charge_Create_As AS esAs,
          p.early_settlement_effect_type AS productEsEffect,
          pp.Period_Type AS periodType, pp.Interest_type AS interestType,
          pp.Interest AS flatInterest, pp.Interest_Calculate_After AS grace,
          pp.interestApplicableMethod AS interestMethodPlan,
          pp.noOfStages AS interestStages,
          pp.Service_Charge_Value_type AS planScType,
          pp.Late_Charge AS planLcFlat,
          pp.numberOfLateChargeStages AS planLcStages,
          pp.early_settlement_effect_type AS planEsEffect
     FROM pawning_product p
     JOIN product_plan pp ON pp.Pawning_Product_idPawning_Product = p.idPawning_Product
    WHERE p.Name LIKE 'MCI %'
    ORDER BY p.idPawning_Product, pp.idProduct_Plan`,
);
console.table(rows);

const dimension = (label, values) =>
  console.log(`${label.padEnd(28)} ${[...new Set(values)].sort().join(", ")}`);

console.log("\nDistinct values exercised:");
dimension("Interest method", rows.map((r) => r.interestMethod));
dimension("Period type", rows.map((r) => r.periodType || "(amount based)"));
dimension("Interest duration", rows.map((r) => r.interestType));
dimension("Grace days", rows.map((r) => r.grace));
dimension(
  "Interest stage counts",
  rows.map((r) => (r.interestMethodPlan?.trim() === "calculate for stages" ? r.interestStages : "flat")),
);
dimension("Service charge as", rows.map((r) => `${r.scStatus === "1" ? r.scAs : "inactive"}`));
dimension(
  "Service charge value type",
  rows.map((r) => (r.scAs === "Charge For Product Item" ? r.planScType : r.scType) || "inactive"),
);
dimension("Late charge as", rows.map((r) => (r.lcStatus === "1" ? r.lcAs : "inactive")));
dimension(
  "Late charge shape",
  rows.map((r) => {
    if (r.lcStatus !== "1") return "inactive";
    const stages = r.lcAs === "Charge For Product Item" ? r.planLcStages : r.lcStages;
    return Number(stages) >= 1 ? `${stages} stages` : "flat";
  }),
);
dimension("Early settlement as", rows.map((r) => r.esAs || "inactive"));
// The effect type lives on whichever level owns the charge.
dimension(
  "Early settlement effect",
  rows.map(
    (r) =>
      (r.esAs === "Charge For Product Item" ? r.planEsEffect : r.productEsEffect) ||
      "(none/amount ranges)",
  ),
);

process.exit(0);
