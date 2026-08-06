import { pool, pool2 } from "../utils/db.js";
import { errorHandler } from "../utils/errorHandler.js";

/** Active / overdue tickets that still hold articles in vault */
const ACTIVE_STATUSES = "('1', '3')";

const paymentDateExpr = `DATE(STR_TO_DATE(REPLACE(SUBSTRING(p.Date_time, 1, 19), 'T', ' '), '%Y-%m-%d %H:%i:%s'))`;
const ticketDateExpr = `DATE(REPLACE(SUBSTRING(pt.Date_Time, 1, 19), 'T', ' '))`;
const maturityDateExpr = `DATE(REPLACE(SUBSTRING(pt.Maturity_date, 1, 19), 'T', ' '))`;
const paymentFeesExpr = `(
  COALESCE(CAST(p.Interest_Payment AS DECIMAL(18,2)), 0) +
  COALESCE(CAST(p.Service_Charge_Payment AS DECIMAL(18,2)), 0) +
  COALESCE(CAST(p.Late_Charges_Payment AS DECIMAL(18,2)), 0) +
  COALESCE(CAST(p.Other_Charges_Payment AS DECIMAL(18,2)), 0) +
  COALESCE(CAST(p.Early_Charge_Payment AS DECIMAL(18,2)), 0)
)`;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

async function enrichCustomerNames(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return rows;
  const ids = [
    ...new Set(
      rows
        .map((r) => Number(r.accountCenterCusId))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  ];
  if (ids.length === 0) {
    return rows.map((r) => ({
      ...r,
      customerName: r.customerNumber || r.customerName || "—",
      phone: r.phone || null,
    }));
  }

  try {
    const placeholders = ids.map(() => "?").join(",");
    const [customers] = await pool2.query(
      `SELECT idCompany_Customer, Full_Name, Contact_No_01
       FROM company_customer
       WHERE idCompany_Customer IN (${placeholders})`,
      ids,
    );
    const map = new Map(
      customers.map((c) => [Number(c.idCompany_Customer), c]),
    );
    return rows.map((r) => {
      const acc = map.get(Number(r.accountCenterCusId));
      return {
        ...r,
        customerName:
          acc?.Full_Name || r.customerNumber || r.customerName || "—",
        phone: acc?.Contact_No_01 || r.phone || null,
        customer: acc?.Full_Name || r.customerNumber || r.customer || "—",
        name: acc?.Full_Name || r.customerNumber || r.name || "—",
      };
    });
  } catch (err) {
    console.warn("[dashboard] enrichCustomerNames failed:", err.message);
    return rows.map((r) => ({
      ...r,
      customerName: r.customerNumber || r.customerName || "—",
      phone: r.phone || null,
    }));
  }
}

async function enrichUserNames(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return rows;
  const ids = [
    ...new Set(
      rows
        .map((r) => Number(r.user_id ?? r.userId))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  ];
  if (!ids.length) return rows;
  try {
    const placeholders = ids.map(() => "?").join(",");
    const [users] = await pool2.query(
      `SELECT idUser, full_name FROM user WHERE idUser IN (${placeholders})`,
      ids,
    );
    const map = new Map(users.map((u) => [Number(u.idUser), u.full_name]));
    return rows.map((r) => ({
      ...r,
      username: map.get(Number(r.user_id ?? r.userId)) || r.username || "—",
    }));
  } catch {
    return rows;
  }
}

const TABLE_PREVIEW_LIMIT = 8;

/**
 * Dashboard table cards return a short preview + total count for "Showing X of Y".
 */
async function tablePreview({
  countSql,
  countParams = [],
  dataSql,
  dataParams = [],
  mapRows,
}) {
  const [countRows] = await pool.query(countSql, countParams);
  const total = num(
    countRows[0]?.total ?? countRows[0]?.count ?? countRows[0]?.["COUNT(*)"],
  );
  const [rows] = await pool.query(`${dataSql} LIMIT ?`, [
    ...dataParams,
    TABLE_PREVIEW_LIMIT,
  ]);
  const mapped = mapRows ? await mapRows(rows) : rows;
  return {
    rows: Array.isArray(mapped) ? mapped : [],
    total,
    previewLimit: TABLE_PREVIEW_LIMIT,
  };
}

const emptyTablePreview = () => ({
  rows: [],
  total: 0,
  previewLimit: TABLE_PREVIEW_LIMIT,
});

const handlers = {
  // ─── SUMMARIES ───────────────────────────────────────────────────────────
  new_loans: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS newLoansCount,
         COALESCE(SUM(CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2))), 0) AS newLoansValue
       FROM pawning_ticket pt
       WHERE pt.Branch_idBranch = ?
         AND ${ticketDateExpr} = CURDATE()
         AND IFNULL(pt.Status, '0') IN ${ACTIVE_STATUSES}`,
      [branchId],
    );
    return {
      newLoansCount: num(rows[0]?.newLoansCount),
      newLoansValue: num(rows[0]?.newLoansValue),
    };
  },

  redemptions: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS redemptionsCount,
         COALESCE(SUM(CAST(p.Advance_Payment AS DECIMAL(18,2))), 0) AS redemptionsValue
       FROM payment p
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
       WHERE pt.Branch_idBranch = ?
         AND ${paymentDateExpr} = CURDATE()
         AND UPPER(p.Type) LIKE '%SETTLEMENT%'`,
      [branchId],
    );
    return {
      redemptionsCount: num(rows[0]?.redemptionsCount),
      redemptionsValue: num(rows[0]?.redemptionsValue),
    };
  },

  interest_collected: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(${paymentFeesExpr}), 0) AS interestFeesCollectedToday
       FROM payment p
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
       WHERE pt.Branch_idBranch = ?
         AND ${paymentDateExpr} = CURDATE()`,
      [branchId],
    );
    return {
      interestFeesCollectedToday: num(rows[0]?.interestFeesCollectedToday),
    };
  },

  net_cash_flow: async (branchId) => {
    const [inRows] = await pool.query(
      `SELECT COALESCE(SUM(CAST(p.Amount AS DECIMAL(18,2))), 0) AS inflow
       FROM payment p
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
       WHERE pt.Branch_idBranch = ?
         AND ${paymentDateExpr} = CURDATE()`,
      [branchId],
    );
    const [outRows] = await pool.query(
      `SELECT COALESCE(SUM(CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2))), 0) AS outflow
       FROM pawning_ticket pt
       WHERE pt.Branch_idBranch = ?
         AND ${ticketDateExpr} = CURDATE()
         AND IFNULL(pt.Status, '0') IN ${ACTIVE_STATUSES}`,
      [branchId],
    );
    return {
      netCashFlow: num(inRows[0]?.inflow) - num(outRows[0]?.outflow),
    };
  },

  new_pledges: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS newPledgesCount
       FROM pawning_ticket pt
       WHERE pt.Branch_idBranch = ?
         AND ${ticketDateExpr} = CURDATE()`,
      [branchId],
    );
    return { newPledgesCount: num(rows[0]?.newPledgesCount) };
  },

  wtd_new_loans: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS newLoansCount,
         COALESCE(SUM(CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2))), 0) AS wtdNewLoansValue
       FROM pawning_ticket pt
       WHERE pt.Branch_idBranch = ?
         AND ${ticketDateExpr} >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
         AND IFNULL(pt.Status, '0') IN ${ACTIVE_STATUSES}`,
      [branchId],
    );
    return {
      newLoansCount: num(rows[0]?.newLoansCount),
      wtdNewLoansValue: num(rows[0]?.wtdNewLoansValue),
      newLoansValue: num(rows[0]?.wtdNewLoansValue),
    };
  },

  mtd_interest: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(${paymentFeesExpr}), 0) AS mtdInterestIncome
       FROM payment p
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
       WHERE pt.Branch_idBranch = ?
         AND ${paymentDateExpr} >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
      [branchId],
    );
    return { mtdInterestIncome: num(rows[0]?.mtdInterestIncome) };
  },

  renewals_mtd: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS pledgesRenewedThisMonth
       FROM payment p
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
       WHERE pt.Branch_idBranch = ?
         AND ${paymentDateExpr} >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
         AND UPPER(p.Type) LIKE '%RENEWAL%'`,
      [branchId],
    );
    return {
      pledgesRenewedThisMonth: num(rows[0]?.pledgesRenewedThisMonth),
    };
  },

  active_loan_capital: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(CAST(pt.Balance_Amount AS DECIMAL(18,2))), 0) AS totalActiveLoanCapital
       FROM pawning_ticket pt
       WHERE pt.Branch_idBranch = ?
         AND IFNULL(pt.Status, '0') IN ${ACTIVE_STATUSES}`,
      [branchId],
    );
    return {
      totalActiveLoanCapital: num(rows[0]?.totalActiveLoanCapital),
    };
  },

  articles_in_vault: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS totalArticlesInVault
       FROM ticket_articles ta
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = ta.Pawning_Ticket_idPawning_Ticket
       WHERE pt.Branch_idBranch = ?
         AND IFNULL(pt.Status, '0') IN ${ACTIVE_STATUSES}`,
      [branchId],
    );
    return { totalArticlesInVault: num(rows[0]?.totalArticlesInVault) };
  },

  gold_weight: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(CAST(ta.Net_Weight AS DECIMAL(18,3))), 0) AS totalGoldWeightGrams
       FROM ticket_articles ta
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = ta.Pawning_Ticket_idPawning_Ticket
       WHERE pt.Branch_idBranch = ?
         AND IFNULL(pt.Status, '0') IN ${ACTIVE_STATUSES}`,
      [branchId],
    );
    return { totalGoldWeightGrams: num(rows[0]?.totalGoldWeightGrams) };
  },

  avg_ltv: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT AVG(
         CASE
           WHEN CAST(pt.Assessed_Value AS DECIMAL(18,2)) > 0
           THEN (CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2)) /
                 CAST(pt.Assessed_Value AS DECIMAL(18,2))) * 100
           ELSE NULL
         END
       ) AS averageLTV
       FROM pawning_ticket pt
       WHERE pt.Branch_idBranch = ?
         AND IFNULL(pt.Status, '0') IN ${ACTIVE_STATUSES}`,
      [branchId],
    );
    return { averageLTV: num(rows[0]?.averageLTV) };
  },

  expiring_count: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS articlesExpiringIn7Days
       FROM pawning_ticket pt
       WHERE pt.Branch_idBranch = ?
         AND IFNULL(pt.Status, '0') = '1'
         AND ${maturityDateExpr} BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`,
      [branchId],
    );
    return {
      articlesExpiringIn7Days: num(rows[0]?.articlesExpiringIn7Days),
    };
  },

  overdue_count: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS overdueArticlesCount
       FROM pawning_ticket pt
       WHERE pt.Branch_idBranch = ?
         AND IFNULL(pt.Status, '0') = '3'`,
      [branchId],
    );
    return { overdueArticlesCount: num(rows[0]?.overdueArticlesCount) };
  },

  new_customers: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS newCustomersToday
       FROM customer c
       WHERE c.Branch_idBranch = ?
         AND DATE(c.created_at) = CURDATE()`,
      [branchId],
    );
    return { newCustomersToday: num(rows[0]?.newCustomersToday) };
  },

  // ─── TABLES (preview + total for dashboard cards) ────────────────────────
  expiring_articles: async (branchId) => {
    const where = `pt.Branch_idBranch = ?
         AND IFNULL(pt.Status, '0') = '1'
         AND ${maturityDateExpr} BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`;
    return tablePreview({
      countSql: `SELECT COUNT(*) AS total FROM pawning_ticket pt WHERE ${where}`,
      countParams: [branchId],
      dataSql: `SELECT
         pt.Ticket_No AS articleId,
         c.Customer_Number AS customerNumber,
         c.accountCenterCusId,
         pt.Maturity_date AS expiryDate,
         CAST(pt.Balance_Amount AS DECIMAL(18,2)) AS amountDue
       FROM pawning_ticket pt
       LEFT JOIN customer c ON c.idCustomer = pt.Customer_idCustomer
       WHERE ${where}
       ORDER BY ${maturityDateExpr} ASC`,
      dataParams: [branchId],
      mapRows: enrichCustomerNames,
    });
  },

  overdue_articles: async (branchId) => {
    const where = `pt.Branch_idBranch = ?
         AND IFNULL(pt.Status, '0') = '3'`;
    return tablePreview({
      countSql: `SELECT COUNT(*) AS total FROM pawning_ticket pt WHERE ${where}`,
      countParams: [branchId],
      dataSql: `SELECT
         pt.Ticket_No AS articleId,
         c.Customer_Number AS customerNumber,
         c.accountCenterCusId,
         DATEDIFF(CURDATE(), ${maturityDateExpr}) AS daysOverdue,
         CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2)) AS principal,
         CAST(IFNULL(pt.Interest_Amount_Balance, 0) AS DECIMAL(18,2)) AS interestAccrued
       FROM pawning_ticket pt
       LEFT JOIN customer c ON c.idCustomer = pt.Customer_idCustomer
       WHERE ${where}
       ORDER BY daysOverdue DESC`,
      dataParams: [branchId],
      mapRows: enrichCustomerNames,
    });
  },

  transaction_log: async (branchId) => {
    const where = `pt.Branch_idBranch = ?
         AND ${paymentDateExpr} = CURDATE()`;
    return tablePreview({
      countSql: `SELECT COUNT(*) AS total
       FROM payment p
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
       WHERE ${where}`,
      countParams: [branchId],
      dataSql: `SELECT
         p.Date_time AS time,
         p.Type AS type,
         p.Ticket_no AS articleId,
         c.Customer_Number AS customerNumber,
         c.accountCenterCusId,
         CAST(p.Amount AS DECIMAL(18,2)) AS amount,
         p.Description AS note
       FROM payment p
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
       LEFT JOIN customer c ON c.idCustomer = pt.Customer_idCustomer
       WHERE ${where}
       ORDER BY STR_TO_DATE(REPLACE(SUBSTRING(p.Date_time, 1, 19), 'T', ' '), '%Y-%m-%d %H:%i:%s') DESC`,
      dataParams: [branchId],
      mapRows: async (rows) => {
        const enriched = await enrichCustomerNames(rows);
        return enriched.map((r) => ({ ...r, customer: r.customerName }));
      },
    });
  },

  high_value_transactions: async (branchId) => {
    const where = `pt.Branch_idBranch = ?
         AND CAST(p.Amount AS DECIMAL(18,2)) >= 200000`;
    return tablePreview({
      countSql: `SELECT COUNT(*) AS total
       FROM payment p
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
       WHERE ${where}`,
      countParams: [branchId],
      dataSql: `SELECT
         p.Date_time AS time,
         p.id AS transactionId,
         c.Customer_Number AS customerNumber,
         c.accountCenterCusId,
         CAST(p.Amount AS DECIMAL(18,2)) AS amount,
         p.Type AS status
       FROM payment p
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
       LEFT JOIN customer c ON c.idCustomer = pt.Customer_idCustomer
       WHERE ${where}
       ORDER BY CAST(p.Amount AS DECIMAL(18,2)) DESC`,
      dataParams: [branchId],
      mapRows: async (rows) => {
        const enriched = await enrichCustomerNames(rows);
        return enriched.map((r) => ({ ...r, customer: r.customerName }));
      },
    });
  },

  active_articles: async (branchId) => {
    const where = `pt.Branch_idBranch = ?
         AND IFNULL(pt.Status, '0') IN ${ACTIVE_STATUSES}`;
    return tablePreview({
      countSql: `SELECT COUNT(*) AS total
       FROM ticket_articles ta
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = ta.Pawning_Ticket_idPawning_Ticket
       WHERE ${where}`,
      countParams: [branchId],
      dataSql: `SELECT
         ta.idTicket_Articles AS articleId,
         pt.Ticket_No AS pledgeId,
         c.Customer_Number AS customerNumber,
         c.accountCenterCusId,
         CONCAT(IFNULL(ta.Article_category, ''), ' / ', IFNULL(ta.Caratage, ''), 'K') AS description,
         CASE IFNULL(pt.Status, '0')
           WHEN '1' THEN 'Active'
           WHEN '3' THEN 'Overdue'
           ELSE IFNULL(pt.Status, '0')
         END AS status,
         CAST(IFNULL(ta.Advanced_Value, pt.Pawning_Advance_Amount) AS DECIMAL(18,2)) AS amount
       FROM ticket_articles ta
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = ta.Pawning_Ticket_idPawning_Ticket
       LEFT JOIN customer c ON c.idCustomer = pt.Customer_idCustomer
       WHERE ${where}
       ORDER BY pt.idPawning_Ticket DESC`,
      dataParams: [branchId],
      mapRows: async (rows) => {
        const enriched = await enrichCustomerNames(rows);
        return enriched.map((r) => ({ ...r, customer: r.customerName }));
      },
    });
  },

  vault_inventory: async (branchId) => {
    const where = `pt.Branch_idBranch = ?
         AND IFNULL(pt.Status, '0') IN ${ACTIVE_STATUSES}`;
    return tablePreview({
      countSql: `SELECT COUNT(*) AS total
       FROM ticket_articles ta
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = ta.Pawning_Ticket_idPawning_Ticket
       WHERE ${where}`,
      countParams: [branchId],
      dataSql: `SELECT
         ta.idTicket_Articles AS articleId,
         pt.Ticket_No AS pledgeId,
         CONCAT(IFNULL(ta.Article_category, 'Item'), ' (', IFNULL(ta.Article_Condition, '-'), ')') AS description,
         CAST(IFNULL(ta.Net_Weight, 0) AS DECIMAL(18,3)) AS weight,
         ta.Caratage AS karat,
         CONCAT('Branch ', pt.Branch_idBranch) AS location
       FROM ticket_articles ta
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = ta.Pawning_Ticket_idPawning_Ticket
       WHERE ${where}
       ORDER BY ta.idTicket_Articles DESC`,
      dataParams: [branchId],
    });
  },

  customer_list: async (branchId) => {
    return tablePreview({
      countSql: `SELECT COUNT(*) AS total FROM customer c WHERE c.Branch_idBranch = ?`,
      countParams: [branchId],
      dataSql: `SELECT
         c.idCustomer AS customerId,
         c.Customer_Number AS customerNumber,
         c.accountCenterCusId,
         COALESCE(SUM(CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2))), 0) AS totalLoanVolume,
         CASE WHEN c.status = 1 THEN 'Active' ELSE 'Inactive' END AS status
       FROM customer c
       LEFT JOIN pawning_ticket pt ON pt.Customer_idCustomer = c.idCustomer
       WHERE c.Branch_idBranch = ?
       GROUP BY c.idCustomer, c.Customer_Number, c.accountCenterCusId, c.status
       ORDER BY totalLoanVolume DESC`,
      dataParams: [branchId],
      mapRows: enrichCustomerNames,
    });
  },

  settled_last_month: async (branchId) => {
    const where = `pt.Branch_idBranch = ?
         AND IFNULL(pt.Status, '0') = '2'
         AND DATE(COALESCE(pt.updated_at, pt.created_at)) >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
         AND DATE(COALESCE(pt.updated_at, pt.created_at)) < DATE_FORMAT(CURDATE(), '%Y-%m-01')`;
    return tablePreview({
      countSql: `SELECT COUNT(*) AS total FROM pawning_ticket pt WHERE ${where}`,
      countParams: [branchId],
      dataSql: `SELECT
         pt.Ticket_No AS articleId,
         pt.Ticket_No AS pledgeId,
         c.Customer_Number AS customerNumber,
         c.accountCenterCusId,
         COALESCE(pt.updated_at, pt.created_at) AS settledDate,
         CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2)) AS amount
       FROM pawning_ticket pt
       LEFT JOIN customer c ON c.idCustomer = pt.Customer_idCustomer
       WHERE ${where}
       ORDER BY COALESCE(pt.updated_at, pt.created_at) DESC`,
      dataParams: [branchId],
      mapRows: async (rows) => {
        const enriched = await enrichCustomerNames(rows);
        return enriched.map((r) => ({ ...r, customer: r.customerName }));
      },
    });
  },

  renewals_last_month: async (branchId) => {
    const where = `pt.Branch_idBranch = ?
         AND UPPER(p.Type) LIKE '%RENEWAL%'
         AND ${paymentDateExpr} >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
         AND ${paymentDateExpr} < DATE_FORMAT(CURDATE(), '%Y-%m-01')`;
    return tablePreview({
      countSql: `SELECT COUNT(*) AS total
       FROM payment p
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
       WHERE ${where}`,
      countParams: [branchId],
      dataSql: `SELECT
         p.Ticket_no AS articleId,
         p.Ticket_no AS pledgeId,
         c.Customer_Number AS customerNumber,
         c.accountCenterCusId,
         p.Date_time AS renewalDate,
         CAST(p.Amount AS DECIMAL(18,2)) AS amount
       FROM payment p
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
       LEFT JOIN customer c ON c.idCustomer = pt.Customer_idCustomer
       WHERE ${where}
       ORDER BY STR_TO_DATE(REPLACE(SUBSTRING(p.Date_time, 1, 19), 'T', ' '), '%Y-%m-%d %H:%i:%s') DESC`,
      dataParams: [branchId],
      mapRows: async (rows) => {
        const enriched = await enrichCustomerNames(rows);
        return enriched.map((r) => ({ ...r, customer: r.customerName }));
      },
    });
  },

  activity_log: async (branchId, companyId) => {
    let userIds = [];
    try {
      const [users] = await pool2.query(
        "SELECT idUser FROM user WHERE Company_idCompany = ?",
        [companyId],
      );
      userIds = users.map((u) => String(u.idUser));
    } catch {
      userIds = [];
    }
    if (!userIds.length) return emptyTablePreview();

    return tablePreview({
      countSql: `SELECT COUNT(*) AS total
       FROM activity_logs al
       WHERE al.user_id IN (?)
         AND al.action NOT LIKE '%Log In%'`,
      countParams: [userIds],
      dataSql: `SELECT
         al.id,
         al.created_at AS time,
         al.action,
         al.user_id,
         al.status
       FROM activity_logs al
       WHERE al.user_id IN (?)
         AND al.action NOT LIKE '%Log In%'
       ORDER BY al.created_at DESC`,
      dataParams: [userIds],
      mapRows: async (rows) => {
        const enriched = await enrichUserNames(
          rows.map((r) => ({ ...r, userId: r.user_id })),
        );
        return enriched.map((r) => ({
          time: r.time,
          user: r.username,
          action: r.action,
          details: r.status,
        }));
      },
    });
  },

  top_customers: async (branchId) => {
    return tablePreview({
      countSql: `SELECT COUNT(DISTINCT c.idCustomer) AS total
       FROM customer c
       INNER JOIN pawning_ticket pt ON pt.Customer_idCustomer = c.idCustomer
       WHERE c.Branch_idBranch = ?`,
      countParams: [branchId],
      dataSql: `SELECT
         c.idCustomer AS customerId,
         c.Customer_Number AS customerNumber,
         c.accountCenterCusId,
         COUNT(pt.idPawning_Ticket) AS ticketCount,
         COALESCE(SUM(CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2))), 0) AS totalLoanVolume
       FROM customer c
       INNER JOIN pawning_ticket pt ON pt.Customer_idCustomer = c.idCustomer
       WHERE c.Branch_idBranch = ?
       GROUP BY c.idCustomer, c.Customer_Number, c.accountCenterCusId
       ORDER BY totalLoanVolume DESC`,
      dataParams: [branchId],
      mapRows: enrichCustomerNames,
    });
  },

  // ─── CHARTS ──────────────────────────────────────────────────────────────
  loans_vs_redemptions: async (branchId) => {
    const [loanRows] = await pool.query(
      `SELECT ${ticketDateExpr} AS date,
              COALESCE(SUM(CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2))), 0) AS loans
       FROM pawning_ticket pt
       WHERE pt.Branch_idBranch = ?
         AND ${ticketDateExpr} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         AND IFNULL(pt.Status, '0') NOT IN ('-1')
       GROUP BY ${ticketDateExpr}
       ORDER BY date ASC`,
      [branchId],
    );
    const [redemptionRows] = await pool.query(
      `SELECT ${paymentDateExpr} AS date,
              COALESCE(SUM(CAST(p.Amount AS DECIMAL(18,2))), 0) AS redemptions
       FROM payment p
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
       WHERE pt.Branch_idBranch = ?
         AND ${paymentDateExpr} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         AND UPPER(p.Type) LIKE '%SETTLEMENT%'
       GROUP BY ${paymentDateExpr}
       ORDER BY date ASC`,
      [branchId],
    );
    const dateMap = {};
    loanRows.forEach((r) => {
      const d = r.date ? String(r.date).slice(0, 10) : null;
      if (!d) return;
      dateMap[d] = { date: d, loans: num(r.loans), redemptions: 0 };
    });
    redemptionRows.forEach((r) => {
      const d = r.date ? String(r.date).slice(0, 10) : null;
      if (!d) return;
      if (dateMap[d]) dateMap[d].redemptions = num(r.redemptions);
      else dateMap[d] = { date: d, loans: 0, redemptions: num(r.redemptions) };
    });
    return Object.values(dateMap).sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
  },

  monthly_income: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT
         DATE_FORMAT(${paymentDateExpr}, '%b') AS month,
         COALESCE(SUM(CAST(p.Interest_Payment AS DECIMAL(18,2))), 0) AS interest,
         COALESCE(SUM(
           CAST(IFNULL(p.Service_Charge_Payment,0) AS DECIMAL(18,2)) +
           CAST(IFNULL(p.Late_Charges_Payment,0) AS DECIMAL(18,2)) +
           CAST(IFNULL(p.Other_Charges_Payment,0) AS DECIMAL(18,2)) +
           CAST(IFNULL(p.Early_Charge_Payment,0) AS DECIMAL(18,2))
         ), 0) AS fees
       FROM payment p
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
       WHERE pt.Branch_idBranch = ?
         AND ${paymentDateExpr} >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY YEAR(${paymentDateExpr}), MONTH(${paymentDateExpr})
       ORDER BY YEAR(${paymentDateExpr}) ASC, MONTH(${paymentDateExpr}) ASC`,
      [branchId],
    );
    return rows.map((r) => ({
      month: r.month,
      interest: num(r.interest),
      fees: num(r.fees),
    }));
  },

  revenue_sources: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT
         COALESCE(SUM(CAST(p.Interest_Payment AS DECIMAL(18,2))), 0) AS interest,
         COALESCE(SUM(CAST(p.Service_Charge_Payment AS DECIMAL(18,2))), 0) AS serviceCharge,
         COALESCE(SUM(CAST(p.Late_Charges_Payment AS DECIMAL(18,2))), 0) AS lateCharge,
         COALESCE(SUM(CAST(p.Early_Charge_Payment AS DECIMAL(18,2))), 0) AS earlyCharge,
         COALESCE(SUM(CAST(p.Other_Charges_Payment AS DECIMAL(18,2))), 0) AS other
       FROM payment p
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
       WHERE pt.Branch_idBranch = ?
         AND ${paymentDateExpr} >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`,
      [branchId],
    );
    const r = rows[0] || {};
    return [
      { name: "Interest", value: num(r.interest) },
      { name: "Service Charge", value: num(r.serviceCharge) },
      { name: "Late Charge", value: num(r.lateCharge) },
      { name: "Early Charge", value: num(r.earlyCharge) },
      { name: "Other", value: num(r.other) },
    ].filter((x) => x.value > 0);
  },

  busiest_hours: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT
         HOUR(STR_TO_DATE(REPLACE(SUBSTRING(p.Date_time, 1, 19), 'T', ' '), '%Y-%m-%d %H:%i:%s')) AS hour,
         COUNT(*) AS count
       FROM payment p
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
       WHERE pt.Branch_idBranch = ?
         AND ${paymentDateExpr} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY hour
       ORDER BY hour ASC`,
      [branchId],
    );
    return rows.map((r) => ({
      hour: `${String(r.hour).padStart(2, "0")}:00`,
      count: num(r.count),
    }));
  },

  new_vs_repeat: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT
         CASE WHEN ticket_count = 1 THEN 'New' ELSE 'Repeat' END AS name,
         COUNT(*) AS value
       FROM (
         SELECT pt.Customer_idCustomer, COUNT(*) AS ticket_count
         FROM pawning_ticket pt
         WHERE pt.Branch_idBranch = ?
         GROUP BY pt.Customer_idCustomer
       ) t
       GROUP BY name`,
      [branchId],
    );
    return rows.map((r) => ({ name: r.name, value: num(r.value) }));
  },

  customer_acquisition: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(c.created_at, '%b') AS month,
              COUNT(*) AS newCustomers
       FROM customer c
       WHERE c.Branch_idBranch = ?
         AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY YEAR(c.created_at), MONTH(c.created_at)
       ORDER BY YEAR(c.created_at) ASC, MONTH(c.created_at) ASC`,
      [branchId],
    );
    return rows.map((r) => ({
      month: r.month,
      newCustomers: num(r.newCustomers),
    }));
  },

  loan_value_distribution: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT
         CASE
           WHEN CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2)) < 25000 THEN '< 25K'
           WHEN CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2)) < 100000 THEN '25K–100K'
           WHEN CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2)) < 500000 THEN '100K–500K'
           ELSE '500K+'
         END AS name,
         COUNT(*) AS value
       FROM pawning_ticket pt
       WHERE pt.Branch_idBranch = ?
         AND IFNULL(pt.Status, '0') IN ${ACTIVE_STATUSES}
       GROUP BY name
       ORDER BY MIN(CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2)))`,
      [branchId],
    );
    return rows.map((r) => ({ name: r.name, value: num(r.value) }));
  },

  karat_distribution: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT CONCAT(IFNULL(ta.Caratage, '?'), 'K') AS name,
              COUNT(*) AS value
       FROM ticket_articles ta
       INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = ta.Pawning_Ticket_idPawning_Ticket
       WHERE pt.Branch_idBranch = ?
         AND IFNULL(pt.Status, '0') IN ${ACTIVE_STATUSES}
       GROUP BY ta.Caratage
       ORDER BY CAST(ta.Caratage AS UNSIGNED) ASC`,
      [branchId],
    );
    return rows.map((r) => ({ name: r.name, value: num(r.value) }));
  },

  articles_by_status: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT
         CASE IFNULL(pt.Status, '0')
           WHEN '0' THEN 'Pending'
           WHEN '-1' THEN 'Rejected'
           WHEN '1' THEN 'Active'
           WHEN '2' THEN 'Settled'
           WHEN '3' THEN 'Overdue'
           ELSE CONCAT('Status ', IFNULL(pt.Status, '0'))
         END AS name,
         COUNT(*) AS value
       FROM pawning_ticket pt
       WHERE pt.Branch_idBranch = ?
       GROUP BY IFNULL(pt.Status, '0')`,
      [branchId],
    );
    return rows.map((r) => ({ name: r.name, value: num(r.value) }));
  },

  ltv_distribution: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT
         CASE
           WHEN ltv < 40 THEN '< 40%'
           WHEN ltv < 60 THEN '40–60%'
           WHEN ltv < 80 THEN '60–80%'
           ELSE '80%+'
         END AS name,
         COUNT(*) AS value
       FROM (
         SELECT
           CASE
             WHEN CAST(pt.Assessed_Value AS DECIMAL(18,2)) > 0
             THEN (CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2)) /
                   CAST(pt.Assessed_Value AS DECIMAL(18,2))) * 100
             ELSE 0
           END AS ltv
         FROM pawning_ticket pt
         WHERE pt.Branch_idBranch = ?
           AND IFNULL(pt.Status, '0') IN ${ACTIVE_STATUSES}
       ) t
       GROUP BY name`,
      [branchId],
    );
    return rows.map((r) => ({ name: r.name, value: num(r.value) }));
  },

  month_comparison: async (branchId) => {
    const [thisMonth] = await pool.query(
      `SELECT
         (SELECT COALESCE(SUM(CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2))), 0)
          FROM pawning_ticket pt
          WHERE pt.Branch_idBranch = ?
            AND ${ticketDateExpr} >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS loans,
         (SELECT COALESCE(SUM(CAST(p.Amount AS DECIMAL(18,2))), 0)
          FROM payment p
          INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
          WHERE pt.Branch_idBranch = ?
            AND ${paymentDateExpr} >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
            AND UPPER(p.Type) LIKE '%SETTLEMENT%') AS redemptions,
         (SELECT COALESCE(SUM(${paymentFeesExpr}), 0)
          FROM payment p
          INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
          WHERE pt.Branch_idBranch = ?
            AND ${paymentDateExpr} >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS income`,
      [branchId, branchId, branchId],
    );
    const [lastMonth] = await pool.query(
      `SELECT
         (SELECT COALESCE(SUM(CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2))), 0)
          FROM pawning_ticket pt
          WHERE pt.Branch_idBranch = ?
            AND ${ticketDateExpr} >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
            AND ${ticketDateExpr} < DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS loans,
         (SELECT COALESCE(SUM(CAST(p.Amount AS DECIMAL(18,2))), 0)
          FROM payment p
          INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
          WHERE pt.Branch_idBranch = ?
            AND ${paymentDateExpr} >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
            AND ${paymentDateExpr} < DATE_FORMAT(CURDATE(), '%Y-%m-01')
            AND UPPER(p.Type) LIKE '%SETTLEMENT%') AS redemptions,
         (SELECT COALESCE(SUM(${paymentFeesExpr}), 0)
          FROM payment p
          INNER JOIN pawning_ticket pt ON pt.idPawning_Ticket = p.Pawning_Ticket_idPawning_Ticket
          WHERE pt.Branch_idBranch = ?
            AND ${paymentDateExpr} >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
            AND ${paymentDateExpr} < DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS income`,
      [branchId, branchId, branchId],
    );
    return [
      {
        metric: "Loans",
        thisMonth: num(thisMonth[0]?.loans),
        lastMonth: num(lastMonth[0]?.loans),
      },
      {
        metric: "Redemptions",
        thisMonth: num(thisMonth[0]?.redemptions),
        lastMonth: num(lastMonth[0]?.redemptions),
      },
      {
        metric: "Income",
        thisMonth: num(thisMonth[0]?.income),
        lastMonth: num(lastMonth[0]?.income),
      },
    ];
  },

  weekly_performance: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT
         DATE_FORMAT(${ticketDateExpr}, '%a') AS day,
         COALESCE(SUM(CAST(pt.Pawning_Advance_Amount AS DECIMAL(18,2))), 0) AS loans,
         COUNT(*) AS count
       FROM pawning_ticket pt
       WHERE pt.Branch_idBranch = ?
         AND ${ticketDateExpr} >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
       GROUP BY ${ticketDateExpr}
       ORDER BY ${ticketDateExpr} ASC`,
      [branchId],
    );
    return rows.map((r) => ({
      day: r.day,
      loans: num(r.loans),
      count: num(r.count),
    }));
  },

  expiry_volume: async (branchId) => {
    const [rows] = await pool.query(
      `SELECT
         ${maturityDateExpr} AS date,
         COUNT(*) AS count,
         COALESCE(SUM(CAST(pt.Balance_Amount AS DECIMAL(18,2))), 0) AS amount
       FROM pawning_ticket pt
       WHERE pt.Branch_idBranch = ?
         AND IFNULL(pt.Status, '0') = '1'
         AND ${maturityDateExpr} BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
       GROUP BY ${maturityDateExpr}
       ORDER BY date ASC`,
      [branchId],
    );
    return rows.map((r) => ({
      date: r.date ? String(r.date).slice(0, 10) : "",
      count: num(r.count),
      amount: num(r.amount),
    }));
  },
};

/**
 * GET /api/dashboard/:branchId/metrics?cards=key1,key2
 */
export const getDashboardMetrics = async (req, res, next) => {
  try {
    const branchId = req.params.branchId || req.branchId;
    const companyId = req.companyId;
    const requestedCards = [
      ...new Set(
        String(req.query.cards || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ];

    if (!branchId) {
      return next(errorHandler(400, "Branch ID is required"));
    }

    if (requestedCards.length === 0) {
      return res.status(200).json({ success: true, data: {} });
    }

    const data = {};
    await Promise.all(
      requestedCards.map(async (key) => {
        const handler = handlers[key];
        if (!handler) {
          data[key] = null;
          return;
        }
        try {
          data[key] = await handler(branchId, companyId);
        } catch (err) {
          console.error(`[dashboard] metric "${key}" failed:`, err.message);
          data[key] = null;
        }
      }),
    );

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in getDashboardMetrics:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};
