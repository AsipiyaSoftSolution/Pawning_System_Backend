/**
 * Late-charge stage schedule.
 *
 * One stage, or a flat percentage stored as one stage, is a daily percent of
 * the advance from its start day until settlement.
 *
 * Two or more stages are charged once each, on the first day of that stage,
 * and the list repeats on the maturity anniversary each month. The last stage
 * keeps the days that remain after its start day, through the day before the
 * next anniversary. With ends of 7, 14 and 21, stage 4 starts on day 22. In a
 * 30-day month, days 29 and 30 stay on stage 4, and stage 1 starts again on
 * the same date next month.
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

/**
 * Stages whose charge falls on `onDate`.
 * A multi-stage schedule restarts on each monthly anniversary of `maturityDate`.
 */
export function stagesDueOnLateChargeDate(stages, onDate, maturityDate) {
  if (!Array.isArray(stages) || stages.length === 0) return [];
  const day = daysBetween(onDate, maturityDate);
  if (!Number.isFinite(day) || day < 0) return [];

  if (stages.length < 2) {
    const stage = stages[0];
    const start = Number(stage.startDay) || 0;
    if (day >= start && Number(stage.rate) > 0) return [stage];
    return [];
  }

  const cycle = monthCycle(maturityDate, onDate);
  if (!cycle) return [];

  return stages.filter((stage) => {
    if (!(Number(stage.rate) > 0)) return false;
    const start = Number(stage.startDay) || 0;
    return start === cycle.dayInCycle && start < cycle.length;
  });
}
