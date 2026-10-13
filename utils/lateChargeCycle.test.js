import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_LATE_CHARGE_MODE,
  LATE_CHARGE_MODES,
  normalizeLateChargeMode,
  stagesDueOnLateChargeDate,
} from "./lateChargeCycle.js";

const weekly = [
  { num: 1, startDay: 0, endDay: 7, rate: 0.5 },
  { num: 2, startDay: 8, endDay: 14, rate: 1 },
  { num: 3, startDay: 15, endDay: 21, rate: 1.5 },
  { num: 4, startDay: 22, endDay: 0, rate: 2 },
];

const MATURITY = "2026-04-01";

function addDays(ymd, offset) {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offset);
  return date;
}

function due(stages, mode, offset, maturity = MATURITY) {
  return stagesDueOnLateChargeDate(
    stages,
    addDays(maturity, offset),
    maturity,
    mode,
  );
}

/** Percent of the advance charged from maturity through `lastOffset`. */
function percentThrough(stages, mode, lastOffset, maturity = MATURITY) {
  let percent = 0;
  for (let offset = 0; offset <= lastOffset; offset += 1) {
    for (const stage of due(stages, mode, offset, maturity)) {
      percent += stage.rate;
    }
  }
  return percent;
}

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("mode names are validated and default to the original behaviour", () => {
  assert.equal(DEFAULT_LATE_CHARGE_MODE, "once_then_daily");
  assert.equal(normalizeLateChargeMode(undefined), "once_then_daily");
  assert.equal(normalizeLateChargeMode(null), "once_then_daily");
  assert.equal(normalizeLateChargeMode(""), "once_then_daily");
  assert.equal(normalizeLateChargeMode("nonsense"), "once_then_daily");
  assert.equal(normalizeLateChargeMode(" Step_Up_Monthly "), "step_up_monthly");
  for (const mode of LATE_CHARGE_MODES) {
    assert.equal(normalizeLateChargeMode(mode), mode);
  }
});

test("a missing or unknown mode behaves as once_then_daily", () => {
  assert.deepEqual(
    due(weekly, undefined, 22).map((s) => s.num),
    due(weekly, "once_then_daily", 22).map((s) => s.num),
  );
  assert.deepEqual(
    due(weekly, "garbage", 5).map((s) => s.num),
    due(weekly, "once_then_daily", 5).map((s) => s.num),
  );
});

test("once_then_daily charges early stages once and the last stage daily", () => {
  const mode = "once_then_daily";
  assert.deepEqual(due(weekly, mode, 0).map((s) => [s.num, s.rate]), [[1, 0.5]]);
  assert.deepEqual(due(weekly, mode, 3), []);
  assert.deepEqual(due(weekly, mode, 8).map((s) => [s.num, s.rate]), [[2, 1]]);
  assert.deepEqual(due(weekly, mode, 15).map((s) => [s.num, s.rate]), [[3, 1.5]]);
  assert.deepEqual(due(weekly, mode, 22).map((s) => [s.num, s.rate]), [[4, 2]]);
  assert.deepEqual(due(weekly, mode, 23).map((s) => [s.num, s.rate]), [[4, 2]]);
  assert.deepEqual(due(weekly, mode, 90).map((s) => [s.num, s.rate]), [[4, 2]]);
  // 0.5 + 1 + 1.5 once, then 2 each day from day 22 to day 29.
  close(percentThrough(weekly, mode, 29), 3 + 2 * 8);
});

test("step_up_monthly adds only the increase and restarts each month", () => {
  const mode = "step_up_monthly";
  assert.deepEqual(due(weekly, mode, 0).map((s) => [s.num, s.rate]), [[1, 0.5]]);
  assert.deepEqual(due(weekly, mode, 3), []);
  assert.deepEqual(due(weekly, mode, 8).map((s) => [s.num, s.rate]), [[2, 0.5]]);
  assert.deepEqual(due(weekly, mode, 15).map((s) => [s.num, s.rate]), [[3, 0.5]]);
  assert.deepEqual(due(weekly, mode, 22).map((s) => [s.num, s.rate]), [[4, 0.5]]);
  assert.deepEqual(due(weekly, mode, 29), []);
  // Total owed reaches each stage's rate: 0.5, 1, 1.5, 2.
  close(percentThrough(weekly, mode, 7), 0.5);
  close(percentThrough(weekly, mode, 14), 1);
  close(percentThrough(weekly, mode, 21), 1.5);
  close(percentThrough(weekly, mode, 29), 2);
  // The month restarts on the anniversary (April 1 -> May 1 is 30 days).
  assert.deepEqual(due(weekly, mode, 30).map((s) => [s.num, s.rate]), [[1, 0.5]]);
  close(percentThrough(weekly, mode, 59), 4);
});

test("step_up_monthly never charges a negative step", () => {
  const stages = [
    { num: 1, startDay: 0, endDay: 6, rate: 2 },
    { num: 2, startDay: 7, endDay: 0, rate: 1 },
  ];
  assert.deepEqual(due(stages, "step_up_monthly", 0).map((s) => s.rate), [2]);
  assert.deepEqual(due(stages, "step_up_monthly", 7), []);
});

test("missing start days are taken from the previous end day in every mode", () => {
  const stages = [
    { num: 1, startDay: 0, endDay: 7, rate: 0.5 },
    { num: 2, startDay: 0, endDay: 14, rate: 1 },
    { num: 3, startDay: 0, endDay: 21, rate: 1.5 },
    { num: 4, startDay: 0, endDay: 0, rate: 2 },
  ];
  for (const mode of LATE_CHARGE_MODES) {
    assert.ok(due(stages, mode, 8).length > 0, `${mode} day 8`);
    assert.equal(due(stages, mode, 8)[0].num, 2, `${mode} day 8 stage`);
    assert.equal(due(stages, mode, 15)[0].num, 3, `${mode} day 15 stage`);
    assert.equal(due(stages, mode, 22)[0].num, 4, `${mode} day 22 stage`);
  }
});

test("a single stage is a daily charge in every mode", () => {
  const daily = [{ num: 1, startDay: 0, endDay: 0, rate: 0.0667 }];
  for (const mode of LATE_CHARGE_MODES) {
    for (const offset of [0, 1, 29, 30, 120]) {
      const charged = due(daily, mode, offset);
      assert.equal(charged.length, 1, `${mode} day ${offset}`);
      assert.equal(charged[0].rate, 0.0667);
    }
  }
});

test("a single stage honours its start day", () => {
  const delayed = [{ num: 1, startDay: 3, endDay: 0, rate: 1 }];
  assert.deepEqual(due(delayed, "once_then_daily", 2), []);
  assert.equal(due(delayed, "once_then_daily", 3).length, 1);
});

test("no charge before the maturity date in any mode", () => {
  for (const mode of LATE_CHARGE_MODES) {
    assert.deepEqual(due(weekly, mode, -1), [], mode);
  }
});

test("a zero rate stage charges nothing", () => {
  const stages = [
    { num: 1, startDay: 0, endDay: 7, rate: 0 },
    { num: 2, startDay: 8, endDay: 0, rate: 1 },
  ];
  assert.deepEqual(due(stages, "once_then_daily", 0), []);
  assert.deepEqual(due(stages, "step_up_monthly", 0), []);
});
