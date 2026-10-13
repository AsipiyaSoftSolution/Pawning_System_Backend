# Pawning late charge calculation modes

Reference for how pawning late charges are calculated, how a company or product chooses the rule, what is stored where, and how to roll it out.

- Applies to: Pawning backend and frontend, and the Admin ticket-migration path.
- Source of truth for the rules: `Pawning_System_Backend/utils/lateChargeCycle.js` (an identical copy lives in `Asipiya_Finance_Admin_Backend/utils/lateChargeCycle.js`).
- Database reference: `pawning_system.sql` (the dump this document was checked against).
- All figures in the worked examples were produced by running the real module, not calculated by hand.

---

## 1. Why this exists

Pawning companies do not agree on how a late charge should build up after the maturity date. One company wants "1% for the whole overdue period once we are in week 2", another wants a flat daily rate, another wants a fixed charge per week. Until now the system had one built-in rule, so every company got it.

Each **product** now chooses its own calculation mode. The choice is made on the product screen, stored on the product, and copied onto each ticket when the ticket is created.

```text
Product (Late Charge Calculation)  --copied at ticket creation-->  Ticket (Late_Charge_Calc_Mode)
                                                                         |
                                                       daily accrual job reads the ticket's mode
```

Because the ticket keeps its own copy, editing a product never changes tickets that were already issued. This is the same way tickets already keep their own copy of the stage rates.

---

## 2. The two modes

A product has up to 4 late charge stages. Each stage has a start day (days after maturity), an end day, and a rate. The mode decides what that rate means.

A **single stage** (and a flat, non-staged late charge percentage) is always a **daily percent of the advance** from its start day until the ticket is settled. The mode makes no difference to it.

| Value stored | Name on screen | One line |
|---|---|---|
| `once_then_daily` | One-time charges, then daily | Stages 1..N-1 charged once; the last stage charged every day. This is the original behaviour and the default. |
| `step_up_monthly` | Step-up total, repeats monthly | The rate is the total owed on reaching the stage; only the increase is added; restarts each month. |

In every mode the amount for a day is:

```text
charge for the day = advance balance x (rate to charge today) / 100
```

`advance balance` is the ticket's current `Advance_Balance` from the latest `ticket_log` row.

### 2.1 `once_then_daily` (default, original behaviour)

- Stages 1 to N-1 are charged **one time**, on the day the stage begins (`maturity + start day`).
- The last stage is charged **every day** from its start day until settlement.
- Nothing restarts.

How to enter rates: the early stages hold the one-time percent; the last stage holds a per-day percent.

Use it when: the company wants a one-off penalty at each step, then a daily penalty that keeps running.

Caution: with rates written like `0.5 / 1 / 1.5 / 2` the last stage is **2% every day**. That is large. If those numbers mean "2% in total", use `step_up_monthly` instead.

### 2.2 `step_up_monthly`

- The rate of a stage is the **total late charge owed once the ticket reaches that stage**.
- On the day a stage begins, only the **increase over the previous stage** is added.
- The cycle **restarts on the same date every month** after maturity (the maturity anniversary). If the month is shorter, the anniversary lands on the last day of that month.
- A stage that is not higher than the one before it adds nothing (a negative step is never charged).

How to enter rates: enter the running total you want to have by the end of each stage.

Use it when: the company's rule is "in week 2 the ticket owes 1% for the whole overdue period so far".

Example: stages `0.5 / 1 / 1.5 / 2` with ends `7 / 14 / 21` charge 0.5% on day 0, then +0.5% on days 8, 15 and 22. The running total reaches 0.5%, 1%, 1.5%, 2%. On the next monthly anniversary it adds 0.5% again, and so on.

---

## 3. Worked examples

### 3.1 One month of daily charges on LKR 100,000

Stages: 0.5 / 1 / 1.5 / 2, ends 7 / 14 / 21, maturity 2026-09-24. Amounts are the charge posted on that day.

| Day after maturity | `once_then_daily` | `step_up_monthly` |
|---|---|---|
| 0 | 500.00 | 500.00 |
| 1 to 7 | 0.00 | 0.00 |
| 8 | 1,000.00 | 500.00 |
| 9 to 14 | 0.00 | 0.00 |
| 15 | 1,500.00 | 500.00 |
| 16 to 21 | 0.00 | 0.00 |
| 22 | 2,000.00 | 500.00 |
| 23 to 29 | 2,000.00 each day | 0.00 |
| 30 (next month starts) | 2,000.00 | 500.00 |

### 3.2 Total owed so far

Same stages, LKR 100,000, maturity 2026-09-24.

| Through day | `once_then_daily` | `step_up_monthly` |
|---|---|---|
| 7 | 500.00 | 500.00 |
| 14 | 1,500.00 | 1,000.00 |
| 21 | 3,000.00 | 1,500.00 |
| 29 (end of first month) | 19,000.00 | 2,000.00 |
| 30 (next month starts) | 21,000.00 | 2,500.00 |
| 59 | 79,000.00 | 4,000.00 |

This is why the mode must match the numbers the company typed in. The same `0.5 / 1 / 1.5 / 2` gives LKR 2,000 or LKR 19,000 by day 29, depending on the mode.

### 3.3 Ticket FIN/KIR/2793

Advance LKR 75,500, maturity 2026-09-24, checked on 2026-10-12 (day 18, inside stage 3).

| Mode | Total late charge owed |
|---|---|
| `step_up_monthly` | 1.5% = **LKR 1,132.50** |
| `once_then_daily` | 3.0% = LKR 2,265.00 |

The "1.5% for every day since maturity once we are in week 3" rule is `step_up_monthly`.

### 3.4 Two-stage product

Stage 1 is 2% (days 0 to 7), stage 2 is 0.5% (day 8 on), LKR 100,000, through day 29.

| Mode | Total |
|---|---|
| `once_then_daily` | 13,000.00 (2,000 once, then 500 daily for days 8 to 29) |
| `step_up_monthly` | 2,000.00 (stage 2 is lower than stage 1, so it adds nothing) |

---

## 4. How the system uses the mode

### 4.1 Where the user chooses it

- **Create product** (`CreateProduct.jsx`): *Late Charge* section, **Late Charge Calculation** dropdown. It appears once "Late Charge Create As" is chosen, for both "Charge For Product" and "Charge For Product Item".
- **Edit product** (`ViewProduct.jsx`): *Late Charge Configuration*, same dropdown.
- **View product**: *Late Charges* section shows a **Calculation** row.

The dropdown shows a one-line explanation and a worked example for the selected mode. The stage form changes its wording to match: rate labels, and the last stage's end shows **Until next month** (monthly modes) or **Until Settlement** (the others).

The setting belongs to the **product**, and applies to the stages whether they are set on the product or on each product item.

### 4.2 Daily accrual

`accrueTicketInterestAndPenalty` (`utils/pawning.ticket.logs.js`) walks every calendar day from the ticket start to today. For each day on or after maturity it calls `processLateChargeStages`, which:

1. Resolves the ticket's stages (`numberOfLateChargeStages`, `lateChargeStage1..4`, start and end days).
2. Calls `stagesDueOnLateChargeDate(stages, day, maturityDate, ticket.Late_Charge_Calc_Mode)`.
3. For each stage returned, skips it if a `PENALTY` row with the same description already exists, otherwise inserts a `ticket_log` row, a customer log entry, and the accounting entry.

The description is `YYYY-MM-DD - Late Charge Stage N`. That text is the idempotency key: a day that already has a row is never charged twice.

### 4.3 Ticket creation

`pawning.ticket.controller.js` reads `Late_Charge_Calc_Mode` from the product and writes it into `pawning_ticket` together with the stage snapshot.

If an old ticket has no stage snapshot, `hydrateTicketLateChargeFromProduct` copies the stages and the mode from the product on first accrual.

### 4.4 Ticket migration (Admin)

`ticketMigration.controller.js` copies the product's mode onto each migrated ticket. `pawningMigrationAccrual.service.js` then catches up the missing days with the same `stagesDueOnLateChargeDate` function, so a migrated ticket accrues exactly what a ticket created in the system would.

### 4.5 Edge cases handled

| Case | Behaviour |
|---|---|
| Mode is empty, NULL or unknown | Treated as `once_then_daily`. |
| Stage start day saved as 0 or blank (stage 2 and later) | Taken as the previous stage's end day + 1. |
| Monthly modes, month shorter than the maturity day | The anniversary lands on the last day of that month. |
| A stage rate of 0 | Charges nothing for that stage. |
| `step_up_monthly` stage lower than the one before | Adds nothing; the highest total so far is kept. |
| Day before maturity | Nothing is charged, in every mode. |
| Single stage / flat percentage | Daily percent from its start day, in every mode. |

---

## 5. Database

### 5.1 New column

Migration: `Pawning_System_Backend/sql/migrations/005_late_charge_calc_mode.sql`

| Table | Column | Type | Default |
|---|---|---|---|
| `pawning_product` | `Late_Charge_Calc_Mode` | `VARCHAR(30) NOT NULL` | `'once_then_daily'` |
| `pawning_ticket` | `Late_Charge_Calc_Mode` | `VARCHAR(30) NOT NULL` | `'once_then_daily'` |

`product_plan` does not get a column. The mode is a product-level choice.

Every existing product and ticket receives `once_then_daily`, so nothing changes until someone switches a product on purpose.

### 5.2 Existing late charge columns (from `pawning_system.sql`)

The same stage columns exist on three tables.

| Column | `pawning_product` | `product_plan` | `pawning_ticket` |
|---|---|---|---|
| `lateChargeStage1..4` (rate) | `decimal(10,4)` | `decimal(10,4)` | `varchar(45)` |
| `lateChargeStage1..4StartDate` | `varchar(45)` | `varchar(45)` | `varchar(45)` |
| `lateChargeStage1..4EndDate` | `varchar(45)` | `varchar(45)` | `varchar(45)` |
| `numberOfLateChargeStages` | `int` | `int` | `int` |
| `Late_Charge` (flat daily %) | `decimal(10,4)` | `decimal(10,4)` | n/a |
| `Late_charge_Presentage` (flat daily %) | n/a | n/a | `varchar(255)` |
| `Late_Charge_Status` | `varchar(45)` (`'1'` active) | n/a | n/a |
| `Late_Charge_Create_As` | `varchar(45)` | n/a | n/a |
| `Late_Charge_Calc_Mode` (new) | `varchar(30)` | n/a | `varchar(30)` |

Notes:

- `Late_Charge_Create_As` is `inactive`, `Charge For Product` (stages on the product) or `Charge For Product Item` (stages on each `product_plan` row).
- The last stage's end day is stored as the text `Until Settlement`. The product screen shows it as **Until next month** for the monthly modes; the stored value does not change.
- The product and plan tables are `latin1`, the ticket table is `utf8mb4`.

### 5.3 Where a late charge shows up in the data

`ticket_log` rows with `Type = 'PENALTY'`:

| Column | Meaning |
|---|---|
| `Pawning_Ticket_idPawning_Ticket` | Ticket |
| `Description` | `YYYY-MM-DD - Late Charge Stage N` (the idempotency key) |
| `Amount` | Charge for that day |
| `Advance_Balance` | Advance used for the calculation |
| `Late_Charges_Balance` | Running late charge balance after this row |
| `Total_Balance` | Running total after this row |

In the dump there are 127,147 `ticket_log` rows, 34,814 of them `PENALTY`.

---

## 6. Products in the dump

Checked against `pawning_system.sql` (28 products). Products that have no late charge configured, or have it inactive, are not listed.

### 6.1 Staged late charge (2 or more stages) - the mode matters

| Product id | Name | Create as | Stages | Rates | Ends | Suggested mode |
|---|---|---|---|---|---|---|
| 12 | Repawning Product | Charge For Product | 4 | 0.5 / 1 / 1.5 / 2 | 7 / 14 / 21 / Until Settlement | `step_up_monthly` |
| 16 | Ran Udana | Charge For Product | 4 | 0.5 / 1 / 1.5 / 2 | 7 / 14 / 21 / Until Settlement | `step_up_monthly` |
| 23 | Test Product | Charge For Product | 4 | 0.5 / 1 / 1.5 / 2 | 7 / 14 / 21 / Until Settlement | `step_up_monthly` |
| 8 | Test Product 1 | Charge For Product | 2 | 2 / 0.5 | 7 / - | Review (stage 2 is lower than stage 1; under `step_up_monthly` it adds nothing) |
| 31 | A Product | Charge For Product Item | 2 (on the plan) | 1 / 1 | 7 / Until Settlement | Review (equal rates under `step_up_monthly` add nothing for stage 2) |
| 32 | B Product | Charge For Product Item | 2 (on the plan) | 1 / 1 | 14 / Until Settlement | Review (same) |

Products 12, 16 and 23 are the weekly 0.5 / 1 / 1.5 / 2 configuration this feature was built for. Left on `once_then_daily` they would charge 2% every day from day 22.

### 6.2 Single stage - always daily, the mode makes no difference

| Rate per day | Product ids |
|---|---|
| 0.0667 | 9, 10, 11, 13, 14, 15, 17, 18 |
| 1.0 | 28, 29, 30 |
| 1000.0 | 21 (looks like test data, a 1000% daily rate) |
| 0 | 24 |

### 6.3 Not using late charge

Products 5, 6, 7, 19, 20, 22, 25, 26, 27 have late charge inactive.

> Confirm which of these belong to the company that wants the monthly step-up before changing anything. Product ids differ between databases.

---

## 7. Rollout

Run in this order. The new backend reads and writes the new column, so the column has to exist first.

1. **Backup** the pawning database.
2. **Run the migration** `005_late_charge_calc_mode.sql` on every company database that has a pawning product table. Parts 0 and 2 are read-only checks. Part 1 adds the columns.
3. **Deploy the Pawning backend**, then the **Admin backend**, then the **Pawning frontend**.
4. **Switch the products** that need a different rule, either with the dropdown on the product screen or with the SQL below.
5. **Verify** with the checks in section 9.

### 7.1 Switching a product with SQL

Product row, and the open tickets already issued on it (tickets keep their own copy):

```sql
START TRANSACTION;

UPDATE pawning_product
   SET Late_Charge_Calc_Mode = 'step_up_monthly'
 WHERE idPawning_Product IN (12, 16, 23);        -- confirm these ids first

UPDATE pawning_ticket
   SET Late_Charge_Calc_Mode = 'step_up_monthly'
 WHERE Pawning_Product_idPawning_Product IN (12, 16, 23)
   AND Status IN ('1', '3');                     -- active and overdue tickets

COMMIT;
```

Valid values: `once_then_daily`, `step_up_monthly`.

### 7.2 What happens to penalties already posted

Rows already in `ticket_log` are **not recalculated**. Only days that have not been accrued yet follow the new mode.

If a ticket was accrued under the wrong rule and must be recomputed, its `PENALTY` rows (and the balances that follow them) have to be corrected deliberately, then the daily job re-run for that ticket. Do this per ticket, on a copy of the data first. It touches accounting entries, so involve whoever owns the books.

### 7.3 Rolling back

- To stop using a mode: set the product (and its open tickets) back to `once_then_daily`.
- The column can stay. It is harmless at its default.
- Do not drop the column while the new backend is deployed.

---

## 8. API contract

### 8.1 Product create and update

Field: `data.lateCharge.calcMode`

- One of `once_then_daily`, `step_up_monthly`. Any other value is rejected with HTTP 400 and the message `Late charge calculation mode must be one of: ...`.
- On **create**, an omitted value stores `once_then_daily`.
- On **update**, an omitted value **keeps the stored mode** (older clients that do not send the field cannot reset it).

### 8.2 Product read

`GET` product by id returns `lateCharge.calcMode` (always one of the two values).

### 8.3 Ticket grant summary

`getTicketGrantSummaryData` returns `lateChargeCalcMode`, used by the create-ticket screen to word the stage table.

### 8.4 Ticket read

Ticket data (`SELECT *`) now includes `Late_Charge_Calc_Mode`. The ticket screens use it to show **Until next month** and the right rate column heading.

---

## 9. Verification

### 9.1 Automated

```text
cd Pawning_System_Backend
node --test utils/lateChargeCycle.test.js
```

10 tests cover: mode name handling and the default, both modes (including the one-month totals above), monthly restart, derived start days, negative steps, single stage in both modes, start day on a single stage, nothing before maturity, and zero rates.

The Admin copy of the module has the same tests.

### 9.2 SQL checks after migration

```sql
-- Every product shows a mode; existing ones read once_then_daily until switched.
SELECT Late_Charge_Calc_Mode, COUNT(*) AS products
FROM pawning_product
GROUP BY Late_Charge_Calc_Mode;

-- Tickets and their copied mode, by product.
SELECT Pawning_Product_idPawning_Product AS product_id,
       Late_Charge_Calc_Mode, COUNT(*) AS tickets
FROM pawning_ticket
WHERE Status IN ('1', '3')
GROUP BY Pawning_Product_idPawning_Product, Late_Charge_Calc_Mode;
```

### 9.3 Checking one ticket by hand

For a staged ticket, compare the sum of its `PENALTY` rows against section 3 using the ticket's advance and maturity date:

```sql
SELECT SUM(CAST(Amount AS DECIMAL(14,2))) AS late_charge_total, COUNT(*) AS rows_posted
FROM ticket_log
WHERE Pawning_Ticket_idPawning_Ticket = ?   -- ticket id
  AND Type = 'PENALTY';
```

`scripts/verify_demo_accruals.mjs` recomputes the expected penalty for the demo tickets from the ticket's own mode and reports any mismatch.

---

## 10. Options other companies may ask for (not built)

These came up while designing the modes. None of them is implemented. Each would be a new mode value and a new function in `lateChargeCycle.js`; the product dropdown, the stored column and the accrual loop already support adding one.

| Idea | What it would do |
|---|---|
| Fixed amount per stage | A set LKR amount per stage instead of a percent of the advance. |
| Grace days | No charge for the first N days after maturity. |
| Cap | Stop adding charge once the total reaches a percent of the advance. |
| Calendar weeks | Stages follow calendar weeks instead of days after maturity. |
| Charge on outstanding total | Percent of advance plus interest, instead of advance only. |
| Per-stage "once" or "daily" | Each stage chooses its own behaviour. |

---

## 11. Files changed

Pawning backend (`Pawning_System_Backend`)

- `utils/lateChargeCycle.js` - the two modes and `stagesDueOnLateChargeDate(stages, onDate, maturityDate, mode)`.
- `utils/lateChargeCycle.test.js` - tests.
- `utils/pawning.ticket.logs.js` - daily accrual passes the ticket's mode; hydrate path copies the mode.
- `utils/pawningProductValidation.js` - rejects unknown modes.
- `controllers/pawning.product.controller.js` - create, update, read.
- `controllers/pawning.ticket.controller.js` - ticket snapshot, grant summary.
- `scripts/verify_demo_accruals.mjs` - recomputes using the ticket's mode.
- `sql/migrations/005_late_charge_calc_mode.sql` - columns.

Admin backend (`Asipiya_Finance_Admin_Backend`)

- `utils/lateChargeCycle.js` and `.test.js` - identical copies.
- `services/pawningMigrationAccrual.service.js` - catch-up uses the shared schedule.
- `controllers/ticketMigration.controller.js` - copies the mode to migrated tickets.

Pawning frontend (`Pawning_System_Frontend/src`)

- `utils/lateChargeModes.js` - mode list, wording and labels.
- `components/LateChargeModeSelect.jsx` - the dropdown with description and example.
- `components/LateChargeStages.jsx` - labels follow the mode.
- `components/PeriodProductsInterest.jsx`, `components/PawningProductsInterest.jsx` - item forms receive the mode.
- `components/StageRatesTable.jsx`, `components/ViewTicket.jsx`, `pages/TicketPayment.jsx`, `pages/CreatePawningTicket.jsx`, `utils/interestStages.js` - ticket-side wording.
- `pages/CreateProduct.jsx`, `pages/ViewProduct.jsx` - the setting on create, edit and view.

Keep the two copies of `lateChargeCycle.js` identical. The two backends are separate deployments and cannot import from each other.
