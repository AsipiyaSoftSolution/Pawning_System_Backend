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

function dueNums(stages, maturity, offset) {
  return stagesDueOnLateChargeDate(
    stages,
    addDays(maturity, offset),
    maturity,
  ).map((stage) => stage.num);
}

test("a 30-day month keeps the last two days on stage 4", () => {
  const maturity = "2026-04-01";
  assert.deepEqual(dueNums(weekly, maturity, 0), [1]);
  assert.deepEqual(dueNums(weekly, maturity, 8), [2]);
  assert.deepEqual(dueNums(weekly, maturity, 15), [3]);
  assert.deepEqual(dueNums(weekly, maturity, 22), [4]);
  assert.deepEqual(dueNums(weekly, maturity, 28), []);
  assert.deepEqual(dueNums(weekly, maturity, 29), []);
  assert.deepEqual(dueNums(weekly, maturity, 30), [1]);
});

test("a 31-day month keeps three extra days on stage 4", () => {
  const maturity = "2026-03-01";
  assert.deepEqual(dueNums(weekly, maturity, 22), [4]);
  assert.deepEqual(dueNums(weekly, maturity, 28), []);
  assert.deepEqual(dueNums(weekly, maturity, 29), []);
  assert.deepEqual(dueNums(weekly, maturity, 30), []);
  assert.deepEqual(dueNums(weekly, maturity, 31), [1]);
});

test("a short February still charges stage 4 and restarts next month", () => {
  const maturity = "2026-01-31";
  assert.deepEqual(dueNums(weekly, maturity, 0), [1]);
  assert.deepEqual(dueNums(weekly, maturity, 22), [4]);
  assert.deepEqual(dueNums(weekly, maturity, 27), []);
  assert.deepEqual(dueNums(weekly, maturity, 28), [1]);
});

test("a single stage stays a daily charge until settlement", () => {
  const daily = [{ num: 1, startDay: 0, endDay: 0, rate: 0.0667 }];
  const maturity = "2026-04-01";
  assert.deepEqual(dueNums(daily, maturity, 0), [1]);
  assert.deepEqual(dueNums(daily, maturity, 29), [1]);
  assert.deepEqual(dueNums(daily, maturity, 40), [1]);
});

test("no charge before the maturity date", () => {
  assert.deepEqual(dueNums(weekly, "2026-04-01", -1), []);
});
