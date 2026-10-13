/**
 * Late-charge stage schedule.
 *
 * One stage, or a flat percentage stored as one stage, is a daily percent of
 * the advance from its start day until settlement.
 *
 * Two or more stages work as a step-up that restarts on the maturity
 * anniversary each month. The rate entered for a stage is the total late
 * charge owed for the cycle once the ticket reaches that stage. When a stage
 * begins, only the difference from the previous stage is added. With 0.5, 1,
 * 1.5 and 2 the ticket owes 0.5% in week 1, 1% in week 2, 1.5% in week 3 and
 * 2% from week 4 until the same date next month, then the cycle starts again.
 */

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
  return Math.floor((startOfDay(dateA) - startOfDay(dateB)) / 86400000);
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

/**
 * Charges due on `onDate`.
 *
 * A single stage returns itself every day with its daily rate.
 * Two or more stages return a stage only on the day it begins in the monthly
 * cycle. The returned `rate` is the step-up, meaning this stage's total minus
 * the total of the stage before it. `totalRate` is the stage's own total.
 */
export function stagesDueOnLateChargeDate(stages, onDate, maturityDate) {
  if (!Array.isArray(stages) || stages.length === 0) return [];
  const day = daysBetween(onDate, maturityDate);
  if (!Number.isFinite(day) || day < 0) return [];

  if (stages.length < 2) {
    const stage = stages[0];
    const start = Number(stage.startDay) || 0;
    if (day >= start && Number(stage.rate) > 0) {
      return [{ ...stage, totalRate: Number(stage.rate) }];
    }
    return [];
  }

  const cycle = monthCycle(maturityDate, onDate);
  if (!cycle) return [];

  const normalized = withDerivedStarts(stages);
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
