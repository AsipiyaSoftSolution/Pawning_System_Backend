/**
 * Independently recompute what each demo ticket should have accrued and
 * compare it against what the daily job actually wrote to ticket_log.
 *
 *   node scripts/verify_demo_accruals.mjs
 *
 * The maths here is deliberately written from the product rules rather than
 * reusing pawning.ticket.logs.js, so a bug in the job shows up as a mismatch.
 */
import dotenv from "dotenv";
dotenv.config();

import { pool, pool2 } from "../utils/db.js";

const TICKET_PREFIX = "MCI-";
const TOLERANCE = 0.01;

const DIVISORS = { perDay: 1, perWeek: 7, perMonth: 30, perYear: 365 };

const startOfDay = (value) => {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysBetween = (a, b) => Math.floor((a - b) / 86400000);

const num = (value) => parseFloat(value) || 0;

/** Advance balance the accrual runs against: the balance after disbursement. */
async function openingAdvance(ticketId) {
  const [rows] = await pool.query(
    `SELECT Advance_Balance FROM ticket_log
     WHERE Pawning_Ticket_idPawning_Ticket = ?
       AND Type IN ('CREATE','SERVICE CHARGE','APPROVE-TICKET','LOAN-DISBURSEMENT')
     ORDER BY idTicket_Log DESC LIMIT 1`,
    [ticketId],
  );
  return num(rows[0]?.Advance_Balance);
}

function expectedInterest(ticket, advance, today) {
  const applyOn = startOfDay(ticket.Interest_apply_on || ticket.Date_Time);
  if (today < applyOn) return { amount: 0, entries: 0, detail: "grace period" };

  const stages = parseInt(ticket.noOfStages, 10) || 0;

  if (stages >= 2) {
    const grant = startOfDay(ticket.Date_Time);
    const divisor = DIVISORS[ticket.Interest_Rate_Duration] || 30;
    let amount = 0;
    let entries = 0;
    const parts = [];

    // Stages 1..N-1 are charged once, on the day the stage opens.
    for (let s = 1; s < stages; s += 1) {
      const startDay = num(ticket[`stage${s}StartDate`]);
      if (daysBetween(today, grant) < startDay) continue;
      const rate = num(ticket[`stage${s}Interest`]);
      const charge = (advance * rate) / 100;
      amount += charge;
      entries += 1;
      parts.push(`stage ${s} one-off ${rate}% = ${charge.toFixed(2)}`);
    }

    // The final stage accrues daily at rate / duration divisor.
    const lastStart = num(ticket[`stage${stages}StartDate`]);
    const lastRate = num(ticket[`stage${stages}Interest`]);
    const lastStartDate = new Date(grant);
    lastStartDate.setDate(lastStartDate.getDate() + lastStart);
    if (today >= lastStartDate) {
      const days = daysBetween(today, lastStartDate) + 1;
      const daily = (advance * (lastRate / divisor)) / 100;
      amount += daily * days;
      entries += days;
      parts.push(
        `stage ${stages} daily ${lastRate}%/${divisor} x ${days}d = ${(
          daily * days
        ).toFixed(2)}`,
      );
    }

    return { amount, entries, detail: parts.join(" + ") };
  }

  const divisor = DIVISORS[ticket.Interest_Rate_Duration] || 30;
  const days = daysBetween(today, applyOn) + 1;
  const daily = (advance * (num(ticket.Interest_Rate) / divisor)) / 100;
  return {
    amount: daily * days,
    entries: days,
    detail: `${ticket.Interest_Rate}%/${divisor} x ${days}d`,
  };
}

function expectedPenalty(ticket, advance, today) {
  const maturity = startOfDay(ticket.Maturity_date);
  if (today <= maturity) return { amount: 0, entries: 0, detail: "not matured" };

  const stageCount = parseInt(ticket.numberOfLateChargeStages, 10) || 0;

  if (stageCount < 1) {
    const rate = num(ticket.Late_charge_Presentage);
    if (rate <= 0) return { amount: 0, entries: 0, detail: "no late charge" };
    const days = daysBetween(today, maturity) + 1;
    const daily = (advance * rate) / 100;
    return {
      amount: daily * days,
      entries: days,
      detail: `flat ${rate}%/day x ${days}d`,
    };
  }

  let amount = 0;
  let entries = 0;
  const parts = [];

  for (let s = 1; s < stageCount; s += 1) {
    const startDay = num(ticket[`lateChargeStage${s}StartDate`]);
    if (daysBetween(today, maturity) < startDay) continue;
    const rate = num(ticket[`lateChargeStage${s}`]);
    if (rate <= 0) continue;
    const charge = (advance * rate) / 100;
    amount += charge;
    entries += 1;
    parts.push(`stage ${s} one-off ${rate}% = ${charge.toFixed(2)}`);
  }

  const lastStart = num(ticket[`lateChargeStage${stageCount}StartDate`]);
  const lastRate = num(ticket[`lateChargeStage${stageCount}`]);
  const lastStartDate = new Date(maturity);
  lastStartDate.setDate(lastStartDate.getDate() + lastStart);
  if (lastRate > 0 && today >= lastStartDate) {
    const days = daysBetween(today, lastStartDate) + 1;
    // The final late charge stage rate is already a daily rate.
    const daily = (advance * lastRate) / 100;
    amount += daily * days;
    entries += days;
    parts.push(
      `stage ${stageCount} daily ${lastRate}% x ${days}d = ${(daily * days).toFixed(2)}`,
    );
  }

  return { amount, entries, detail: parts.join(" + ") || "no late charge" };
}

async function actualTotals(ticketId, type) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS entries, COALESCE(SUM(Amount), 0) AS amount FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? AND Type = ?",
    [ticketId, type],
  );
  return { entries: Number(rows[0].entries), amount: num(rows[0].amount) };
}

async function main() {
  const today = startOfDay(new Date());
  const [tickets] = await pool.query(
    "SELECT * FROM pawning_ticket WHERE Ticket_No LIKE ? ORDER BY Ticket_No",
    [`${TICKET_PREFIX}%`],
  );

  if (tickets.length === 0) {
    console.log("No demo tickets found. Run scripts/seed_demo_company61.mjs first.");
    return;
  }

  const rows = [];
  let failures = 0;

  for (const ticket of tickets) {
    const advance = await openingAdvance(ticket.idPawning_Ticket);

    for (const [type, calculate] of [
      ["INTEREST", expectedInterest],
      ["PENALTY", expectedPenalty],
    ]) {
      const expected = calculate(ticket, advance, today);
      const actual = await actualTotals(ticket.idPawning_Ticket, type);
      if (expected.entries === 0 && actual.entries === 0) continue;

      const ok =
        Math.abs(expected.amount - actual.amount) < TOLERANCE &&
        expected.entries === actual.entries;
      if (!ok) failures += 1;

      rows.push({
        Ticket: ticket.Ticket_No,
        Type: type,
        Advance: advance,
        "Expected Rs": Number(expected.amount.toFixed(2)),
        "Actual Rs": Number(actual.amount.toFixed(2)),
        "Exp entries": expected.entries,
        "Act entries": actual.entries,
        Result: ok ? "PASS" : "FAIL",
        Basis: expected.detail,
      });
    }
  }

  console.table(rows);
  console.log(
    failures === 0
      ? `\nAll ${rows.length} check(s) passed.`
      : `\n${failures} of ${rows.length} check(s) FAILED.`,
  );
  if (failures > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Verification failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
    await pool2.end();
  });
