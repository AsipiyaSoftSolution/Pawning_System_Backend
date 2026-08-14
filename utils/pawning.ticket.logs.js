import { pool } from "../utils/db.js";
import { createCustomerLogOnTicketPenality } from "./customer.logs.js";
import { pawningPaymentsApi } from "../api/accountCenterApi.js";

// Helper: record accounting entries for accrued interest
const recordInterestAccountingEntries = async (
  ticket,
  interestAmount,
  note,
  accessToken = null,
) => {
  if (!interestAmount || interestAmount <= 0) return;

  const branchId = ticket?.Branch_idBranch;
  if (!branchId) return;

  try {
    const ticketLabel = ticket?.Ticket_No
      ? `Ticket No: ${ticket.Ticket_No}`
      : `Ticket ID: ${ticket.idPawning_Ticket}`;
    const descriptionText =
      note || `Interest accrued for ${ticketLabel} (Daily process)`;

    const data = {
      branchId: branchId,
      interestAmount: interestAmount,
      description: descriptionText,
    };
    try {
      await pawningPaymentsApi.ticketInterestDoubleEntries(data, accessToken);
    } catch (error) {
      console.error("Failed to record interest accounting entries:", error);
      throw error;
    }
  } catch (err) {
    console.error("Failed to record interest accounting entries:", err);
    throw err;
  }
};

// Helper: record accounting entries for accrued penalties/overdue charges
const recordPenaltyAccountingEntries = async (ticket, penaltyAmount, note) => {
  if (!penaltyAmount || penaltyAmount <= 0) return;

  const branchId = ticket?.Branch_idBranch;
  if (!branchId) return;

  try {
    const ticketLabel = ticket?.Ticket_No
      ? `Ticket No: ${ticket.Ticket_No}`
      : `Ticket ID: ${ticket.idPawning_Ticket}`;
    const descriptionText =
      note || `Penalty accrued for ${ticketLabel} (Daily process)`;

    try {
      const data = {
        branchId: branchId,
        penaltyAmount: penaltyAmount,
        description: descriptionText,
      };
      try {
        await pawningPaymentsApi.ticketPenaltyDoubleEntries(data, null);
      } catch (error) {
        console.error("Failed to record penalty accounting entries:", error);
        throw error;
      }
    } catch (err) {
      console.error("Failed to record penalty accounting entries:", err);
      throw err;
    }
  } catch (err) {
    console.error("Failed to record penalty accounting entries:", err);
    throw err;
  }
};

// this runs when a new pawning ticket is created
export const createPawningTicketLogOnCreate = async (
  ticketId,
  type,
  userId,
  amount,
) => {
  try {
    const [result] = await pool.query(
      `INSERT INTO ticket_log (
        Pawning_Ticket_idPawning_Ticket, Type, Type_Id, User_idUser, Date_Time,
        Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Aditional_Charge_Balance, Total_Balance, Late_Charges_Balance
      ) VALUES (?, ?, ?, ?, NOW(), ?, ?, 0, 0, 0, ?, 0)`,
      [ticketId, type, ticketId, userId, amount, amount, amount],
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to create pawning ticket log");
    }
  } catch (error) {
    console.error("Error creating pawning ticket log:", error);
    throw new Error("Error creating pawning ticket log");
  }
};

// after the above log is created, this runs in order to mark the service charge
// isPaidFromAdvance = true means service charge is deducted from pawning advance (subtract from balance) and service charge balance is reduced to 0
export const markServiceChargeInTicketLog = async (
  ticketId,
  type,
  userId,
  serviceCharge,
  isPaidFromAdvance = true,
  connection,
) => {
  // Guard: connection is required since this runs inside a transaction
  if (!connection) {
    throw new Error(
      "markServiceChargeInTicketLog: a transaction connection is required",
    );
  }

  try {
    // Get the latest log to retrieve all balances
    const [latestLogResult] = await connection.query(
      "SELECT Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
      [ticketId],
    );

    let advanceBalance = Number(latestLogResult[0]?.Advance_Balance) || 0;
    const interestBalance = Number(latestLogResult[0]?.Interest_Balance) || 0;
    const existingServiceChargeBalance =
      Number(latestLogResult[0]?.Service_Charge_Balance) || 0;
    const lateChargesBalance =
      Number(latestLogResult[0]?.Late_Charges_Balance) || 0;
    const additionalChargeBalance =
      Number(latestLogResult[0]?.Aditional_Charge_Balance) || 0;

    // If paid from advance, reduce the advance balance (clamp to 0 to avoid negative)
    advanceBalance = Math.max(0, advanceBalance - Number(serviceCharge));
    const newServiceChargeBalance = Math.max(
      0,
      existingServiceChargeBalance - Number(serviceCharge),
    );

    let totalBalance;
    // Service charge already deducted from advance, so don't add it again to total
    totalBalance =
      advanceBalance +
      interestBalance +
      lateChargesBalance +
      additionalChargeBalance;

    const [result] = await connection.query(
      "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser,Date_Time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      [
        ticketId,
        type,
        serviceCharge,
        advanceBalance,
        interestBalance,
        newServiceChargeBalance,
        lateChargesBalance,
        additionalChargeBalance,
        totalBalance,
        userId,
      ],
    );
    if (result.affectedRows === 0) {
      throw new Error("Failed to mark service charge in pawning ticket log");
    }
  } catch (error) {
    console.error("Error marking service charge in pawning ticket log:", error);
    throw error; // re-throw original error to preserve stack trace
  }
};

// Function to run on when a ticket got a new additonal charge
export const createPawningTicketLogOnAdditionalCharge = async (
  ticketId,
  type,
  userId,
  amount,
  connection,
) => {
  try {
    const [latestLogResult] = await connection.query(
      "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
      [ticketId],
    );

    const latestAdvanceBalance =
      parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
    const latestInterestBalance =
      parseFloat(latestLogResult[0]?.Interest_Balance) || 0;
    const latestServiceChargeBalance =
      parseFloat(latestLogResult[0]?.Service_Charge_Balance) || 0;
    const latestLateChargesBalance =
      parseFloat(latestLogResult[0]?.Late_Charges_Balance) || 0;
    const latestAdditionalChargeBalance =
      parseFloat(latestLogResult[0]?.Aditional_Charge_Balance) || 0;
    const newAdditionalCharge = parseFloat(amount) || 0;

    const totalBalance =
      latestAdvanceBalance +
      latestInterestBalance +
      latestServiceChargeBalance +
      latestLateChargesBalance +
      (latestAdditionalChargeBalance + newAdditionalCharge);

    const [result] = await connection.query(
      "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser, Date_Time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      [
        ticketId,
        type,
        newAdditionalCharge,
        latestAdvanceBalance,
        latestInterestBalance,
        latestServiceChargeBalance,
        latestLateChargesBalance,
        latestAdditionalChargeBalance + newAdditionalCharge,
        totalBalance,
        userId,
      ],
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to create additional charge ticket log");
    }
  } catch (error) {
    console.error("Error creating additional charge ticket log:", error);
    throw new Error("Error creating additional charge ticket log");
  }
};

// create a log when a ticket is approved
/**
 * Create a ticket log entry for ticket approval / loan disbursement events.
 *
 * Pass an optional `connection` to run this inside an existing transaction
 * (e.g. during auto-disburse on ticket creation). When omitted, the function
 * falls back to `pool.query` (autocommit) for backward compatibility with
 * existing callers like manual approval / activation.
 */
export const createPawningTicketLogOnApprovalandLoanDisbursement = async (
  ticketId,
  typeId,
  type,
  description,
  userId,
  connection = null,
) => {
  const queryRunner = connection || pool;
  try {
    // get the lastest ticket log
    const [latestLogResult] = await queryRunner.query(
      "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
      [ticketId],
    );

    const latestAdvanceBalance =
      parseFloat(latestLogResult[0]?.Advance_Balance) || 0;
    const latestInterestBalance =
      parseFloat(latestLogResult[0]?.Interest_Balance) || 0;
    const latestServiceChargeBalance =
      parseFloat(latestLogResult[0]?.Service_Charge_Balance) || 0;
    const latestLateChargesBalance =
      parseFloat(latestLogResult[0]?.Late_Charges_Balance) || 0;
    const latestAdditionalChargeBalance =
      parseFloat(latestLogResult[0]?.Aditional_Charge_Balance) || 0;
    const latestAmount = parseFloat(latestLogResult[0]?.Amount) || 0;
    const latestTotalBalance =
      parseFloat(latestLogResult[0]?.Total_Balance) || 0;

    const [result] = await queryRunner.query(
      "INSERT INTO ticket_log (Pawning_Ticket_idPawning_Ticket, Type, Type_Id, Description, Amount, Advance_Balance, Interest_Balance, Service_Charge_Balance, Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser, Date_Time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
      [
        ticketId,
        type,
        typeId,
        description,
        type === "APPROVE-TICKET" || type === "LOAN-DISBURSEMENT"
          ? 0
          : latestAmount,
        latestAdvanceBalance,
        latestInterestBalance,
        latestServiceChargeBalance,
        latestLateChargesBalance,
        latestAdditionalChargeBalance,
        latestTotalBalance,
        userId,
      ],
    );
  } catch (error) {
    throw new Error("Error creating approval ticket log");
  }
};

// ─────────────────────────────────────────────────────────────
// HELPERS FOR DAILY TICKET LOGS (INTEREST AND PENALTY)
// ─────────────────────────────────────────────────────────────

const toStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysBetween = (dateA, dateB) =>
  Math.floor((dateA - dateB) / (1000 * 60 * 60 * 24));

// Log descriptions must use the local calendar day. toISOString() converts to
// UTC, which rolls back to the previous day for UTC+ offsets (e.g. Asia/Colombo)
// and makes the resume-from-last-log cursor re-accrue the same day on every run.
const toDateStr = (date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const getDailyInterestDivisor = (duration) => {
  const map = { perDay: 1, perWeek: 7, perMonth: 30, perYear: 365 };
  return map[duration] || 30;
};

const getLatestLog = async (ticketId, queryRunner = pool) => {
  const [rows] = await queryRunner.query(
    "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
    [ticketId],
  );
  return rows[0] || null;
};

const buildBalancesFromLog = (log) => ({
  advance: parseFloat(log?.Advance_Balance) || 0,
  interest: parseFloat(log?.Interest_Balance) || 0,
  service: parseFloat(log?.Service_Charge_Balance) || 0,
  late: parseFloat(log?.Late_Charges_Balance) || 0,
  additional: parseFloat(log?.Aditional_Charge_Balance) || 0,
});

const insertTicketLog = async (
  ticketId,
  type,
  description,
  amount,
  balances,
  interestDelta = 0,
  lateDelta = 0,
  queryRunner = pool,
) => {
  const newInterest = balances.interest + interestDelta;
  const newLate = balances.late + lateDelta;
  const total =
    balances.advance +
    newInterest +
    balances.service +
    newLate +
    balances.additional;

  await queryRunner.query(
    `INSERT INTO ticket_log
      (Pawning_Ticket_idPawning_Ticket, Type, Description, Amount,
       Advance_Balance, Interest_Balance, Service_Charge_Balance,
       Late_Charges_Balance, Aditional_Charge_Balance, Total_Balance, User_idUser)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ticketId,
      type,
      description,
      amount,
      balances.advance,
      newInterest,
      balances.service,
      newLate,
      balances.additional,
      total,
      null,
    ],
  );
};

const buildStages = (ticket, count, prefix) => {
  const stages = [];
  for (let i = 1; i <= count; i++) {
    stages.push({
      num: i,
      startDay: parseFloat(ticket[`${prefix}${i}StartDate`]) || 0,
      endDay: parseFloat(ticket[`${prefix}${i}EndDate`]) || 0,
      rate:
        parseFloat(
          ticket[`${prefix}${i}`] ?? // late charge  e.g. lateChargeStage1
            ticket[`${prefix}${i}Interest`],
        ) || // interest     e.g. stage1Interest
        0,
    });
  }
  return stages;
};

// ─────────────────────────────────────────────────────────────
// INTEREST — STAGE-BASED
// ─────────────────────────────────────────────────────────────

const processStageInterest = async (
  ticket,
  ticketId,
  today,
  ticketStartDate,
  stages,
  queryRunner = pool,
  accessToken = null,
) => {
  // Interest_Calculate_After grace: no interest before Interest_apply_on.
  // When that field is 0 / missing, interest may start on the grant date.
  const interestApplyOn = ticket.Interest_apply_on
    ? toStartOfDay(ticket.Interest_apply_on)
    : ticketStartDate;
  if (today < interestApplyOn) return;

  const daysSinceCreation = daysBetween(today, ticketStartDate);
  const oneTimeStages = stages.slice(0, -1);
  const lastStage = stages[stages.length - 1];

  // ── One-time interest for stages 1 … N-1 ──────────────────
  for (const stage of oneTimeStages) {
    if (daysSinceCreation < stage.startDay) continue;

    const stageDate = new Date(ticketStartDate);
    stageDate.setDate(stageDate.getDate() + stage.startDay);
    // Skip stage charges that fall inside the grace period.
    if (toStartOfDay(stageDate) < interestApplyOn) continue;

    const [existing] = await queryRunner.query(
      "SELECT 1 FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'INTEREST' AND Description LIKE ?",
      [ticketId, `%Stage ${stage.num}%`],
    );
    if (existing.length > 0) continue;

    const stageDateStr = toDateStr(stageDate);

    const log = await getLatestLog(ticketId, queryRunner);
    const balances = buildBalancesFromLog(log);
    const interestAmount = (balances.advance * stage.rate) / 100;
    const description = `${stageDateStr} - Stage ${stage.num}`;

    await insertTicketLog(
      ticketId,
      "INTEREST",
      description,
      interestAmount,
      balances,
      interestAmount,
      0,
      queryRunner,
    );
    await recordInterestAccountingEntries(
      ticket,
      interestAmount,
      `${description} interest accrual`,
      accessToken,
    );
  }

  // ── Daily interest for last stage ─────────────────────────
  if (daysSinceCreation < lastStage.startDay) return;

  const lastStageStartDate = new Date(ticketStartDate);
  lastStageStartDate.setDate(lastStageStartDate.getDate() + lastStage.startDay);

  // Find where to resume from
  const [lastDailyLog] = await queryRunner.query(
    "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'INTEREST' AND Description LIKE ? ORDER BY idTicket_Log DESC LIMIT 1",
    [ticketId, `%Stage ${lastStage.num}%`],
  );

  let startDate = new Date(lastStageStartDate);
  if (lastDailyLog.length > 0) {
    const lastDate = toStartOfDay(lastDailyLog[0].Description.split(" - ")[0]);
    startDate = new Date(lastDate);
    startDate.setDate(startDate.getDate() + 1);
  }
  if (startDate < interestApplyOn) {
    startDate = new Date(interestApplyOn);
  }

  const divisor = getDailyInterestDivisor(ticket.Interest_Rate_Duration);
  const dailyRate = lastStage.rate / divisor;

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    if (d < interestApplyOn) continue;

    const dateStr = toDateStr(d);
    const description = `${dateStr} - Stage ${lastStage.num}`;

    const [existing] = await queryRunner.query(
      "SELECT 1 FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'INTEREST' AND Description = ?",
      [ticketId, description],
    );
    if (existing.length > 0) continue;

    const log = await getLatestLog(ticketId, queryRunner);
    const balances = buildBalancesFromLog(log);
    const interestAmount = (balances.advance * dailyRate) / 100;

    await insertTicketLog(
      ticketId,
      "INTEREST",
      description,
      interestAmount,
      balances,
      interestAmount,
      0,
      queryRunner,
    );
    await recordInterestAccountingEntries(
      ticket,
      interestAmount,
      `${description} interest accrual`,
      accessToken,
    );
  }
};

// ─────────────────────────────────────────────────────────────
// INTEREST — ORIGINAL (NO STAGES)
// ─────────────────────────────────────────────────────────────

const processOriginalInterest = async (
  ticket,
  ticketId,
  today,
  queryRunner = pool,
  accessToken = null,
) => {
  const interestApplyOn = toStartOfDay(
    ticket.Interest_apply_on || ticket.Date_Time || new Date(),
  );
  if (Number.isNaN(interestApplyOn.getTime())) return;
  if (today < interestApplyOn) return;

  const divisor = getDailyInterestDivisor(ticket.Interest_Rate_Duration);
  const dailyRate = (parseFloat(ticket.Interest_Rate) || 0) / divisor;

  // Find where to resume from
  const [lastLog] = await queryRunner.query(
    "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND (Type = 'INTEREST' OR Type = 'PENALTY') ORDER BY idTicket_Log DESC LIMIT 1",
    [ticketId],
  );

  let startDate = new Date(interestApplyOn);
  if (lastLog.length > 0) {
    const lastDate = toStartOfDay(lastLog[0].Description);
    if (!Number.isNaN(lastDate.getTime())) {
      startDate = new Date(lastDate);
      startDate.setDate(startDate.getDate() + 1);
    }
  }
  if (startDate < interestApplyOn) {
    startDate = new Date(interestApplyOn);
  }

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    if (d < interestApplyOn) continue;

    const dateStr = toDateStr(d);

    const [existing] = await queryRunner.query(
      "SELECT 1 FROM ticket_log WHERE Description = ? AND Type = 'INTEREST' AND Pawning_Ticket_idPawning_Ticket = ?",
      [dateStr, ticketId],
    );
    if (existing.length > 0) continue;

    const log = await getLatestLog(ticketId, queryRunner);
    const balances = buildBalancesFromLog(log);
    const interestAmount = (balances.advance * dailyRate) / 100;

    await insertTicketLog(
      ticketId,
      "INTEREST",
      dateStr,
      interestAmount,
      balances,
      interestAmount,
      0,
      queryRunner,
    );
    await recordInterestAccountingEntries(
      ticket,
      interestAmount,
      `${dateStr} interest accrual`,
      accessToken,
    );
  }
};

// ─────────────────────────────────────────────────────────────
// PENALTY — STAGE-BASED (shared by both interest paths)
// ─────────────────────────────────────────────────────────────

/**
 * Resolve the late charge stages to accrue for a ticket.
 * A single configured stage, or a product with a flat (non-staged) late charge
 * percentage, both become one stage that accrues daily from the maturity date.
 */
const resolveLateChargeStages = (ticket) => {
  const numberOfStages = parseFloat(ticket.numberOfLateChargeStages) || 0;
  if (numberOfStages >= 1) {
    return buildStages(ticket, numberOfStages, "lateChargeStage");
  }

  const flatRate = parseFloat(ticket.Late_charge_Presentage) || 0;
  if (flatRate <= 0) return [];
  return [{ num: 1, startDay: 0, endDay: 0, rate: flatRate }];
};

const hydrateTicketLateChargeFromProduct = async (ticket, queryRunner) => {
  const stages = parseFloat(ticket.numberOfLateChargeStages) || 0;
  const flat = parseFloat(ticket.Late_charge_Presentage) || 0;
  if (stages >= 1 || flat > 0) return ticket;

  const productId = ticket.Pawning_Product_idPawning_Product;
  if (!productId) return ticket;

  const [products] = await queryRunner.query(
    `SELECT Late_Charge_Create_As, Late_Charge_Status, Late_Charge,
            lateChargeStage1, lateChargeStage2, lateChargeStage3, lateChargeStage4,
            lateChargeStage1StartDate, lateChargeStage2StartDate,
            lateChargeStage3StartDate, lateChargeStage4StartDate,
            lateChargeStage1EndDate, lateChargeStage2EndDate,
            lateChargeStage3EndDate, lateChargeStage4EndDate,
            numberOfLateChargeStages
     FROM pawning_product WHERE idPawning_Product = ? LIMIT 1`,
    [productId],
  );
  const product = products[0];
  if (!product) return ticket;
  if (
    String(product.Late_Charge_Status ?? "0") !== "1" ||
    product.Late_Charge_Create_As === "inactive" ||
    !product.Late_Charge_Create_As
  ) {
    return ticket;
  }

  let source = product;
  if (product.Late_Charge_Create_As === "Charge For Product Item") {
    const [plans] = await queryRunner.query(
      `SELECT Late_Charge, numberOfLateChargeStages,
              lateChargeStage1, lateChargeStage2, lateChargeStage3, lateChargeStage4,
              lateChargeStage1StartDate, lateChargeStage2StartDate,
              lateChargeStage3StartDate, lateChargeStage4StartDate,
              lateChargeStage1EndDate, lateChargeStage2EndDate,
              lateChargeStage3EndDate, lateChargeStage4EndDate
       FROM product_plan
       WHERE Pawning_Product_idPawning_Product = ?
       ORDER BY idProduct_Plan ASC LIMIT 1`,
      [productId],
    );
    if (plans[0]) source = plans[0];
  }

  const nStages = parseInt(source.numberOfLateChargeStages, 10) || 0;
  ticket.numberOfLateChargeStages = nStages;
  ticket.Late_charge_Presentage =
    nStages < 1
      ? parseFloat(source.Late_Charge) || parseFloat(product.Late_Charge) || 0
      : 0;
  for (let i = 1; i <= 4; i++) {
    ticket[`lateChargeStage${i}`] = parseFloat(source[`lateChargeStage${i}`]) || 0;
    ticket[`lateChargeStage${i}StartDate`] =
      source[`lateChargeStage${i}StartDate`] ?? null;
    ticket[`lateChargeStage${i}EndDate`] =
      source[`lateChargeStage${i}EndDate`] ?? null;
  }

  await queryRunner.query(
    `UPDATE pawning_ticket SET
       Late_charge_Presentage = ?, numberOfLateChargeStages = ?,
       lateChargeStage1 = ?, lateChargeStage2 = ?, lateChargeStage3 = ?, lateChargeStage4 = ?,
       lateChargeStage1StartDate = ?, lateChargeStage2StartDate = ?,
       lateChargeStage3StartDate = ?, lateChargeStage4StartDate = ?,
       lateChargeStage1EndDate = ?, lateChargeStage2EndDate = ?,
       lateChargeStage3EndDate = ?, lateChargeStage4EndDate = ?
     WHERE idPawning_Ticket = ?`,
    [
      ticket.Late_charge_Presentage,
      ticket.numberOfLateChargeStages,
      ticket.lateChargeStage1,
      ticket.lateChargeStage2,
      ticket.lateChargeStage3,
      ticket.lateChargeStage4,
      ticket.lateChargeStage1StartDate,
      ticket.lateChargeStage2StartDate,
      ticket.lateChargeStage3StartDate,
      ticket.lateChargeStage4StartDate,
      ticket.lateChargeStage1EndDate,
      ticket.lateChargeStage2EndDate,
      ticket.lateChargeStage3EndDate,
      ticket.lateChargeStage4EndDate,
      ticket.idPawning_Ticket,
    ],
  );
  return ticket;
};

const processLateChargeStages = async (
  ticket,
  ticketId,
  today,
  maturityDate,
  queryRunner = pool,
  options = {},
) => {
  const stages = resolveLateChargeStages(ticket);
  if (stages.length === 0) return { inserted: false, amount: 0 };

  const skipAccounting = options.skipAccounting === true;
  const skipCustomerLogs = options.skipCustomerLogs === true;
  const oneTimeStages = stages.slice(0, -1);
  const lastStage = stages[stages.length - 1];
  const daysSinceMaturity = daysBetween(today, maturityDate);

  let penaltyInserted = false;
  let penaltyAmountTotal = 0;

  // ── One-time penalties for stages 1 … N-1 ─────────────────
  // Stage 1 startDay is always 0 → fires on first day after maturity
  for (const stage of oneTimeStages) {
    if (daysSinceMaturity < stage.startDay) continue;
    if (!(stage.rate > 0)) continue;

    const [existing] = await queryRunner.query(
      "SELECT 1 FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'PENALTY' AND Description LIKE ?",
      [ticketId, `%Late Charge Stage ${stage.num}%`],
    );
    if (existing.length > 0) continue;

    const stageDate = new Date(maturityDate);
    stageDate.setDate(stageDate.getDate() + stage.startDay);
    const stageDateStr = toDateStr(stageDate);

    const log = await getLatestLog(ticketId, queryRunner);
    const balances = buildBalancesFromLog(log);
    const penaltyAmount = (balances.advance * stage.rate) / 100;
    const description = `${stageDateStr} - Late Charge Stage ${stage.num}`;

    if (!skipCustomerLogs) {
      await createCustomerLogOnTicketPenality(
        "TICKET PENALTY",
        `Penalty of ${penaltyAmount} added to ticket ID ${ticketId} on ${stageDateStr} (Late Charge Stage ${stage.num})`,
        ticket.Customer_idCustomer,
        null,
        {
          ticketId,
          branchId: ticket.Branch_idBranch,
        },
      );
    }
    await insertTicketLog(
      ticketId,
      "PENALTY",
      description,
      penaltyAmount,
      balances,
      0,
      penaltyAmount,
      queryRunner,
    );
    if (!skipAccounting) {
      await recordPenaltyAccountingEntries(
        ticket,
        penaltyAmount,
        `${description} penalty accrual`,
      );
    }

    penaltyInserted = true;
    penaltyAmountTotal += penaltyAmount;
  }

  // ── Daily penalty for last stage ──────────────────────────
  if (daysSinceMaturity < lastStage.startDay) {
    return { inserted: penaltyInserted, amount: penaltyAmountTotal };
  }
  if (!(lastStage.rate > 0)) {
    return { inserted: penaltyInserted, amount: penaltyAmountTotal };
  }

  const lastStageStartDate = new Date(maturityDate);
  lastStageStartDate.setDate(lastStageStartDate.getDate() + lastStage.startDay);

  // Find where to resume from
  const [lastDailyLog] = await queryRunner.query(
    "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'PENALTY' AND Description LIKE ? ORDER BY idTicket_Log DESC LIMIT 1",
    [ticketId, `%Late Charge Stage ${lastStage.num}%`],
  );

  let startDate = new Date(lastStageStartDate);
  if (lastDailyLog.length > 0) {
    const lastDate = toStartOfDay(lastDailyLog[0].Description.split(" - ")[0]);
    startDate = new Date(lastDate);
    startDate.setDate(startDate.getDate() + 1);
  }

  // lastStage.rate is already a daily rate — no division needed
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = toDateStr(d);
    const description = `${dateStr} - Late Charge Stage ${lastStage.num}`;

    const [existing] = await queryRunner.query(
      "SELECT 1 FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'PENALTY' AND Description = ?",
      [ticketId, description],
    );
    if (existing.length > 0) continue;

    const log = await getLatestLog(ticketId, queryRunner);
    const balances = buildBalancesFromLog(log);
    const penaltyAmount = (balances.advance * lastStage.rate) / 100;

    if (!skipCustomerLogs) {
      await createCustomerLogOnTicketPenality(
        "TICKET PENALTY",
        `Penalty of ${penaltyAmount} added to ticket ID ${ticketId} on ${dateStr}`,
        ticket.Customer_idCustomer,
        null,
        {
          ticketId,
          branchId: ticket.Branch_idBranch,
        },
      );
    }
    await insertTicketLog(
      ticketId,
      "PENALTY",
      description,
      penaltyAmount,
      balances,
      0,
      penaltyAmount,
      queryRunner,
    );
    if (!skipAccounting) {
      await recordPenaltyAccountingEntries(
        ticket,
        penaltyAmount,
        `${description} penalty accrual`,
      );
    }

    penaltyInserted = true;
    penaltyAmountTotal += penaltyAmount;
  }

  return { inserted: penaltyInserted, amount: penaltyAmountTotal };
};

// ─────────────────────────────────────────────────────────────
// INTEREST ON APPROVAL (same-day settle before daily job runs)
// ─────────────────────────────────────────────────────────────

/**
 * Apply interest ticket_log entries up to today for one ticket.
 * Used on approval (and auto-approve on create) so interest is accrued
 * when Interest_apply_on is the same day as creation — the daily job
 * only processes tickets with Status = '1'.
 */
export const applyTicketInterestLogsOnApproval = async (
  ticketId,
  connection = null,
  accessToken = null,
) => {
  const queryRunner = connection || pool;
  const [rows] = await queryRunner.query(
    "SELECT * FROM pawning_ticket WHERE idPawning_Ticket = ?",
    [ticketId],
  );
  if (rows.length === 0) {
    throw new Error("Ticket not found for interest accrual");
  }

  const ticket = rows[0];
  const today = toStartOfDay(new Date());
  const noOfStages = parseFloat(ticket.noOfStages) || 0;
  const hasStages = noOfStages >= 2;

  if (hasStages) {
    const ticketStartDate = toStartOfDay(ticket.Date_Time);
    const stages = buildStages(ticket, noOfStages, "stage");
    await processStageInterest(
      ticket,
      ticketId,
      today,
      ticketStartDate,
      stages,
      queryRunner,
      accessToken,
    );
  } else {
    await processOriginalInterest(
      ticket,
      ticketId,
      today,
      queryRunner,
      accessToken,
    );
  }
};

/**
 * Accrue interest (to today) and late-charge penalties (after maturity)
 * for one Active or Overdue ticket. Idempotent via ticket_log descriptions.
 */
export const accrueTicketInterestAndPenalty = async (
  ticketId,
  options = {},
) => {
  const queryRunner = options.queryRunner || pool;
  const skipAccounting = options.skipAccounting === true;
  const skipCustomerLogs = options.skipCustomerLogs === true;

  const [rows] = await queryRunner.query(
    "SELECT * FROM pawning_ticket WHERE idPawning_Ticket = ?",
    [ticketId],
  );
  if (rows.length === 0) {
    return { skipped: true, reason: "not_found" };
  }

  const ticketRow = rows[0];
  const status = String(ticketRow.Status ?? "");
  if (status !== "1" && status !== "3") {
    return { skipped: true, reason: "status" };
  }

  const ticket = await hydrateTicketLateChargeFromProduct(
    ticketRow,
    queryRunner,
  );

  const [[mat]] = await queryRunner.query(
    `SELECT DATEDIFF(CURDATE(), DATE(Maturity_date)) AS daysPast,
            DATE_FORMAT(DATE(Maturity_date), '%Y-%m-%d') AS matYmd,
            DATE_FORMAT(DATE(Date_Time), '%Y-%m-%d') AS startYmd,
            DATE_FORMAT(DATE(COALESCE(Interest_apply_on, Date_Time)), '%Y-%m-%d') AS applyYmd
     FROM pawning_ticket WHERE idPawning_Ticket = ?`,
    [ticketId],
  );
  const todayYmd = toDateStr(new Date());
  const startYmd = mat?.startYmd || toDateStr(ticket.Date_Time);
  const applyYmd =
    mat?.applyYmd && /^\d{4}-\d{2}-\d{2}$/.test(mat.applyYmd)
      ? mat.applyYmd
      : startYmd;
  const maturityDate = mat?.matYmd
    ? toStartOfDay(`${mat.matYmd}T00:00:00`)
    : toStartOfDay(ticket.Maturity_date);
  const pastMaturity = Number(mat?.daysPast) > 0;
  const noOfStages = parseFloat(ticket.noOfStages) || 0;
  const hasStages = noOfStages >= 2;
  const accessToken = options.accessToken || null;
  const ticketStartDate = toStartOfDay(ticket.Date_Time);
  const stages = hasStages ? buildStages(ticket, noOfStages, "stage") : [];

  const fromYmd = applyYmd < startYmd ? applyYmd : startYmd;
  const [hadPenaltyBeforeRows] = await queryRunner.query(
    "SELECT 1 FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'PENALTY' LIMIT 1",
    [ticketId],
  );
  const hadPenaltyBefore = hadPenaltyBeforeRows.length > 0;

  let penalty = { inserted: false, amount: 0 };
  const cursor = toStartOfDay(`${fromYmd}T00:00:00`);
  const lastDay = toStartOfDay(`${todayYmd}T00:00:00`);
  for (let d = new Date(cursor); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const dayEnd = toStartOfDay(d);
    if (hasStages) {
      await processStageInterest(
        ticket,
        ticketId,
        dayEnd,
        ticketStartDate,
        stages,
        queryRunner,
        skipAccounting ? null : accessToken,
      );
    } else {
      await processOriginalInterest(
        ticket,
        ticketId,
        dayEnd,
        queryRunner,
        skipAccounting ? null : accessToken,
      );
    }

    if (pastMaturity && dayEnd >= maturityDate) {
      const dayPenalty = await processLateChargeStages(
        ticket,
        ticketId,
        dayEnd,
        maturityDate,
        queryRunner,
        { skipAccounting, skipCustomerLogs },
      );
      if (dayPenalty.inserted) {
        penalty.inserted = true;
        penalty.amount += dayPenalty.amount || 0;
      }
    }
  }

  if (penalty.inserted && !hadPenaltyBefore && status !== "3") {
    await queryRunner.query(
      "UPDATE pawning_ticket SET Status = '3' WHERE idPawning_Ticket = ?",
      [ticketId],
    );
  }

  const latest = await getLatestLog(ticketId, queryRunner);
  return {
    skipped: false,
    penaltyInserted: penalty.inserted,
    penaltyAmount: penalty.amount,
    lateBalance: parseFloat(latest?.Late_Charges_Balance) || 0,
    interestBalance: parseFloat(latest?.Interest_Balance) || 0,
    totalBalance: parseFloat(latest?.Total_Balance) || 0,
  };
};

// ─────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────

export const addDailyTicketLog = async () => {
  try {
    const [tickets] = await pool.query(
      "SELECT idPawning_Ticket FROM pawning_ticket WHERE Status IN ('1', '3')",
    );

    for (const row of tickets) {
      await accrueTicketInterestAndPenalty(row.idPawning_Ticket);
    }
  } catch (error) {
    console.error("Error adding daily ticket log:", error);
    throw new Error("Error adding daily ticket log");
  }
};
