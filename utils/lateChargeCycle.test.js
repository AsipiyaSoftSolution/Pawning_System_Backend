import assert from "node:assert/strict";
import test from "node:test";
import { stagesDueOnLateChargeDate } from "./lateChargeCycle.js";

const weekly = [
  { num: 1, startDay: 0, endDay: 7, rate: 0.5 },
  { num: 2, startDay: 8, endDay: 14, rate: 1 },
  { num: 3, startDay: 15, endDay: 21, rate: 1.5 },
  { num: 4, startDay: 22, endDay: 0, rate: 2 },
];

function addDays(ymd, offset) {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offset);
  return date;
}

function due(stages, maturity, offset) {
  return stagesDueOnLateChargeDate(
    stages,
    addDays(maturity, offset),
    maturity,
  );
}

/** Total percent owed after walking every day from maturity through `offset`. */
function totalThrough(stages, maturity, offset) {
  let percent = 0;
  for (let day = 0; day <= offset; day += 1) {
    for (const stage of due(stages, maturity, day)) percent += stage.rate;
  }
  return percent;
}

test("the total steps up to the current week rate for all days since maturity", () => {
  const maturity = "2026-09-24";
  assert.equal(totalThrough(weekly, maturity, 0), 0.5);
  assert.equal(totalThrough(weekly, maturity, 7), 0.5);
  assert.equal(totalThrough(weekly, maturity, 8), 1);
  assert.equal(totalThrough(weekly, maturity, 14), 1);
  assert.equal(totalThrough(weekly, maturity, 15), 1.5);
  assert.equal(totalThrough(weekly, maturity, 21), 1.5);
  assert.equal(totalThrough(weekly, maturity, 22), 2);
  assert.equal(totalThrough(weekly, maturity, 29), 2);
});

test("only the difference is added when a stage begins", () => {
  const maturity = "2026-09-24";
  assert.deepEqual(
    due(weekly, maturity, 0).map((s) => [s.num, s.rate]),
    [[1, 0.5]],
  );
  assert.deepEqual(
    due(weekly, maturity, 8).map((s) => [s.num, s.rate]),
    [[2, 0.5]],
  );
  assert.deepEqual(
    due(weekly, maturity, 15).map((s) => [s.num, s.rate]),
    [[3, 0.5]],
  );
  assert.deepEqual(
    due(weekly, maturity, 22).map((s) => [s.num, s.rate]),
    [[4, 0.5]],
  );
  assert.deepEqual(due(weekly, maturity, 5), []);
  assert.deepEqual(due(weekly, maturity, 25), []);
});

test("the cycle restarts on the monthly anniversary", () => {
  const maturity = "2026-09-24";
  // 24 Sep + 1 month = 24 Oct, which is 30 days after maturity.
  assert.equal(due(weekly, maturity, 30)[0].num, 1);
  assert.equal(due(weekly, maturity, 30)[0].rate, 0.5);
  assert.equal(due(weekly, maturity, 38)[0].num, 2);
  assert.equal(totalThrough(weekly, maturity, 59), 4);
});

test("missing start days are taken from the previous end day", () => {
  const stages = [
    { num: 1, startDay: 0, endDay: 7, rate: 0.5 },
    { num: 2, startDay: 0, endDay: 14, rate: 1 },
    { num: 3, startDay: 0, endDay: 21, rate: 1.5 },
    { num: 4, startDay: 0, endDay: 0, rate: 2 },
  ];
  const maturity = "2026-04-01";
  assert.equal(due(stages, maturity, 8)[0].num, 2);
  assert.equal(due(stages, maturity, 15)[0].num, 3);
  assert.equal(due(stages, maturity, 22)[0].num, 4);
});

test("a lower later stage never adds a negative charge", () => {
  const stages = [
    { num: 1, startDay: 0, endDay: 7, rate: 1 },
    { num: 2, startDay: 8, endDay: 0, rate: 0.5 },
  ];
  assert.deepEqual(due(stages, "2026-04-01", 8), []);
});

test("a single stage stays a daily charge", () => {
  const daily = [{ num: 1, startDay: 0, endDay: 0, rate: 0.0667 }];
  const maturity = "2026-04-01";
  assert.equal(due(daily, maturity, 0)[0].rate, 0.0667);
  assert.equal(due(daily, maturity, 29)[0].rate, 0.0667);
  assert.equal(due(daily, maturity, 40)[0].rate, 0.0667);
});

test("no charge before the maturity date", () => {
  assert.deepEqual(due(weekly, "2026-04-01", -1), []);
});
