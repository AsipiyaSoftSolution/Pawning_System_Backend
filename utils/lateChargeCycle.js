/**
 * Late-charge schedule, one function per calculation mode.
 *
 * A product chooses how its late-charge stages behave. The choice is stored on
 * pawning_product.Late_Charge_Calc_Mode and copied onto each ticket when it is
 * created, so editing a product never changes tickets already issued.
 *
 *   once_then_daily  (default, the original behaviour)
 *       Stages 1..N-1 are charged once, on the day the stage begins. The last
 *       stage is charged every day until the ticket is settled. Never restarts.
 *
 *   step_up_monthly
 *       The rate of each stage is the TOTAL late charge owed once the ticket
 *       reaches that stage. When a stage begins, only the increase over the
 *       previous stage is added. The schedule restarts on every monthly
 *       anniversary of the maturity date.
 *
 * A single stage (and a flat, non-staged percentage) is always a daily percent
 * from its start day until settlement, whatever the mode.
 *
 * `stagesDueOnLateChargeDate` returns the stages to charge on one calendar day.
 * On every returned stage `rate` is the percent of the advance to charge that
 * day; callers compute advance * rate / 100 and need no further division.
 * `totalRate` carries the stage's own configured rate for reporting.
 */

export const LATE_CHARGE_MODE_ONCE_THEN_DAILY = "once_then_daily";
export const LATE_CHARGE_MODE_STEP_UP_MONTHLY = "step_up_monthly";

export const LATE_CHARGE_MODES = [
  LATE_CHARGE_MODE_ONCE_THEN_DAILY,
  LATE_CHARGE_MODE_STEP_UP_MONTHLY,
];

export const DEFAULT_LATE_CHARGE_MODE = LATE_CHARGE_MODE_ONCE_THEN_DAILY;

/** True when the schedule restarts every month after maturity. */
export const isMonthlyLateChargeMode = (mode) =>
  mode === LATE_CHARGE_MODE_STEP_UP_MONTHLY;

/** Unknown, empty or missing values fall back to the original behaviour. */
export function normalizeLateChargeMode(value) {
  const text = String(value ?? "")
    .trim()
    .toLowerCase();
  return LATE_CHARGE_MODES.includes(text) ? text : DEFAULT_LATE_CHARGE_MODE;
}

function startOfDay(value) {
  if (value instanceof Date) {
    const d = new Date(value.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const text = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(dateA, dateB) {
  return Math.round((startOfDay(dateA) - startOfDay(dateB)) / 86400000);
}

function addCalendarMonths(date, months) {
  const origin = startOfDay(date);
  const day = origin.getDate();
  const target = new Date(origin.getFullYear(), origin.getMonth() + months, 1);
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  target.setDate(Math.min(day, lastDay));
  target.setHours(0, 0, 0, 0);
  return target;
}

/** Position of `onDate` inside the monthly cycle that began on a maturity anniversary. */
function monthCycle(maturityDate, onDate) {
  const on = startOfDay(onDate);
  const origin = startOfDay(maturityDate);
  if (on < origin) return null;

  let index = 0;
  let cycleStart = origin;
  let next = addCalendarMonths(origin, 1);
  while (next <= on && index < 600) {
    index += 1;
    cycleStart = next;
    next = addCalendarMonths(origin, index + 1);
  }

  return {
    dayInCycle: daysBetween(on, cycleStart),
    length: daysBetween(next, cycleStart),
  };
}

/** Fill start days that were saved as 0 or left blank from the previous stage's end day. */
function withDerivedStarts(stages) {
  let previousEnd = null;
  return stages.map((stage, index) => {
    const rawStart = Number(stage.startDay);
    const start =
      index === 0
        ? Number.isFinite(rawStart)
          ? rawStart
          : 0
        : Number.isFinite(rawStart) && rawStart > 0
          ? rawStart
          : previousEnd != null
            ? Number(previousEnd) + 1
            : 0;
    const rawEnd = Number(stage.endDay);
    const end = Number.isFinite(rawEnd) && rawEnd >= start ? rawEnd : null;
    if (end != null) previousEnd = end;
    return { ...stage, startDay: start, endDay: end };
  });
}

function singleStageDue(stage, day) {
  const start = Number(stage.startDay) || 0;
  const rate = Number(stage.rate) || 0;
  if (day >= start && rate > 0) return [{ ...stage, rate, totalRate: rate }];
  return [];
}

function onceThenDaily(normalized, day) {
  const due = [];
  const lastIndex = normalized.length - 1;
  normalized.forEach((stage, index) => {
    const rate = Number(stage.rate) || 0;
    if (!(rate > 0)) return;
    const isLast = index === lastIndex;
    const charged = isLast ? day >= stage.startDay : day === stage.startDay;
    if (charged) due.push({ ...stage, rate, totalRate: rate });
  });
  return due;
}

function stepUpMonthly(normalized, cycle) {
  let previousTotal = 0;
  const due = [];
  for (const stage of normalized) {
    const total = Number(stage.rate) || 0;
    const stepUp = total - previousTotal;
    previousTotal = Math.max(previousTotal, total);
    if (stage.startDay !== cycle.dayInCycle) continue;
    if (stage.startDay >= cycle.length) continue;
    if (!(stepUp > 0)) continue;
    due.push({ ...stage, rate: stepUp, totalRate: total });
  }
  return due;
}

/**
 * Stages to charge on `onDate`, for a ticket that matured on `maturityDate`.
 * `mode` is one of LATE_CHARGE_MODES; anything else behaves as the default.
 */
export function stagesDueOnLateChargeDate(
  stages,
  onDate,
  maturityDate,
  mode = DEFAULT_LATE_CHARGE_MODE,
) {
  if (!Array.isArray(stages) || stages.length === 0) return [];
  const day = daysBetween(onDate, maturityDate);
  if (!Number.isFinite(day) || day < 0) return [];

  if (stages.length < 2) return singleStageDue(stages[0], day);

  const normalized = withDerivedStarts(stages);
  if (normalizeLateChargeMode(mode) === LATE_CHARGE_MODE_STEP_UP_MONTHLY) {
    const cycle = monthCycle(maturityDate, onDate);
    return cycle ? stepUpMonthly(normalized, cycle) : [];
  }
  return onceThenDaily(normalized, day);
}
