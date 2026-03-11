import { pool } from "../utils/db.js";
import { createCustomerLogOnTicketPenality } from "./customer.logs.js";
import { pawningPaymentsApi } from "../api/accountCenterApi.js";

// Helper: record accounting entries for accrued interest
const recordInterestAccountingEntries = async (
  ticket,
  interestAmount,
  note,
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
      await pawningPaymentsApi.ticketInterestDoubleEntries(data, null);
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
export const createPawningTicketLogOnApprovalandLoanDisbursement = async (
  ticketId,
  typeId,
  type,
  description,
  userId,
) => {
  try {
    // get the lastest ticket log
    const [latestLogResult] = await pool.query(
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

    const [result] = await pool.query(
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

const getDailyInterestDivisor = (duration) => {
  const map = { perDay: 1, perWeek: 7, perMonth: 30, perYear: 365 };
  return map[duration] || 30;
};

const getLatestLog = async (ticketId) => {
  const [rows] = await pool.query(
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
) => {
  const newInterest = balances.interest + interestDelta;
  const newLate = balances.late + lateDelta;
  const total =
    balances.advance +
    newInterest +
    balances.service +
    newLate +
    balances.additional;

  await pool.query(
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
) => {
  const daysSinceCreation = daysBetween(today, ticketStartDate);
  const oneTimeStages = stages.slice(0, -1);
  const lastStage = stages[stages.length - 1];

  // ── One-time interest for stages 1 … N-1 ──────────────────
  for (const stage of oneTimeStages) {
    if (daysSinceCreation < stage.startDay) continue;

    const [existing] = await pool.query(
      "SELECT 1 FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'INTEREST' AND Description LIKE ?",
      [ticketId, `%Stage ${stage.num}%`],
    );
    if (existing.length > 0) continue;

    const stageDate = new Date(ticketStartDate);
    stageDate.setDate(stageDate.getDate() + stage.startDay);
    const stageDateStr = stageDate.toISOString().split("T")[0];

    const log = await getLatestLog(ticketId);
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
    );
    await recordInterestAccountingEntries(
      ticket,
      interestAmount,
      `${description} interest accrual`,
    );
  }

  // ── Daily interest for last stage ─────────────────────────
  if (daysSinceCreation < lastStage.startDay) return;

  const lastStageStartDate = new Date(ticketStartDate);
  lastStageStartDate.setDate(lastStageStartDate.getDate() + lastStage.startDay);

  // Find where to resume from
  const [lastDailyLog] = await pool.query(
    "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'INTEREST' AND Description LIKE ? ORDER BY idTicket_Log DESC LIMIT 1",
    [ticketId, `%Stage ${lastStage.num}%`],
  );

  let startDate = new Date(lastStageStartDate);
  if (lastDailyLog.length > 0) {
    const lastDate = toStartOfDay(lastDailyLog[0].Description.split(" - ")[0]);
    startDate = new Date(lastDate);
    startDate.setDate(startDate.getDate() + 1);
  }

  const divisor = getDailyInterestDivisor(ticket.Interest_Rate_Duration);
  const dailyRate = lastStage.rate / divisor;

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const log = await getLatestLog(ticketId);
    const balances = buildBalancesFromLog(log);
    const interestAmount = (balances.advance * dailyRate) / 100;
    const description = `${dateStr} - Stage ${lastStage.num}`;

    await insertTicketLog(
      ticketId,
      "INTEREST",
      description,
      interestAmount,
      balances,
      interestAmount,
    );
    await recordInterestAccountingEntries(
      ticket,
      interestAmount,
      `${description} interest accrual`,
    );
  }
};

// ─────────────────────────────────────────────────────────────
// INTEREST — ORIGINAL (NO STAGES)
// ─────────────────────────────────────────────────────────────

const processOriginalInterest = async (ticket, ticketId, today) => {
  const interestApplyOn = toStartOfDay(ticket.Interest_apply_on);
  const divisor = getDailyInterestDivisor(ticket.Interest_Rate_Duration);
  const dailyRate = (parseFloat(ticket.Interest_Rate) || 0) / divisor;

  // Find where to resume from
  const [lastLog] = await pool.query(
    "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND (Type = 'INTEREST' OR Type = 'PENALTY') ORDER BY idTicket_Log DESC LIMIT 1",
    [ticketId],
  );

  let startDate = new Date(interestApplyOn);
  if (lastLog.length > 0) {
    const lastDate = toStartOfDay(lastLog[0].Description);
    startDate = new Date(lastDate);
    startDate.setDate(startDate.getDate() + 1);
  }

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    if (d < interestApplyOn) continue;

    const dateStr = d.toISOString().split("T")[0];

    const [existing] = await pool.query(
      "SELECT 1 FROM ticket_log WHERE Description = ? AND Type = 'INTEREST' AND Pawning_Ticket_idPawning_Ticket = ?",
      [dateStr, ticketId],
    );
    if (existing.length > 0) continue;

    const log = await getLatestLog(ticketId);
    const balances = buildBalancesFromLog(log);
    const interestAmount = (balances.advance * dailyRate) / 100;

    await insertTicketLog(
      ticketId,
      "INTEREST",
      dateStr,
      interestAmount,
      balances,
      interestAmount,
    );
    await recordInterestAccountingEntries(
      ticket,
      interestAmount,
      `${dateStr} interest accrual`,
    );
  }
};

// ─────────────────────────────────────────────────────────────
// PENALTY — STAGE-BASED (shared by both interest paths)
// ─────────────────────────────────────────────────────────────

const processLateChargeStages = async (
  ticket,
  ticketId,
  today,
  maturityDate,
) => {
  const numberOfStages = parseFloat(ticket.numberOfLateChargeStages) || 0;
  if (numberOfStages < 2) return false; // not enough stages configured

  const stages = buildStages(ticket, numberOfStages, "lateChargeStage");
  const oneTimeStages = stages.slice(0, -1);
  const lastStage = stages[stages.length - 1];
  const daysSinceMaturity = daysBetween(today, maturityDate);

  let penaltyInserted = false;

  // ── One-time penalties for stages 1 … N-1 ─────────────────
  // Stage 1 startDay is always 0 → fires on first day after maturity
  for (const stage of oneTimeStages) {
    if (daysSinceMaturity < stage.startDay) continue;

    const [existing] = await pool.query(
      "SELECT 1 FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'PENALTY' AND Description LIKE ?",
      [ticketId, `%Late Charge Stage ${stage.num}%`],
    );
    if (existing.length > 0) continue;

    const stageDate = new Date(maturityDate);
    stageDate.setDate(stageDate.getDate() + stage.startDay);
    const stageDateStr = stageDate.toISOString().split("T")[0];

    const log = await getLatestLog(ticketId);
    const balances = buildBalancesFromLog(log);
    const penaltyAmount = (balances.advance * stage.rate) / 100;
    const description = `${stageDateStr} - Late Charge Stage ${stage.num}`;

    await createCustomerLogOnTicketPenality(
      "TICKET PENALTY",
      `Penalty of ${penaltyAmount} added to ticket ID ${ticketId} on ${stageDateStr} (Late Charge Stage ${stage.num})`,
      ticket.Customer_idCustomer,
      null,
    );
    await insertTicketLog(
      ticketId,
      "PENALTY",
      description,
      penaltyAmount,
      balances,
      0,
      penaltyAmount,
    );
    await recordPenaltyAccountingEntries(
      ticket,
      penaltyAmount,
      `${description} penalty accrual`,
    );

    penaltyInserted = true;
  }

  // ── Daily penalty for last stage ──────────────────────────
  if (daysSinceMaturity < lastStage.startDay) return penaltyInserted;

  const lastStageStartDate = new Date(maturityDate);
  lastStageStartDate.setDate(lastStageStartDate.getDate() + lastStage.startDay);

  // Find where to resume from
  const [lastDailyLog] = await pool.query(
    "SELECT Description FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'PENALTY' AND Description LIKE ? ORDER BY idTicket_Log DESC LIMIT 1",
    [ticketId, `%Late Charge Stage ${lastStage.num}%`],
  );

  let startDate = new Date(lastStageStartDate);
  if (lastDailyLog.length > 0) {
    const lastDate = toStartOfDay(lastDailyLog[0].Description.split(" - ")[0]);
    startDate = new Date(lastDate);
    startDate.setDate(startDate.getDate() + 1);
  }

  // ✅ lastStage.rate is already a daily rate — no division needed
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const log = await getLatestLog(ticketId);
    const balances = buildBalancesFromLog(log);
    const penaltyAmount = (balances.advance * lastStage.rate) / 100;
    const description = `${dateStr} - Late Charge Stage ${lastStage.num}`;

    await createCustomerLogOnTicketPenality(
      "TICKET PENALTY",
      `Penalty of ${penaltyAmount} added to ticket ID ${ticketId} on ${dateStr}`,
      ticket.Customer_idCustomer,
      null,
    );
    await insertTicketLog(
      ticketId,
      "PENALTY",
      description,
      penaltyAmount,
      balances,
      0,
      penaltyAmount,
    );
    await recordPenaltyAccountingEntries(
      ticket,
      penaltyAmount,
      `${description} penalty accrual`,
    );

    penaltyInserted = true;
  }

  return penaltyInserted;
};

// ─────────────────────────────────────────────────────────────
// MAIN ENTRY POINT
// ─────────────────────────────────────────────────────────────

export const addDailyTicketLog = async () => {
  try {
    const [activeTickets] = await pool.query(
      "SELECT * FROM pawning_ticket WHERE Status = '1'",
    );

    for (const ticket of activeTickets) {
      const ticketId = ticket.idPawning_Ticket;
      const today = toStartOfDay(new Date());
      const maturityDate = toStartOfDay(ticket.Maturity_date);
      const noOfStages = parseFloat(ticket.noOfStages) || 0;
      const hasStages = noOfStages >= 2;

      // ── STEP 1: Process interest ───────────────────────────
      if (hasStages) {
        const ticketStartDate = toStartOfDay(ticket.Date_Time);
        const stages = buildStages(ticket, noOfStages, "stage");
        await processStageInterest(
          ticket,
          ticketId,
          today,
          ticketStartDate,
          stages,
        );
      } else {
        await processOriginalInterest(ticket, ticketId, today);
      }

      // ── STEP 2: Process late charge penalties (post maturity) ──
      if (today > maturityDate) {
        const [existingPenaltyCheck] = await pool.query(
          "SELECT 1 FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = 'PENALTY' LIMIT 1",
          [ticketId],
        );
        const hadPenaltyBefore = existingPenaltyCheck.length > 0;

        const penaltyInserted = await processLateChargeStages(
          ticket,
          ticketId,
          today,
          maturityDate,
        );

        // Flip status to overdue only on the very first penalty ever inserted
        if (!hadPenaltyBefore && penaltyInserted && ticket.Status !== "3") {
          await pool.query(
            "UPDATE pawning_ticket SET Status = '3' WHERE idPawning_Ticket = ?",
            [ticketId],
          );
        }
      }
    }
  } catch (error) {
    console.error("Error adding daily ticket log:", error);
    throw new Error("Error adding daily ticket log");
  }
};
