/**
 * Verifies the Product Code segment of the generated ticket number.
 *
 * Reproduces what generatePawningTicketNumber does for each product in a
 * branch and prints the ticket number the next ticket would receive, so the
 * effect of a product code change is visible without going through the UI.
 *
 *   node scripts/verify_ticket_number_product_code.mjs [branchId] [companyId]
 */
import dotenv from "dotenv";
dotenv.config();

import { pool, pool2 } from "../utils/db.js";

const BRANCH_ID = Number(process.argv[2] || 105);
const COMPANY_ID = Number(process.argv[3] || 61);

// Mirrors resolveProductCodeSegment in pawning.ticket.controller.js.
const productCodeSegment = async (productId) => {
  if (!productId) return "000";
  const [rows] = await pool.query(
    "SELECT Product_Code FROM pawning_product WHERE idPawning_Product = ?",
    [productId],
  );
  const code = String(rows[0]?.Product_Code ?? "").trim();
  return code || productId.toString().padStart(3, "0");
};

const main = async () => {
  const [[format]] = await pool2.query(
    "SELECT format_type, format, auto_generate_start_from FROM pawning_ticket_format WHERE company_id = ?",
    [COMPANY_ID],
  );
  if (!format) throw new Error(`No ticket format for company ${COMPANY_ID}`);

  const [[branch]] = await pool2.query(
    "SELECT Branch_Code, Name FROM branch WHERE idBranch = ?",
    [BRANCH_ID],
  );

  const [branches] = await pool2.query(
    "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
    [COMPANY_ID],
  );
  let ticketCount = 0;
  for (const b of branches) {
    const [[row]] = await pool.query(
      "SELECT COUNT(*) AS count FROM pawning_ticket WHERE Branch_idBranch = ?",
      [b.idBranch],
    );
    ticketCount += row.count;
  }

  const [[customer]] = await pool.query(
    "SELECT idCustomer, Customer_Number FROM customer WHERE idCustomer = 1408",
  );

  const [products] = await pool.query(
    "SELECT idPawning_Product, Name, Product_Code FROM pawning_product WHERE Branch_idBranch = ? ORDER BY idPawning_Product",
    [BRANCH_ID],
  );

  console.log(`Company ${COMPANY_ID} · branch ${BRANCH_ID} (${branch?.Name})`);
  console.log(`Format: ${format.format}`);
  console.log("");

  for (const product of products) {
    const parts = format.format.split(/([-.\/])/);
    let ticketNo = "";
    for (const raw of parts) {
      const part = raw.trim();
      if (["-", ".", "/"].includes(part)) {
        ticketNo += part;
      } else if (part === "Branch Number") {
        ticketNo += branch?.Branch_Code || "00";
      } else if (part === "Product Code") {
        ticketNo += await productCodeSegment(product.idPawning_Product);
      } else if (part === "Customer Number") {
        ticketNo += String(customer?.Customer_Number ?? 0).padStart(4, "0");
      } else if (part === "Auto Create Number") {
        ticketNo += String(
          (format.auto_generate_start_from ?? 1) + ticketCount,
        );
      }
    }
    const code = product.Product_Code || "(none)";
    console.log(
      `  ${String(product.idPawning_Product).padEnd(4)} ${code.padEnd(8)} ${product.Name.padEnd(32)} ${ticketNo}`,
    );
  }

  await pool.end();
  await pool2.end();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
