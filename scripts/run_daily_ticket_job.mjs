/**
 * Run the midnight interest / penalty job by hand.
 *
 *   node scripts/run_daily_ticket_job.mjs
 *
 * Prints the ticket_log rows the run produced so interest and penalty accrual
 * can be checked without waiting for the 12AM cron in server.js.
 */
import dotenv from "dotenv";
dotenv.config();

import { pool, pool2 } from "../utils/db.js";
import { addDailyTicketLog } from "../utils/pawning.ticket.logs.js";

const snapshot = async () => {
  const [rows] = await pool.query(
    "SELECT COALESCE(MAX(idTicket_Log), 0) AS lastId, COUNT(*) AS total FROM ticket_log",
  );
  return rows[0];
};

async function main() {
  const before = await snapshot();
  console.log(
    `ticket_log before: ${before.total} row(s), last id ${before.lastId}\n`,
  );

  const startedAt = Date.now();
  let failure = null;
  try {
    await addDailyTicketLog();
    console.log(`Daily job finished in ${Date.now() - startedAt}ms.\n`);
  } catch (error) {
    failure = error;
    console.error(`Daily job threw after ${Date.now() - startedAt}ms: ${error.message}`);
    console.error(
      "Rows written before the failure are still committed — see the summary below.\n",
    );
  }

  const [added] = await pool.query(
    `SELECT t.Ticket_No, l.Type, COUNT(*) AS entries,
            ROUND(SUM(l.Amount), 2) AS total_amount,
            MIN(l.Description) AS first_entry,
            MAX(l.Description) AS last_entry
     FROM ticket_log l
     JOIN pawning_ticket t ON t.idPawning_Ticket = l.Pawning_Ticket_idPawning_Ticket
     WHERE l.idTicket_Log > ?
     GROUP BY t.Ticket_No, l.Type
     ORDER BY t.Ticket_No, l.Type`,
    [before.lastId],
  );

  if (added.length === 0) {
    console.log("No new ticket_log rows — everything was already up to date.");
  } else {
    console.log("New ticket_log entries by ticket and type:");
    console.table(added);
  }

  const [balances] = await pool.query(
    `SELECT t.Ticket_No,
            t.Status,
            t.Maturity_date,
            l.Advance_Balance,
            l.Interest_Balance,
            l.Late_Charges_Balance,
            l.Service_Charge_Balance,
            l.Total_Balance
     FROM pawning_ticket t
     JOIN ticket_log l ON l.idTicket_Log = (
       SELECT MAX(idTicket_Log) FROM ticket_log
       WHERE Pawning_Ticket_idPawning_Ticket = t.idPawning_Ticket
     )
     WHERE t.Status IN ('1', '3')
     ORDER BY t.Ticket_No`,
  );

  console.log("\nCurrent balances on active / overdue tickets:");
  console.table(balances);

  if (failure) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error("Runner failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
    await pool2.end();
  });
