/**
 * Demo data seeder for company 61 (Micro Credit Investment), Galle branch.
 *
 * Creates a spread of pawning products that exercise every configuration
 * branch the interest / penalty engine understands, then grants tickets with
 * articles to the company's existing customer so the daily job has something
 * to accrue against.
 *
 *   node scripts/seed_demo_company61.mjs            # create (skips what exists)
 *   node scripts/seed_demo_company61.mjs --reset    # wipe previous demo rows first
 *
 * Everything it creates is tagged with DEMO_TAG so --reset can find it again.
 */
import dotenv from "dotenv";
dotenv.config();

import { pool, pool2 } from "../utils/db.js";
import { createOnePawningProductForBranch } from "../controllers/pawning.product.controller.js";
import {
  createPawningTicketLogOnCreate,
  markServiceChargeInTicketLog,
  createPawningTicketLogOnApprovalandLoanDisbursement,
} from "../utils/pawning.ticket.logs.js";
import { computeInterestApplyOnDate } from "../utils/pawningInterestSchedule.js";

const COMPANY_ID = 61;
const BRANCH_ID = 105; // Galle
const USER_ID = 590; // Sachinthana Jayathunga
const CUSTOMER_ID = 1408; // Oshan Lahiru (account center id 34877)
const DEMO_TAG = "MCI";

const RESET = process.argv.includes("--reset");

// ─────────────────────────────────────────────────────────────
// Date helpers (local calendar day, matching the daily job)
// ─────────────────────────────────────────────────────────────

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const daysAgo = (n) => addDays(startOfToday(), -n);

const toDateStr = (date) => {
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

const addPeriod = (date, periodType, period) => {
  const d = new Date(date);
  const n = Number(period);
  if (periodType === "days") d.setDate(d.getDate() + n);
  else if (periodType === "weeks") d.setDate(d.getDate() + n * 7);
  else if (periodType === "months") d.setMonth(d.getMonth() + n);
  return d;
};

const money = (n) => Number(Number(n).toFixed(2));

// ─────────────────────────────────────────────────────────────
// Article types (Account Center) — tickets reference these by id
// ─────────────────────────────────────────────────────────────

const ARTICLE_TYPES = {
  Rings: ["Men rings", "Women rings"],
  Necklaces: ["Chain", "Pendant set"],
  Bangles: ["Solid bangle", "Hollow bangle"],
  Earrings: ["Studs", "Danglers"],
  "Gold Coins": ["Sovereign", "Half sovereign"],
};

async function ensureArticleTypes() {
  const resolved = {};
  for (const [typeName, categories] of Object.entries(ARTICLE_TYPES)) {
    const [existing] = await pool2.query(
      "SELECT idArticle_Types FROM article_types WHERE Description = ? AND Company_idCompany = ?",
      [typeName, COMPANY_ID],
    );

    let typeId = existing[0]?.idArticle_Types;
    if (!typeId) {
      const [ins] = await pool2.query(
        "INSERT INTO article_types (Description, Company_idCompany, created_at) VALUES (?, ?, NOW())",
        [typeName, COMPANY_ID],
      );
      typeId = ins.insertId;
    }

    const categoryIds = {};
    for (const category of categories) {
      const [existingCat] = await pool2.query(
        "SELECT idArticle_Categories FROM article_categories WHERE Description = ? AND Article_types_idArticle_types = ?",
        [category, typeId],
      );
      let catId = existingCat[0]?.idArticle_Categories;
      if (!catId) {
        const [ins] = await pool2.query(
          "INSERT INTO article_categories (Description, Article_types_idArticle_types, created_at) VALUES (?, ?, NOW())",
          [category, typeId],
        );
        catId = ins.insertId;
      }
      categoryIds[category] = catId;
    }

    resolved[typeName] = { typeId, categories: categoryIds };
  }
  return resolved;
}

// ─────────────────────────────────────────────────────────────
// Products — one per configuration shape the engine supports
// ─────────────────────────────────────────────────────────────

const carat22 = {
  oneWeek: 85,
  oneMonth: 82,
  threeMonths: 78,
  sixMonths: 74,
  nineMonths: 71,
  twelveMonths: 68,
};

const PRODUCTS = [
  {
    // Flat monthly interest, product-level percentage service charge,
    // product-level flat daily late charge. The plain vanilla path.
    productName: `${DEMO_TAG} Gold Monthly Standard`,
    productCode: "GMS01",
    interestMethod: "Interest For Period",
    serviceCharge: {
      status: "Active",
      chargeType: "Charge For Product",
      valueType: "Percentage",
      value: 1,
    },
    lateCharge: {
      status: "Active",
      chargeType: "Charge For Product",
      percentage: 0.15,
      numberOfLateChargeStages: 0,
    },
    earlysettlementsData: {
      newEarlySettlement: { status: "Inactive", chargeType: "inactive" },
    },
    productItems: [
      {
        periodType: "months",
        minPeriod: 1,
        maxPeriod: 3,
        interestType: "perMonth",
        interest: 2.5,
        interestAfter: 0,
        amount22Carat: 22000,
        carat22Percentages: carat22,
      },
      {
        periodType: "months",
        minPeriod: 4,
        maxPeriod: 6,
        interestType: "perMonth",
        interest: 2.75,
        interestAfter: 0,
        amount22Carat: 22000,
        carat22Percentages: carat22,
      },
      {
        periodType: "months",
        minPeriod: 7,
        maxPeriod: 12,
        interestType: "perMonth",
        interest: 3.0,
        interestAfter: 0,
        amount22Carat: 22000,
        carat22Percentages: carat22,
      },
    ],
  },
  {
    // Stage-wise interest plus stage-wise late charges, both configured at
    // product-item level, with an early settlement charge per item.
    productName: `${DEMO_TAG} Gold Staged Interest`,
    productCode: "GSI02",
    interestMethod: "Interest For Period",
    serviceCharge: {
      status: "Active",
      chargeType: "Charge For Product Item",
    },
    lateCharge: {
      status: "Active",
      chargeType: "Charge For Product Item",
    },
    earlysettlementsData: {
      newEarlySettlement: {
        status: "Active",
        chargeType: "Charge For Product Item",
      },
    },
    productItems: [
      {
        periodType: "months",
        minPeriod: 1,
        maxPeriod: 12,
        interestType: "perMonth",
        interest: 0,
        interestAfter: 0,
        amount22Carat: 22500,
        carat22Percentages: carat22,
        serviceChargeValueType: "fixed",
        serviceChargeValue: 1500,
        // Stages 1..N-1 are charged once on their start day; the last stage
        // accrues daily at rate / duration divisor.
        interestApplicableMethod: "calculate for stages ",
        numberOfStages: 3,
        stage1StartDate: 0,
        stage1EndDate: 30,
        stage1Interest: 1.5,
        stage2StartDate: 31,
        stage2EndDate: 60,
        stage2Interest: 2.0,
        stage3StartDate: 61,
        stage3EndDate: "Until Settlement",
        stage3Interest: 2.5,
        // Late charge: 1% once on the maturity date, then 0.1%/day afterwards.
        numberOfLateChargeStages: 2,
        lateChargeStage1: 1.0,
        lateChargeStage1StartDate: 0,
        lateChargeStage1EndDate: 0,
        lateChargeStage2: 0.1,
        lateChargeStage2StartDate: 1,
        lateChargeStage2EndDate: "Until Settlement",
        earlySettlementEffectType: "charge",
        earlySettlementStage1StartDay: 0,
        earlySettlementStage1EndDay: 30,
        earlySettlementStage1Value: 2,
        earlySettlementStage1ValueType: "percentage",
        earlySettlementStage2StartDay: 31,
        earlySettlementStage2EndDay: "to maturity date",
        earlySettlementStage2Value: 1,
        earlySettlementStage2ValueType: "percentage",
      },
    ],
  },
  {
    // Interest banded by pawning amount instead of period, product-level fixed
    // service charge, product-level staged late charges, and an early
    // settlement charge driven by the settlement amount.
    productName: `${DEMO_TAG} Gold Amount Based`,
    productCode: "GAB03",
    interestMethod: "Interest For Pawning Amount",
    amount22: 23000,
    percentages: carat22,
    serviceCharge: {
      status: "Active",
      chargeType: "Charge For Product",
      valueType: "Fixed Amount",
      value: 750,
    },
    lateCharge: {
      status: "Active",
      chargeType: "Charge For Product",
      percentage: 0,
      numberOfLateChargeStages: 2,
      lateChargeStage1: 2.0,
      lateChargeStage1StartDate: 0,
      lateChargeStage1EndDate: 0,
      lateChargeStage2: 0.2,
      lateChargeStage2StartDate: 1,
      lateChargeStage2EndDate: "Until Settlement",
    },
    earlysettlementsData: {
      newEarlySettlement: {
        status: "Active",
        chargeType: "Charge For Settlement Amount",
      },
      earlySettlements: [
        { lessThan: 0, endAmount: 100000, valueType: "percentage", value: 2 },
        {
          lessThan: 100001,
          endAmount: 2000000,
          valueType: "percentage",
          value: 1,
        },
      ],
    },
    productItems: [
      {
        minAmount: 0,
        maxAmount: 100000,
        interestType: "perMonth",
        interest: 3.0,
        interestAfter: 0,
      },
      {
        minAmount: 100001,
        maxAmount: 500000,
        interestType: "perMonth",
        interest: 2.75,
        interestAfter: 0,
      },
      {
        minAmount: 500001,
        maxAmount: 2000000,
        interestType: "perMonth",
        interest: 2.5,
        interestAfter: 0,
      },
    ],
  },
  {
    // Weekly interest with a 7 day grace period before interest starts —
    // exercises Interest_Calculate_After and the perWeek divisor.
    productName: `${DEMO_TAG} Gold Weekly Grace`,
    productCode: "GWG04",
    interestMethod: "Interest For Period",
    serviceCharge: {
      status: "Active",
      chargeType: "Charge For Product Item",
    },
    lateCharge: {
      status: "Active",
      chargeType: "Charge For Product",
      percentage: 0.2,
      numberOfLateChargeStages: 0,
    },
    earlysettlementsData: {
      newEarlySettlement: {
        status: "Active",
        chargeType: "Charge For Product",
        earlySettlementEffectType: "discount",
        earlySettlementStage1StartDay: 0,
        earlySettlementStage1EndDay: "to maturity date",
        earlySettlementStage1Value: 500,
        earlySettlementStage1ValueType: "fixed",
      },
    },
    productItems: [
      {
        periodType: "weeks",
        minPeriod: 1,
        maxPeriod: 4,
        interestType: "perWeek",
        interest: 0.75,
        interestAfter: 7,
        amount22Carat: 21500,
        carat22Percentages: carat22,
        serviceChargeValueType: "percentage",
        serviceChargeValue: 0.5,
      },
      {
        periodType: "weeks",
        minPeriod: 5,
        maxPeriod: 12,
        interestType: "perWeek",
        interest: 0.85,
        interestAfter: 7,
        amount22Carat: 21500,
        carat22Percentages: carat22,
        serviceChargeValueType: "percentage",
        serviceChargeValue: 0.5,
      },
    ],
  },
  {
    // Nothing but interest: no service charge, no late charge, no early
    // settlement charge. Baseline for isolating interest maths.
    productName: `${DEMO_TAG} Gold Interest Only`,
    productCode: "GIO05",
    interestMethod: "Interest For Period",
    serviceCharge: { status: "Inactive", chargeType: "inactive" },
    lateCharge: {
      status: "Inactive",
      chargeType: "inactive",
      percentage: 0,
      numberOfLateChargeStages: 0,
    },
    earlysettlementsData: {
      newEarlySettlement: { status: "Inactive", chargeType: "inactive" },
    },
    productItems: [
      {
        periodType: "months",
        minPeriod: 1,
        maxPeriod: 12,
        interestType: "perMonth",
        interest: 2.0,
        interestAfter: 0,
        amount22Carat: 22000,
        carat22Percentages: carat22,
        serviceChargeValueType: "inactive",
        serviceChargeValue: 0,
      },
    ],
  },
  {
    // Daily interest (divisor 1) with a 3 day grace period, and the only
    // product-item level FLAT late charge — every other item-level late charge
    // here is staged.
    productName: `${DEMO_TAG} Gold Daily Short Term`,
    productCode: "GDS06",
    interestMethod: "Interest For Period",
    serviceCharge: {
      status: "Active",
      chargeType: "Charge For Product",
      valueType: "Fixed Amount",
      value: 500,
    },
    lateCharge: {
      status: "Active",
      chargeType: "Charge For Product Item",
    },
    earlysettlementsData: {
      newEarlySettlement: { status: "Inactive", chargeType: "inactive" },
    },
    productItems: [
      {
        periodType: "days",
        minPeriod: 1,
        maxPeriod: 90,
        interestType: "perDay",
        interest: 0.1,
        interestAfter: 3,
        amount22Carat: 21000,
        carat22Percentages: carat22,
        // Flat per-day late charge at item level, no stages.
        numberOfLateChargeStages: 0,
        lateChargePerDay: 0.25,
      },
    ],
  },
  {
    // Staged interest on an amount banded product, covering the 2 stage and
    // 4 stage cases plus the perYear divisor, over a 4 stage late charge.
    productName: `${DEMO_TAG} Gold Staged Amount Bands`,
    productCode: "GSA07",
    interestMethod: "Interest For Pawning Amount",
    amount22: 23500,
    percentages: carat22,
    serviceCharge: {
      status: "Active",
      chargeType: "Charge For Product Item",
    },
    lateCharge: {
      status: "Active",
      chargeType: "Charge For Product",
      percentage: 0,
      numberOfLateChargeStages: 4,
      lateChargeStage1: 1.5,
      lateChargeStage1StartDate: 0,
      lateChargeStage1EndDate: 0,
      lateChargeStage2: 0.1,
      lateChargeStage2StartDate: 1,
      lateChargeStage2EndDate: 15,
      lateChargeStage3: 0.2,
      lateChargeStage3StartDate: 16,
      lateChargeStage3EndDate: 30,
      lateChargeStage4: 0.3,
      lateChargeStage4StartDate: 31,
      lateChargeStage4EndDate: "Until Settlement",
    },
    earlysettlementsData: {
      newEarlySettlement: { status: "Inactive", chargeType: "inactive" },
    },
    productItems: [
      {
        minAmount: 0,
        maxAmount: 200000,
        interestType: "perMonth",
        interest: 0,
        interestAfter: 0,
        serviceChargeValueType: "fixed",
        serviceChargeValue: 900,
        interestApplicableMethod: "calculate for stages ",
        numberOfStages: 2,
        stage1StartDate: 0,
        stage1EndDate: 30,
        stage1Interest: 2.0,
        stage2StartDate: 31,
        stage2EndDate: "Until Settlement",
        stage2Interest: 3.0,
      },
      {
        minAmount: 200001,
        maxAmount: 2000000,
        interestType: "perYear",
        interest: 0,
        interestAfter: 0,
        serviceChargeValueType: "percentage",
        serviceChargeValue: 0.75,
        interestApplicableMethod: "calculate for stages ",
        numberOfStages: 4,
        stage1StartDate: 0,
        stage1EndDate: 15,
        stage1Interest: 1.0,
        stage2StartDate: 16,
        stage2EndDate: 30,
        stage2Interest: 1.5,
        stage3StartDate: 31,
        stage3EndDate: 45,
        stage3Interest: 2.0,
        stage4StartDate: 46,
        stage4EndDate: "Until Settlement",
        stage4Interest: 24.0,
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Tickets — spread across products, ages and maturity states
// ─────────────────────────────────────────────────────────────

const TICKETS = [
  {
    ref: "T1",
    note: "Flat monthly interest, still within its term",
    product: `${DEMO_TAG} Gold Monthly Standard`,
    periodType: "months",
    period: 3,
    grantDaysAgo: 20,
    advance: 150000,
    serviceChargePaidBy: "advance",
    articles: [
      {
        type: "Rings",
        category: "Men rings",
        condition: "Used",
        caratage: "22",
        noOfItems: 2,
        grossWeight: 12.5,
        netWeight: 11.8,
        acidTestStatus: "Yes",
        dmReading: 6,
        assessedValue: 259600,
        declaredValue: 200000,
      },
    ],
  },
  {
    ref: "T2",
    note: "Flat monthly interest, matured 15 days ago -> daily late charge",
    product: `${DEMO_TAG} Gold Monthly Standard`,
    periodType: "months",
    period: 1,
    grantDaysAgo: 45,
    advance: 80000,
    serviceChargePaidBy: "customer",
    articles: [
      {
        type: "Necklaces",
        category: "Chain",
        condition: "Used",
        caratage: "21",
        noOfItems: 1,
        grossWeight: 8.2,
        netWeight: 8.0,
        acidTestStatus: "Yes",
        dmReading: 4,
        assessedValue: 168000,
        declaredValue: 120000,
      },
    ],
  },
  {
    ref: "T3",
    note: "Staged interest across all 3 stages, matured -> staged late charge",
    product: `${DEMO_TAG} Gold Staged Interest`,
    periodType: "months",
    period: 3,
    grantDaysAgo: 100,
    advance: 250000,
    serviceChargePaidBy: "advance",
    articles: [
      {
        type: "Bangles",
        category: "Solid bangle",
        condition: "Used",
        caratage: "22",
        noOfItems: 4,
        grossWeight: 22.4,
        netWeight: 21.9,
        acidTestStatus: "Yes",
        dmReading: 11,
        assessedValue: 492750,
        declaredValue: 350000,
      },
      {
        type: "Earrings",
        category: "Studs",
        condition: "New",
        caratage: "22",
        noOfItems: 2,
        grossWeight: 4.1,
        netWeight: 4.0,
        acidTestStatus: "Yes",
        dmReading: 2,
        assessedValue: 90000,
        declaredValue: 60000,
      },
    ],
  },
  {
    ref: "T4",
    note: "Amount banded interest, matured 10 days ago -> staged late charge",
    product: `${DEMO_TAG} Gold Amount Based`,
    periodType: "months",
    period: 2,
    grantDaysAgo: 70,
    advance: 420000,
    serviceChargePaidBy: "advance",
    articles: [
      {
        type: "Gold Coins",
        category: "Sovereign",
        condition: "New",
        caratage: "22",
        noOfItems: 6,
        grossWeight: 48.0,
        netWeight: 48.0,
        acidTestStatus: "Yes",
        dmReading: 24,
        assessedValue: 1104000,
        declaredValue: 600000,
      },
    ],
  },
  {
    ref: "T5",
    note: "Weekly interest with a 7 day grace period before accrual starts",
    product: `${DEMO_TAG} Gold Weekly Grace`,
    periodType: "weeks",
    period: 4,
    grantDaysAgo: 12,
    advance: 60000,
    serviceChargePaidBy: "customer",
    articles: [
      {
        type: "Rings",
        category: "Women rings",
        condition: "Used",
        caratage: "20",
        noOfItems: 3,
        grossWeight: 9.0,
        netWeight: 8.6,
        acidTestStatus: "Yes",
        dmReading: 4,
        assessedValue: 172000,
        declaredValue: 90000,
      },
    ],
  },
  {
    ref: "T6",
    note: "Interest only product, no charges of any kind",
    product: `${DEMO_TAG} Gold Interest Only`,
    periodType: "months",
    period: 6,
    grantDaysAgo: 35,
    advance: 100000,
    serviceChargePaidBy: "customer",
    articles: [
      {
        type: "Necklaces",
        category: "Pendant set",
        condition: "Used",
        caratage: "22",
        noOfItems: 1,
        grossWeight: 6.5,
        netWeight: 6.2,
        acidTestStatus: "Yes",
        dmReading: 3,
        assessedValue: 139500,
        declaredValue: 130000,
      },
    ],
  },
  {
    ref: "T7",
    note: "Granted 2 days ago against a 3 day grace period -> nothing accrued yet",
    product: `${DEMO_TAG} Gold Daily Short Term`,
    periodType: "days",
    period: 30,
    grantDaysAgo: 2,
    advance: 40000,
    serviceChargePaidBy: "advance",
    articles: [
      {
        type: "Rings",
        category: "Men rings",
        condition: "Used",
        caratage: "22",
        noOfItems: 1,
        grossWeight: 4.2,
        netWeight: 4.0,
        acidTestStatus: "Yes",
        dmReading: 2,
        assessedValue: 84000,
        declaredValue: 50000,
      },
    ],
  },
  {
    ref: "T8",
    note: "Daily interest past its 10 day term -> flat item level late charge",
    product: `${DEMO_TAG} Gold Daily Short Term`,
    periodType: "days",
    period: 10,
    grantDaysAgo: 25,
    advance: 55000,
    serviceChargePaidBy: "customer",
    articles: [
      {
        type: "Bangles",
        category: "Hollow bangle",
        condition: "Used",
        caratage: "21",
        noOfItems: 2,
        grossWeight: 7.5,
        netWeight: 7.1,
        acidTestStatus: "Yes",
        dmReading: 4,
        assessedValue: 149100,
        declaredValue: 80000,
      },
    ],
  },
  {
    ref: "T9",
    note: "Two stage interest on the low amount band, matured -> 4 stage late charge",
    product: `${DEMO_TAG} Gold Staged Amount Bands`,
    periodType: "months",
    period: 1,
    grantDaysAgo: 55,
    advance: 150000,
    serviceChargePaidBy: "advance",
    articles: [
      {
        type: "Necklaces",
        category: "Chain",
        condition: "Used",
        caratage: "22",
        noOfItems: 1,
        grossWeight: 9.8,
        netWeight: 9.4,
        acidTestStatus: "Yes",
        dmReading: 5,
        assessedValue: 220900,
        declaredValue: 160000,
      },
    ],
  },
  {
    ref: "T10",
    note: "Four stage perYear interest on the high amount band, deep into late charge stage 3",
    product: `${DEMO_TAG} Gold Staged Amount Bands`,
    periodType: "months",
    period: 2,
    grantDaysAgo: 85,
    advance: 300000,
    serviceChargePaidBy: "customer",
    articles: [
      {
        type: "Gold Coins",
        category: "Half sovereign",
        condition: "New",
        caratage: "22",
        noOfItems: 8,
        grossWeight: 32.0,
        netWeight: 32.0,
        acidTestStatus: "Yes",
        dmReading: 16,
        assessedValue: 752000,
        declaredValue: 420000,
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Reset
// ─────────────────────────────────────────────────────────────

async function resetDemoData() {
  const [products] = await pool.query(
    "SELECT idPawning_Product FROM pawning_product WHERE Branch_idBranch = ? AND Name LIKE ?",
    [BRANCH_ID, `${DEMO_TAG} %`],
  );
  const productIds = products.map((p) => p.idPawning_Product);

  const [tickets] = await pool.query(
    "SELECT idPawning_Ticket FROM pawning_ticket WHERE Branch_idBranch = ? AND Ticket_No LIKE ?",
    [BRANCH_ID, `${DEMO_TAG}-%`],
  );
  const ticketIds = tickets.map((t) => t.idPawning_Ticket);

  if (ticketIds.length > 0) {
    await pool.query(
      "DELETE FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket IN (?)",
      [ticketIds],
    );
    await pool.query(
      "DELETE FROM ticket_articles WHERE Pawning_Ticket_idPawning_Ticket IN (?)",
      [ticketIds],
    );
    await pool.query(
      "DELETE FROM ticket_artical_images WHERE Pawning_Ticket_idPawning_Ticket IN (?)",
      [ticketIds],
    );
    await pool.query("DELETE FROM payment WHERE Pawning_Ticket_idPawning_Ticket IN (?)", [
      ticketIds,
    ]);
    await pool.query(
      "DELETE FROM ticket_payment WHERE Pawning_Ticket_idPawning_Ticket IN (?)",
      [ticketIds],
    );
    await pool.query("DELETE FROM pawning_ticket WHERE idPawning_Ticket IN (?)", [
      ticketIds,
    ]);
  }

  if (productIds.length > 0) {
    await pool.query(
      "DELETE FROM early_settlement_charges WHERE Pawning_Product_idPawning_Product IN (?)",
      [productIds],
    );
    await pool.query(
      "DELETE FROM product_plan WHERE Pawning_Product_idPawning_Product IN (?)",
      [productIds],
    );
    await pool.query("DELETE FROM pawning_product WHERE idPawning_Product IN (?)", [
      productIds,
    ]);
  }

  console.log(
    `Reset: removed ${ticketIds.length} demo ticket(s) and ${productIds.length} demo product(s).`,
  );
}

// ─────────────────────────────────────────────────────────────
// Seeding
// ─────────────────────────────────────────────────────────────

async function seedProducts() {
  const created = {};
  for (const definition of PRODUCTS) {
    const [existing] = await pool.query(
      "SELECT idPawning_Product FROM pawning_product WHERE Branch_idBranch = ? AND Name = ?",
      [BRANCH_ID, definition.productName],
    );
    if (existing.length > 0) {
      created[definition.productName] = existing[0].idPawning_Product;
      console.log(
        `  = ${definition.productName} (already exists, id ${existing[0].idPawning_Product})`,
      );
      continue;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const productId = await createOnePawningProductForBranch(
        BRANCH_ID,
        definition,
        USER_ID,
        connection,
      );
      await connection.commit();
      created[definition.productName] = productId;
      console.log(`  + ${definition.productName} (id ${productId})`);
    } catch (error) {
      await connection.rollback();
      throw new Error(
        `Failed creating product "${definition.productName}": ${error.message}`,
      );
    } finally {
      connection.release();
    }
  }
  return created;
}

/**
 * Resolve the product_plan row that governs this ticket, using the same
 * matching rules the ticket controller applies.
 */
async function matchProductPlan(connection, product, ticket) {
  if (product.Interest_Method === "Interest For Period") {
    const [rows] = await connection.query(
      "SELECT * FROM product_plan WHERE Pawning_Product_idPawning_Product = ? AND Period_Type = ? AND ? BETWEEN CAST(Minimum_Period AS UNSIGNED) AND CAST(Maximum_Period AS UNSIGNED)",
      [product.idPawning_Product, ticket.periodType, ticket.period],
    );
    return rows[0] || null;
  }
  const [rows] = await connection.query(
    "SELECT * FROM product_plan WHERE Pawning_Product_idPawning_Product = ? AND ? BETWEEN CAST(Minimum_Amount AS UNSIGNED) AND CAST(Maximum_Amount AS UNSIGNED)",
    [product.idPawning_Product, ticket.advance],
  );
  return rows[0] || null;
}

function resolveServiceCharge(product, plan, advance) {
  const createAs = product.Service_Charge_Create_As;
  if (createAs === "Charge For Product") {
    const valueType = product.Service_Charge_Value_type;
    if (valueType === "Percentage") {
      return {
        type: valueType,
        amount: money(advance * (parseFloat(product.Service_Charge_Value) / 100)),
      };
    }
    if (valueType === "Fixed Amount") {
      return { type: valueType, amount: money(product.Service_Charge_Value) };
    }
    return { type: "inactive", amount: 0 };
  }

  if (createAs === "Charge For Product Item") {
    const valueType = plan?.Service_Charge_Value_type;
    if (valueType === "percentage") {
      return {
        type: valueType,
        amount: money(advance * (parseFloat(plan.Service_Charge_Value) / 100)),
      };
    }
    if (valueType === "fixed") {
      return { type: valueType, amount: money(plan.Service_Charge_Value) };
    }
    return { type: "inactive", amount: 0 };
  }

  return { type: "inactive", amount: 0 };
}

const LATE_CHARGE_COLUMNS = [
  "Late_Charge",
  "lateChargeStage1",
  "lateChargeStage2",
  "lateChargeStage3",
  "lateChargeStage4",
  "lateChargeStage1StartDate",
  "lateChargeStage2StartDate",
  "lateChargeStage3StartDate",
  "lateChargeStage4StartDate",
  "lateChargeStage1EndDate",
  "lateChargeStage2EndDate",
  "lateChargeStage3EndDate",
  "lateChargeStage4EndDate",
  "numberOfLateChargeStages",
];

const EARLY_SETTLEMENT_COLUMNS = [
  "early_settlement_effect_type",
  "early_settlement_stage1_start_day",
  "early_settlement_stage1_end_day",
  "early_settlement_stage1_value",
  "early_settlement_stage1_value_type",
  "early_settlement_stage2_start_day",
  "early_settlement_stage2_end_day",
  "early_settlement_stage2_value",
  "early_settlement_stage2_value_type",
  "early_settlement_stage3_start_day",
  "early_settlement_stage3_end_day",
  "early_settlement_stage3_value",
  "early_settlement_stage3_value_type",
  "early_settlement_stage4_start_day",
  "early_settlement_stage4_end_day",
  "early_settlement_stage4_value",
  "early_settlement_stage4_value_type",
];

const pick = (source, columns) => {
  const out = {};
  for (const column of columns) out[column] = source?.[column] ?? null;
  return out;
};

async function createDemoTicket(connection, definition, productId, articleTypes, seq) {
  const [productRows] = await connection.query(
    "SELECT * FROM pawning_product WHERE idPawning_Product = ?",
    [productId],
  );
  const product = productRows[0];

  const plan = await matchProductPlan(connection, product, definition);
  if (!plan) {
    throw new Error(
      `${definition.ref}: no product plan matched for ${definition.product}`,
    );
  }

  const grantDate = daysAgo(definition.grantDaysAgo);
  const maturityDate = addPeriod(grantDate, definition.periodType, definition.period);
  const interestApplyOn = computeInterestApplyOnDate(
    grantDate,
    plan.Interest_Calculate_After,
  );

  const serviceCharge = resolveServiceCharge(product, plan, definition.advance);

  const lateChargeInactive =
    String(product.Late_Charge_Status ?? "0") !== "1" ||
    !product.Late_Charge_Create_As ||
    product.Late_Charge_Create_As === "inactive";

  let lateChargeSnapshot = pick(null, LATE_CHARGE_COLUMNS);
  if (!lateChargeInactive) {
    lateChargeSnapshot = pick(
      product.Late_Charge_Create_As === "Charge For Product" ? product : plan,
      LATE_CHARGE_COLUMNS,
    );
  }

  const configuredLateStages =
    parseInt(lateChargeSnapshot.numberOfLateChargeStages, 10) || 0;
  const flatLateCharge =
    !lateChargeInactive && configuredLateStages < 1
      ? parseFloat(lateChargeSnapshot.Late_Charge) || 0
      : 0;

  const earlySettlementCreateAs = product.Early_Settlement_Charge_Create_As;
  let earlySettlement = pick(null, EARLY_SETTLEMENT_COLUMNS);
  if (earlySettlementCreateAs === "Charge For Product") {
    earlySettlement = pick(product, EARLY_SETTLEMENT_COLUMNS);
  } else if (earlySettlementCreateAs === "Charge For Product Item") {
    earlySettlement = pick(plan, EARLY_SETTLEMENT_COLUMNS);
  }

  const totalDeclaredValue = definition.articles.reduce(
    (sum, a) => sum + Number(a.declaredValue),
    0,
  );
  const grossWeight = definition.articles.reduce(
    (sum, a) => sum + Number(a.grossWeight),
    0,
  );
  const netWeight = definition.articles.reduce(
    (sum, a) => sum + Number(a.netWeight),
    0,
  );
  const assessedValue = definition.articles.reduce(
    (sum, a) => sum + Number(a.assessedValue),
    0,
  );

  const ticketNo = `${DEMO_TAG}-${String(seq).padStart(4, "0")}-${definition.ref}`;

  const [result] = await connection.query(
    `INSERT INTO pawning_ticket (
      Ticket_No, SEQ_No, Date_Time, Customer_idCustomer, Period_Type, Period, Maturity_date,
      Gross_Weight, Assessed_Value, Net_Weight, Payble_Value, Pawning_Advance_Amount,
      Interest_Rate, Service_charge_Amount, Late_charge_Presentage, Interest_apply_on,
      User_idUser, Branch_idBranch, Pawning_Product_idPawning_Product, Total_Amount,
      Service_Charge_Type, Service_Charge_Rate, Early_Settlement_Charge_Balance,
      Additiona_Charges_Balance, Service_Charge_Balance, Late_Charge_Balance,
      Interest_Amount_Balance, Balance_Amount, Interest_Rate_Duration,
      stage1StartDate, stage1EndDate, stage2StartDate, stage2EndDate,
      stage3StartDate, stage3EndDate, stage4StartDate, stage4EndDate,
      stage1Interest, stage2Interest, stage3Interest, stage4Interest,
      Status, service_charge_paid_by_customer, service_charge_paid_from_pawning_advance,
      noOfStages, lateChargeStage1, lateChargeStage2, lateChargeStage3, lateChargeStage4,
      lateChargeStage1StartDate, lateChargeStage2StartDate, lateChargeStage3StartDate,
      lateChargeStage4StartDate, lateChargeStage1EndDate, lateChargeStage2EndDate,
      lateChargeStage3EndDate, lateChargeStage4EndDate, numberOfLateChargeStages,
      early_settlement_effect_type,
      early_settlement_stage1_start_day, early_settlement_stage1_end_day,
      early_settlement_stage1_value, early_settlement_stage1_value_type,
      early_settlement_stage2_start_day, early_settlement_stage2_end_day,
      early_settlement_stage2_value, early_settlement_stage2_value_type,
      early_settlement_stage3_start_day, early_settlement_stage3_end_day,
      early_settlement_stage3_value, early_settlement_stage3_value_type,
      early_settlement_stage4_start_day, early_settlement_stage4_end_day,
      early_settlement_stage4_value, early_settlement_stage4_value_type
    ) VALUES (${new Array(75).fill("?").join(",")})`,
    [
      ticketNo,
      String(seq),
      toDateStr(grantDate),
      CUSTOMER_ID,
      definition.periodType,
      String(definition.period),
      toDateStr(maturityDate),
      grossWeight,
      assessedValue,
      netWeight,
      totalDeclaredValue,
      definition.advance,
      plan.Interest,
      serviceCharge.amount,
      flatLateCharge,
      interestApplyOn,
      USER_ID,
      BRANCH_ID,
      productId,
      definition.advance,
      serviceCharge.type,
      serviceCharge.amount,
      0,
      0,
      0,
      0,
      0,
      definition.advance,
      plan.Interest_type,
      plan.stage1StartDate,
      plan.stage1EndDate,
      plan.stage2StartDate,
      plan.stage2EndDate,
      plan.stage3StartDate,
      plan.stage3EndDate,
      plan.stage4StartDate,
      plan.stage4EndDate,
      plan.stage1Interest,
      plan.stage2Interest,
      plan.stage3Interest,
      plan.stage4Interest,
      "1", // active — the daily job only accrues on active tickets
      definition.serviceChargePaidBy === "customer" ? 1 : null,
      definition.serviceChargePaidBy === "advance" ? 1 : null,
      plan.noOfStages || 0,
      lateChargeSnapshot.lateChargeStage1,
      lateChargeSnapshot.lateChargeStage2,
      lateChargeSnapshot.lateChargeStage3,
      lateChargeSnapshot.lateChargeStage4,
      lateChargeSnapshot.lateChargeStage1StartDate,
      lateChargeSnapshot.lateChargeStage2StartDate,
      lateChargeSnapshot.lateChargeStage3StartDate,
      lateChargeSnapshot.lateChargeStage4StartDate,
      lateChargeSnapshot.lateChargeStage1EndDate,
      lateChargeSnapshot.lateChargeStage2EndDate,
      lateChargeSnapshot.lateChargeStage3EndDate,
      lateChargeSnapshot.lateChargeStage4EndDate,
      configuredLateStages,
      ...EARLY_SETTLEMENT_COLUMNS.map((column) => earlySettlement[column]),
    ],
  );

  const ticketId = result.insertId;

  for (const article of definition.articles) {
    const typeMeta = articleTypes[article.type];
    const advancedValue = money(
      (Number(article.declaredValue) / totalDeclaredValue) * definition.advance,
    );
    await connection.query(
      "INSERT INTO ticket_articles (Article_type,Article_category,Article_Condition,Caratage,No_Of_Items,Gross_Weight,Acid_Test_Status,DM_Reading,Net_Weight,Assessed_Value,Declared_Value,Pawning_Ticket_idPawning_Ticket,Image_Path,Advanced_Value,Remark) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        typeMeta.typeId,
        String(typeMeta.categories[article.category]),
        article.condition,
        article.caratage,
        String(article.noOfItems),
        String(article.grossWeight),
        article.acidTestStatus,
        String(article.dmReading),
        String(article.netWeight),
        String(article.assessedValue),
        String(article.declaredValue),
        ticketId,
        null,
        advancedValue,
        definition.note,
      ],
    );
  }

  return {
    ticketId,
    ticketNo,
    grantDate,
    maturityDate,
    interestApplyOn,
    serviceCharge,
    plan,
  };
}

/**
 * Replay the log trail a real ticket accumulates between creation and going
 * active, so balances line up before the daily job runs.
 *
 * Each step runs on its own connection the way separate API requests would.
 * Chaining them inside one transaction hides earlier rows from later reads
 * under REPEATABLE READ, which zeroes out the carried balances.
 */
async function writeTicketLifecycleLogs(ticket, definition) {
  await createPawningTicketLogOnCreate(
    ticket.ticketId,
    "CREATE",
    USER_ID,
    definition.advance,
  );

  if (definition.serviceChargePaidBy === "advance" && ticket.serviceCharge.amount > 0) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await markServiceChargeInTicketLog(
        ticket.ticketId,
        "SERVICE CHARGE",
        USER_ID,
        ticket.serviceCharge.amount,
        true,
        connection,
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  await createPawningTicketLogOnApprovalandLoanDisbursement(
    ticket.ticketId,
    ticket.ticketId,
    "APPROVE-TICKET",
    "Ticket approved (demo seed)",
    USER_ID,
  );

  await createPawningTicketLogOnApprovalandLoanDisbursement(
    ticket.ticketId,
    ticket.ticketId,
    "LOAN-DISBURSEMENT",
    "Ticket activated and loan disbursed (demo seed)",
    USER_ID,
  );
}

async function seedTickets(productIds, articleTypes) {
  const [[{ maxSeq }]] = await pool.query(
    "SELECT COALESCE(MAX(idPawning_Ticket), 0) AS maxSeq FROM pawning_ticket",
  );

  const results = [];
  let seq = Number(maxSeq);

  for (const definition of TICKETS) {
    const [existing] = await pool.query(
      "SELECT idPawning_Ticket, Ticket_No FROM pawning_ticket WHERE Branch_idBranch = ? AND Ticket_No LIKE ?",
      [BRANCH_ID, `${DEMO_TAG}-%-${definition.ref}`],
    );
    if (existing.length > 0) {
      console.log(
        `  = ${definition.ref} (already exists as ${existing[0].Ticket_No})`,
      );
      continue;
    }

    seq += 1;
    const connection = await pool.getConnection();
    let ticket;
    try {
      await connection.beginTransaction();
      ticket = await createDemoTicket(
        connection,
        definition,
        productIds[definition.product],
        articleTypes,
        seq,
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw new Error(`Failed creating ticket ${definition.ref}: ${error.message}`);
    } finally {
      connection.release();
    }

    await writeTicketLifecycleLogs(ticket, definition);

    results.push({ definition, ticket });
    console.log(
      `  + ${ticket.ticketNo} | ${definition.product} | granted ${toDateStr(
        ticket.grantDate,
      )} | matures ${toDateStr(ticket.maturityDate)} | interest from ${
        ticket.interestApplyOn
      } | advance ${definition.advance}`,
    );
  }

  return results;
}

// ─────────────────────────────────────────────────────────────

async function main() {
  console.log(
    `Seeding demo data for company ${COMPANY_ID}, branch ${BRANCH_ID}, customer ${CUSTOMER_ID}\n`,
  );

  if (RESET) await resetDemoData();

  console.log("Article types (Account Center):");
  const articleTypes = await ensureArticleTypes();
  console.log(
    `  ${Object.keys(articleTypes).length} type(s) ready: ${Object.keys(
      articleTypes,
    ).join(", ")}\n`,
  );

  console.log("Pawning products:");
  const productIds = await seedProducts();

  console.log("\nPawning tickets:");
  await seedTickets(productIds, articleTypes);

  console.log(
    "\nDone. Run `node scripts/run_daily_ticket_job.mjs` to accrue interest and penalties.",
  );
}

main()
  .catch((error) => {
    console.error("\nSeeding failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
    await pool2.end();
  });
