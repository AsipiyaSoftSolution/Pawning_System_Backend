import { pool } from "../utils/db.js";
import { errorHandler } from "../utils/errorHandler.js";

/**
 * GET /api/dashboard/:branchId/metrics
 *
 * Fetches data ONLY for the card types that are active (passed as ?cards=
 * comma-separated list from the frontend).
 *
 * Supported card keys:
 *  summary  → new_loans, redemptions, interest_collected, active_loan_capital
 *  table    → expiring_articles, overdue_articles
 *  chart    → loans_vs_redemptions, monthly_income
 */
export const getDashboardMetrics = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    // e.g. ?cards=new_loans,expiring_articles,loans_vs_redemptions
    const requestedCards = (req.query.cards || "").split(",").filter(Boolean);

    if (requestedCards.length === 0) {
      return res.status(200).json({ success: true, data: {} });
    }

    const data = {};

    // ─── SUMMARY CARDS ───────────────────────────────────────────────────────

    // Sample: "New Loans Today" summary card
    if (requestedCards.includes("new_loans")) {
      const [rows] = await pool.query(
        `SELECT 
           COUNT(*) AS newLoansCount,
           COALESCE(SUM(pt.pawningAmount), 0) AS newLoansValue
         FROM pawningTicket pt
         WHERE pt.Branch_idBranch = ?
           AND DATE(pt.createdAt) = CURDATE()
           AND pt.status = 'active'`,
        [branchId]
      );
      data.new_loans = {
        newLoansCount: rows[0]?.newLoansCount ?? 0,
        newLoansValue: rows[0]?.newLoansValue ?? 0,
      };
    }

    // Sample: "Redemptions Today" summary card
    if (requestedCards.includes("redemptions")) {
      const [rows] = await pool.query(
        `SELECT
           COUNT(*) AS redemptionsCount,
           COALESCE(SUM(pp.principal), 0) AS redemptionsValue
         FROM pawningTicketPayment pp
         WHERE pp.Branch_idBranch = ?
           AND DATE(pp.createdAt) = CURDATE()
           AND pp.type = 'settlement'`,
        [branchId]
      );
      data.redemptions = {
        redemptionsCount: rows[0]?.redemptionsCount ?? 0,
        redemptionsValue: rows[0]?.redemptionsValue ?? 0,
      };
    }

    // Sample: "Interest & Fees Collected" summary card
    if (requestedCards.includes("interest_collected")) {
      const [rows] = await pool.query(
        `SELECT COALESCE(SUM(pp.interest + pp.fees), 0) AS interestFeesCollectedToday
         FROM pawningTicketPayment pp
         WHERE pp.Branch_idBranch = ?
           AND DATE(pp.createdAt) = CURDATE()`,
        [branchId]
      );
      data.interest_collected = {
        interestFeesCollectedToday: rows[0]?.interestFeesCollectedToday ?? 0,
      };
    }

    // Sample: "Active Loan Capital" summary card
    if (requestedCards.includes("active_loan_capital")) {
      const [rows] = await pool.query(
        `SELECT COALESCE(SUM(pt.pawningAmount), 0) AS totalActiveLoanCapital
         FROM pawningTicket pt
         WHERE pt.Branch_idBranch = ?
           AND pt.status = 'active'`,
        [branchId]
      );
      data.active_loan_capital = {
        totalActiveLoanCapital: rows[0]?.totalActiveLoanCapital ?? 0,
      };
    }

    // ─── TABLE CARDS ─────────────────────────────────────────────────────────

    // Sample: "Expiring Articles" table card (articles expiring in next 7 days)
    if (requestedCards.includes("expiring_articles")) {
      const [rows] = await pool.query(
        `SELECT 
           pa.idPawningArticle AS articleId,
           CONCAT(c.firstName, ' ', c.lastName) AS customerName,
           c.mobileNo AS phone,
           pt.expiryDate,
           pt.pawningAmount AS amountDue
         FROM pawningArticle pa
         JOIN pawningTicket pt ON pa.pawningTicket_idPawningTicket = pt.idPawningTicket
         JOIN customer c ON pt.customer_idCustomer = c.idCustomer
         WHERE pt.Branch_idBranch = ?
           AND pt.status = 'active'
           AND pt.expiryDate BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
         ORDER BY pt.expiryDate ASC
         LIMIT 50`,
        [branchId]
      );
      data.expiring_articles = rows;
    }

    // Sample: "Overdue Articles" table card
    if (requestedCards.includes("overdue_articles")) {
      const [rows] = await pool.query(
        `SELECT 
           pa.idPawningArticle AS articleId,
           CONCAT(c.firstName, ' ', c.lastName) AS customerName,
           DATEDIFF(CURDATE(), pt.expiryDate) AS daysOverdue,
           pt.pawningAmount AS principal,
           0 AS interestAccrued
         FROM pawningArticle pa
         JOIN pawningTicket pt ON pa.pawningTicket_idPawningTicket = pt.idPawningTicket
         JOIN customer c ON pt.customer_idCustomer = c.idCustomer
         WHERE pt.Branch_idBranch = ?
           AND pt.status = 'active'
           AND pt.expiryDate < CURDATE()
         ORDER BY daysOverdue DESC
         LIMIT 50`,
        [branchId]
      );
      data.overdue_articles = rows;
    }

    // ─── CHART CARDS ─────────────────────────────────────────────────────────

    // Sample: "Loan vs Redemption Trend" chart card (last 30 days)
    if (requestedCards.includes("loans_vs_redemptions")) {
      const [rows] = await pool.query(
        `SELECT 
           DATE(pt.createdAt) AS date,
           COALESCE(SUM(pt.pawningAmount), 0) AS loans
         FROM pawningTicket pt
         WHERE pt.Branch_idBranch = ?
           AND pt.createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         GROUP BY DATE(pt.createdAt)
         ORDER BY date ASC`,
        [branchId]
      );

      const [redemptionRows] = await pool.query(
        `SELECT 
           DATE(pp.createdAt) AS date,
           COALESCE(SUM(pp.principal), 0) AS redemptions
         FROM pawningTicketPayment pp
         WHERE pp.Branch_idBranch = ?
           AND pp.createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
           AND pp.type = 'settlement'
         GROUP BY DATE(pp.createdAt)
         ORDER BY date ASC`,
        [branchId]
      );

      // Merge both arrays by date
      const dateMap = {};
      rows.forEach((r) => {
        dateMap[r.date] = { date: r.date, loans: Number(r.loans), redemptions: 0 };
      });
      redemptionRows.forEach((r) => {
        if (dateMap[r.date]) {
          dateMap[r.date].redemptions = Number(r.redemptions);
        } else {
          dateMap[r.date] = { date: r.date, loans: 0, redemptions: Number(r.redemptions) };
        }
      });

      data.loans_vs_redemptions = Object.values(dateMap).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
    }

    // Sample: "Monthly Income Trend" chart card (last 12 months)
    if (requestedCards.includes("monthly_income")) {
      const [rows] = await pool.query(
        `SELECT 
           DATE_FORMAT(pp.createdAt, '%b') AS month,
           COALESCE(SUM(pp.interest), 0) AS interest,
           COALESCE(SUM(pp.fees), 0) AS fees
         FROM pawningTicketPayment pp
         WHERE pp.Branch_idBranch = ?
           AND pp.createdAt >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
         GROUP BY YEAR(pp.createdAt), MONTH(pp.createdAt)
         ORDER BY YEAR(pp.createdAt) ASC, MONTH(pp.createdAt) ASC`,
        [branchId]
      );
      data.monthly_income = rows;
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error in getDashboardMetrics:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};
