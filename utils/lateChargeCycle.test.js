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

test("a week rate is split across the days in that stage", () => {
  const maturity = "2026-04-01";
  const day0 = due(weekly, maturity, 0)[0];
  const day7 = due(weekly, maturity, 7)[0];
  const day8 = due(weekly, maturity, 8)[0];
  const day22 = due(weekly, maturity, 22)[0];
  const day29 = due(weekly, maturity, 29)[0];
  const day30 = due(weekly, maturity, 30)[0];

  assert.equal(day0.num, 1);
  assert.equal(day0.divisor, 8);
  assert.equal(day7.num, 1);
  assert.equal(day7.divisor, 8);
  assert.equal(day8.num, 2);
  assert.equal(day8.divisor, 7);
  assert.equal(day22.num, 4);
  assert.equal(day22.divisor, 8);
  assert.equal(day29.num, 4);
  assert.equal(day30.num, 1);

  let percent = 0;
  for (let offset = 0; offset < 30; offset += 1) {
    const stage = due(weekly, maturity, offset)[0];
    percent += stage.rate / stage.divisor;
  }
  assert.ok(Math.abs(percent - 5) < 0.000001);
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

test("a single stage stays a daily charge and is not divided", () => {
  const daily = [{ num: 1, startDay: 0, endDay: 0, rate: 0.0667 }];
  const maturity = "2026-04-01";
  assert.equal(due(daily, maturity, 0)[0].divisor, 1);
  assert.equal(due(daily, maturity, 29)[0].divisor, 1);
  assert.equal(due(daily, maturity, 40)[0].num, 1);
});

test("no charge before the maturity date", () => {
  assert.deepEqual(due(weekly, "2026-04-01", -1), []);
});
