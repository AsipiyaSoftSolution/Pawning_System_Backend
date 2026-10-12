/**
 * Late-charge stage schedule.
 *
 * One stage, or a flat percentage stored as one stage, is a daily percent of
 * the advance from its start day until settlement.
 *
 * Two or more stages repeat on the maturity anniversary each month. The rate
 * entered for a stage is the charge for that whole stage. It is split across
 * the days in the stage, so a 7-day stage at 1% adds 1/7 percent each day.
 * The last stage keeps the days left in the month, and that same percent is
 * split across those days too.
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

function stageCoveringDay(stages, dayInCycle, cycleLength) {
  const normalized = withDerivedStarts(stages);
  for (let i = 0; i < normalized.length; i += 1) {
    const stage = normalized[i];
    const next = normalized[i + 1];
    const windowStart = stage.startDay;
    let windowEnd = cycleLength;
    if (i < normalized.length - 1 && next && next.startDay > windowStart) {
      windowEnd = next.startDay;
    }
    if (windowEnd > cycleLength) windowEnd = cycleLength;
    if (dayInCycle < windowStart || dayInCycle >= windowEnd) continue;
    const days = windowEnd - windowStart;
    return { ...stage, divisor: days > 0 ? days : 1 };
  }
  return null;
}

/**
 * Charges due on `onDate`.
 * A single stage is a daily percent (`divisor` 1).
 * Two or more stages return the stage covering that day. `divisor` is the
 * number of days in the stage, and the day's charge is rate / divisor.
 */
export function stagesDueOnLateChargeDate(stages, onDate, maturityDate) {
  if (!Array.isArray(stages) || stages.length === 0) return [];
  const day = daysBetween(onDate, maturityDate);
  if (!Number.isFinite(day) || day < 0) return [];

  if (stages.length < 2) {
    const stage = stages[0];
    const start = Number(stage.startDay) || 0;
    if (day >= start && Number(stage.rate) > 0) {
      return [{ ...stage, divisor: 1 }];
    }
    return [];
  }

  const cycle = monthCycle(maturityDate, onDate);
  if (!cycle) return [];
  const covering = stageCoveringDay(stages, cycle.dayInCycle, cycle.length);
  if (!covering || !(Number(covering.rate) > 0)) return [];
  return [covering];
}
