import { errorHandler } from "../utils/errorHandler.js";
import { pool, pool2 } from "../utils/db.js";
import {
  getReportPaginationData,
  getCompanyBranches,
} from "../utils/helper.js";
import { subsystemApi } from "../api/accountCenterApi.js";

// Full Ticket Details Report Controller
export const fullTicketDetailsReport = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { start_date, end_date, branchId, status } = req.query;

    let branchIds;
    if (branchId) {
      // means we got the branch Id
      branchIds = [branchId];
    } else {
      // have to use acc center api to get company branch ids
      try {
        const accessToken = req.accessToken;
        const branches = await subsystemApi.branches(
          req.companyId,
          accessToken,
        );
        branchIds = (branches.branches || []).map((branch) => branch.idBranch);
      } catch (error) {
        console.error("Error in full ticket details report:", error);
        return next(errorHandler(500, "Internal server error"));
      }
    }

    // Build WHERE clause
    let whereConditions = ["pt.Branch_idBranch IN (?)"];
    let queryParams = [branchIds];

    if (start_date) {
      whereConditions.push("DATE(pt.Date_Time) >= ?");
      queryParams.push(start_date);
    }
    if (end_date) {
      whereConditions.push("DATE(pt.Date_Time) <= ?");
      queryParams.push(end_date);
    }
    if (status) {
      whereConditions.push("pt.Status = ?");
      queryParams.push(status);
    }

    const whereClause = whereConditions.join(" AND ");

    // Get pagination
    const paginationData = await getReportPaginationData(
      `SELECT COUNT(*) as count FROM pawning_ticket pt WHERE ${whereClause}`,
      queryParams,
      page,
      limit,
    );

    if (paginationData.totalCount === 0) {
      return res.status(200).json({
        success: true,
        fullTicketDetails: [],
        pagination: paginationData,
      });
    }

    // Main Ticket Query
    const [tickets] = await pool.query(
      `SELECT 
        pt.idPawning_Ticket, pt.Ticket_No as ticketNo, pt.Date_Time as grantDate, 
        pt.Period_Type as periodType, pt.Period as period, pt.Maturity_date as maturityDate, 
        pt.Payble_Value as payableAmount, pt.Pawning_Advance_Amount as pawningAdvance, 
        pt.Service_Charge_Type as serviceChargeType, pt.Service_charge_Amount as serviceChargeAmount, 
        pt.Interest_apply_on as interestType, pt.Interest_Amount_Balance as interestBalance, 
        pt.Status as status,
        pt.Customer_idCustomer,
        p.Name as productName,
        DATEDIFF(CURDATE(), pt.Date_Time) as age
      FROM pawning_ticket pt
      JOIN pawning_product p ON pt.Pawning_Product_idPawning_Product = p.idPawning_Product
      WHERE ${whereClause}
      ORDER BY pt.Date_Time DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset],
    );

    const ticketIds = tickets.map((t) => t.idPawning_Ticket);

    // Fetch Customers from Account Center
    const customerIds = [...new Set(tickets.map((t) => t.Customer_idCustomer))];
    let customersMap = new Map();
    if (customerIds.length > 0) {
      try {
        const customersRes = await subsystemApi.customersByPawningIds(
          customerIds,
          req.companyId,
          req.accessToken,
        );
        if (customersRes && customersRes.customers) {
          customersRes.customers.forEach((c) => {
            customersMap.set(c.isPawningUserId, c);
          });
        }
      } catch (error) {
        console.error("Error fetching customers for report:", error);
      }
    }

    // Articles Query
    const [articles] = await pool.query(
      `SELECT 
        ta.Pawning_Ticket_idPawning_Ticket as ticketId, ta.Article_Condition as \`condition\`, 
        ta.Caratage as caratage, ta.No_Of_Items as qty, ta.Gross_Weight as grossWeight, 
        ta.Net_Weight as netWeight, ta.Assessed_Value as assessedValue, ta.Declared_Value as declaredValue, 
        ta.Article_type as typeId, ta.Article_category as categoryId
      FROM ticket_articles ta
      WHERE ta.Pawning_Ticket_idPawning_Ticket IN (?)`,
      [ticketIds],
    );

    // Fetch Article Types and Categories
    const typeIds = [...new Set(articles.map((a) => a.typeId).filter(Boolean))];
    const categoryIds = [
      ...new Set(articles.map((a) => a.categoryId).filter(Boolean)),
    ];

    const typeMap = new Map();
    const categoryMap = new Map();

    try {
      await Promise.all([
        ...typeIds.map(async (id) => {
          const res = await subsystemApi.articleType(id, req.accessToken);
          if (res && res.articleType)
            typeMap.set(id, res.articleType.Description);
        }),
        ...categoryIds.map(async (id) => {
          const res = await subsystemApi.articleCategory(id, req.accessToken);
          if (res && res.articleCategory)
            categoryMap.set(id, res.articleCategory.Description);
        }),
      ]);
    } catch (error) {
      console.error("Error fetching article types/categories:", error);
    }

    // Assign type and category back to articles
    articles.forEach((a) => {
      a.type = typeMap.get(a.typeId) || "N/A";
      a.category = categoryMap.get(a.categoryId) || "N/A";
    });

    // Payments totals
    const [payments] = await pool.query(
      `SELECT 
        Pawning_Ticket_idPawning_Ticket as ticketId, 
        COUNT(*) as noOfPayments, 
        SUM(Advance_Payment + Service_Charge_Payment + Service_Charge_Payment + Other_Charges_Payment + Late_Charges_Payment + Early_Charge_Payment) as totalPaid
      FROM payment
      WHERE Pawning_Ticket_idPawning_Ticket IN (?)
      GROUP BY Pawning_Ticket_idPawning_Ticket`,
      [ticketIds],
    );

    const paymentMap = new Map(payments.map((p) => [p.ticketId, p]));
    const articleMap = new Map();
    articles.forEach((a) => {
      if (!articleMap.has(a.ticketId)) articleMap.set(a.ticketId, []);
      articleMap.get(a.ticketId).push(a);
    });

    // Merge everything
    tickets.forEach((t) => {
      t.articles = articleMap.get(t.idPawning_Ticket) || [];
      const p = paymentMap.get(t.idPawning_Ticket) || {
        noOfPayments: 0,
        totalPaid: 0,
      };
      t.noOfPayments = p.noOfPayments;
      t.totalPaid = p.totalPaid;

      // Mix in customer data
      const customer = customersMap.get(t.Customer_idCustomer);
      t.customerName = customer
        ? `${customer.First_Name || ""} ${customer.Last_Name || ""}`.trim() ||
          customer.Full_Name ||
          "N/A"
        : "N/A";
      t.NIC = customer ? customer.Nic : "N/A";
      t.contact = customer ? customer.Contact_No : "N/A";

      // Default placeholder values for missing fields in current DB schema
      t.interestAmount = 0; // Needs more complex calc if not in a single column
      t.earlySettlementType = "N/A";
      t.earlySettlementAmount = 0;
    });

    return res.status(200).json({
      success: true,
      fullTicketDetails: tickets,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error in full ticket details report:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};

// Articles In Hand Report Controller
export const articlesInHandReport = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { start_date, end_date, branchId, status } = req.query;

    // Resolve branch IDs
    let branchIds;
    if (branchId) {
      branchIds = [branchId];
    } else {
      try {
        const accessToken = req.accessToken;
        const branches = await subsystemApi.branches(
          req.companyId,
          accessToken,
        );
        branchIds = (branches.branches || []).map((branch) => branch.idBranch);
      } catch (error) {
        console.error(
          "Error fetching branches for articles in hand report:",
          error,
        );
        return next(errorHandler(500, "Internal server error"));
      }
    }

    // Build WHERE clause
    // Default to active/open tickets (articles currently in hand)
    let whereConditions = ["pt.Branch_idBranch IN (?)"];
    let queryParams = [branchIds];

    if (start_date) {
      whereConditions.push("DATE(pt.Date_Time) >= ?");
      queryParams.push(start_date);
    }
    if (end_date) {
      whereConditions.push("DATE(pt.Date_Time) <= ?");
      queryParams.push(end_date);
    }
    if (status) {
      whereConditions.push("pt.Status = ?");
      queryParams.push(status);
    } else {
      // Default: only tickets where articles are still in hand
      // Excludes: Settled (2) and Rejected (4)
      whereConditions.push("pt.Status NOT IN (2, 4)");
    }

    const whereClause = whereConditions.join(" AND ");

    // Pagination — count at the article level (one row per article)
    const paginationData = await getReportPaginationData(
      `SELECT COUNT(*) as count
       FROM ticket_articles ta
       JOIN pawning_ticket pt ON ta.Pawning_Ticket_idPawning_Ticket = pt.idPawning_Ticket
       WHERE ${whereClause}`,
      queryParams,
      page,
      limit,
    );

    if (paginationData.totalCount === 0) {
      return res.status(200).json({
        success: true,
        articlesInHand: [],
        pagination: paginationData,
      });
    }

    // Main query — one row per article, joined with ticket info
    const [articles] = await pool.query(
      `SELECT
        ta.idTicket_Articles      as articleId,
        ta.Pawning_Ticket_idPawning_Ticket as ticketDbId,
        pt.Ticket_No              as ticketNo,
        pt.Date_Time              as grantDate,
        pt.Maturity_date          as maturityDate,
        pt.Status                 as ticketStatus,
        pt.Pawning_Advance_Amount as pawningAdvance,
        pt.Payble_Value           as payableAmount,
        pt.Customer_idCustomer,
        pt.Branch_idBranch        as branchId,
        p.Name                    as productName,
        ta.Article_type           as typeId,
        ta.Article_category       as categoryId,
        ta.Article_Condition      as \`condition\`,
        ta.Caratage               as caratage,
        ta.No_Of_Items            as qty,
        ta.Gross_Weight           as grossWeight,
        ta.Net_Weight             as netWeight,
        ta.Assessed_Value         as assessedValue,
        ta.Declared_Value         as declaredValue,
        DATEDIFF(CURDATE(), pt.Date_Time) as age
      FROM ticket_articles ta
      JOIN pawning_ticket pt  ON ta.Pawning_Ticket_idPawning_Ticket = pt.idPawning_Ticket
      JOIN pawning_product p  ON pt.Pawning_Product_idPawning_Product = p.idPawning_Product
      WHERE ${whereClause}
      ORDER BY pt.Date_Time DESC
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset],
    );

    // ── Customers ────────────────────────────────────────────────────────────
    const customerIds = [
      ...new Set(articles.map((a) => a.Customer_idCustomer)),
    ];
    let customersMap = new Map();
    if (customerIds.length > 0) {
      try {
        const customersRes = await subsystemApi.customersByPawningIds(
          customerIds,
          req.companyId,
          req.accessToken,
        );
        if (customersRes?.customers) {
          customersRes.customers.forEach((c) => {
            customersMap.set(c.isPawningUserId, c);
          });
        }
      } catch (error) {
        console.error(
          "Error fetching customers for articles in hand report:",
          error,
        );
      }
    }

    // ── Article Types & Categories ────────────────────────────────────────────
    const typeIds = [...new Set(articles.map((a) => a.typeId).filter(Boolean))];
    const categoryIds = [
      ...new Set(articles.map((a) => a.categoryId).filter(Boolean)),
    ];

    const typeMap = new Map();
    const categoryMap = new Map();

    try {
      await Promise.all([
        ...typeIds.map(async (id) => {
          const res = await subsystemApi.articleType(id, req.accessToken);
          if (res?.articleType) typeMap.set(id, res.articleType.Description);
        }),
        ...categoryIds.map(async (id) => {
          const res = await subsystemApi.articleCategory(id, req.accessToken);
          if (res?.articleCategory)
            categoryMap.set(id, res.articleCategory.Description);
        }),
      ]);
    } catch (error) {
      console.error("Error fetching article types/categories:", error);
    }

    // ── Merge everything onto each article row ────────────────────────────────
    articles.forEach((a) => {
      // Resolve lookups
      a.type = typeMap.get(a.typeId) || "N/A";
      a.category = categoryMap.get(a.categoryId) || "N/A";

      // Attach customer info
      const customer = customersMap.get(a.Customer_idCustomer);
      a.customerName = customer
        ? `${customer.First_Name || ""} ${customer.Last_Name || ""}`.trim() ||
          customer.Full_Name ||
          "N/A"
        : "N/A";
      a.NIC = customer?.Nic ?? "N/A";
      a.contact = customer?.Contact_No ?? "N/A";

      // Clean up internal FK columns from the response
      delete a.typeId;
      delete a.categoryId;
      delete a.Customer_idCustomer;
    });

    return res.status(200).json({
      success: true,
      articlesInHand: articles,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error in articles in hand report:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};

// Payments Report Controller
export const paymentsReport = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { start_date, end_date, branchId, paymentType } = req.query;

    let branchIds;
    if (branchId) {
      branchIds = [branchId];
    } else {
      branchIds = await getCompanyBranches(req.companyId);
    }

    if (!branchIds.length) {
      const paginationData = await getReportPaginationData(
        "SELECT COUNT(*) as count FROM payment WHERE 1=0",
        [],
        page,
        limit,
      );
      return res.status(200).json({
        success: true,
        payments: [],
        pagination: paginationData,
      });
    }

    const [ticketRows] = await pool.query(
      `SELECT idPawning_Ticket FROM pawning_ticket WHERE Branch_idBranch IN (?)`,
      [branchIds],
    );
    const ticketIds = ticketRows.map((t) => t.idPawning_Ticket);

    if (!ticketIds.length) {
      const paginationData = await getReportPaginationData(
        "SELECT COUNT(*) as count FROM payment WHERE 1=0",
        [],
        page,
        limit,
      );
      return res.status(200).json({
        success: true,
        payments: [],
        pagination: paginationData,
      });
    }

    const dateExpr = `DATE(STR_TO_DATE(p.Date_time, '%Y-%m-%d %H:%i:%s'))`;
    let dateFilter = "";
    const paginationParams = [ticketIds];
    const dataParams = [ticketIds];

    if (start_date && end_date) {
      dateFilter = ` AND ${dateExpr} BETWEEN ? AND ?`;
      paginationParams.push(start_date, end_date);
      dataParams.push(start_date, end_date);
    } else if (start_date) {
      dateFilter = ` AND ${dateExpr} >= ?`;
      paginationParams.push(start_date);
      dataParams.push(start_date);
    } else if (end_date) {
      dateFilter = ` AND ${dateExpr} <= ?`;
      paginationParams.push(end_date);
      dataParams.push(end_date);
    }

    let typeFilter = "";
    if (paymentType) {
      typeFilter = ` AND p.Type = ?`;
      paginationParams.push(paymentType);
      dataParams.push(paymentType);
    }

    const paginationQuery = `SELECT COUNT(*) as count FROM payment p WHERE p.Pawning_Ticket_idPawning_Ticket IN (?)${dateFilter}${typeFilter}`;

    const dataQuery = `
      SELECT p.*, pt.Ticket_No as ticketNo, pt.Date_Time as grantDate, pt.Maturity_date as maturityDate, pt.Status as ticketStatus, pt.Pawning_Advance_Amount as pawningAdvance, pt.Payble_Value as payableAmount, pt.Customer_idCustomer, pt.Branch_idBranch as branchId, pr.Name as productName
      FROM payment p
      JOIN pawning_ticket pt ON p.Pawning_Ticket_idPawning_Ticket = pt.idPawning_Ticket
      JOIN pawning_product pr ON pt.Pawning_Product_idPawning_Product = pr.idPawning_Product
      WHERE p.Pawning_Ticket_idPawning_Ticket IN (?)${dateFilter}${typeFilter}
      ORDER BY STR_TO_DATE(p.Date_time, '%Y-%m-%d %H:%i:%s') DESC
      LIMIT ? OFFSET ?`;

    const paginationData = await getReportPaginationData(
      paginationQuery,
      paginationParams,
      page,
      limit,
    );

    const [payments] = await pool.query(dataQuery, [
      ...dataParams,
      limit,
      offset,
    ]);

    return res.status(200).json({
      success: true,
      payments: payments,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error in payments report:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};

// Daily Ticket Income Report Controller
export const dailyTicketIncomeReport = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const { date, branchId } = req.query;

    let branchIds;
    if (branchId) {
      branchIds = [branchId];
    } else {
      branchIds = await getCompanyBranches(req.companyId);
    }

    if (!branchIds.length) {
      const paginationData = await getReportPaginationData(
        "SELECT COUNT(*) as count FROM payment WHERE 1=0",
        [],
        page,
        limit,
      );
      return res.status(200).json({
        success: true,
        payments: [],
        pagination: paginationData,
      });
    }

    const [ticketRows] = await pool.query(
      `SELECT idPawning_Ticket FROM pawning_ticket WHERE Branch_idBranch IN (?)`,
      [branchIds],
    );
    const ticketIds = ticketRows.map((t) => t.idPawning_Ticket);

    if (!ticketIds.length) {
      const paginationData = await getReportPaginationData(
        "SELECT COUNT(*) as count FROM payment WHERE 1=0",
        [],
        page,
        limit,
      );
      return res.status(200).json({
        success: true,
        payments: [],
        pagination: paginationData,
      });
    }

    const dateExpr = `DATE(STR_TO_DATE(p.Date_time, '%Y-%m-%d %H:%i:%s'))`;
    let dateFilter = "";
    const paginationParams = [ticketIds];
    const dataParams = [ticketIds];

    if (date) {
      dateFilter = ` AND ${dateExpr} = ?`;
      paginationParams.push(date);
      dataParams.push(date);
    }

    const paginationQuery = `SELECT COUNT(*) as count FROM payment p WHERE p.Pawning_Ticket_idPawning_Ticket IN (?)${dateFilter}`;

    const dataQuery = `
      SELECT p.*, pt.Ticket_No as ticketNo, pt.Date_Time as grantDate, pt.Maturity_date as maturityDate, pt.Status as ticketStatus, pt.Pawning_Advance_Amount as pawningAdvance, pt.Payble_Value as payableAmount, pt.Customer_idCustomer, pt.Branch_idBranch as branchId, pr.Name as productName
      FROM payment p
      JOIN pawning_ticket pt ON p.Pawning_Ticket_idPawning_Ticket = pt.idPawning_Ticket
      JOIN pawning_product pr ON pt.Pawning_Product_idPawning_Product = pr.idPawning_Product
      WHERE p.Pawning_Ticket_idPawning_Ticket IN (?)${dateFilter}
      ORDER BY STR_TO_DATE(p.Date_time, '%Y-%m-%d %H:%i:%s') DESC
      LIMIT ? OFFSET ?`;

    const paginationData = await getReportPaginationData(
      paginationQuery,
      paginationParams,
      page,
      limit,
    );

    const [payments] = await pool.query(dataQuery, [
      ...dataParams,
      limit,
      offset,
    ]);

    return res.status(200).json({
      success: true,
      payments: payments,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error in daily ticket income report:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};

// Fetch and sends all the products for the selected branch
export const fetchAndSendAllProductsForSelectedBranch = async (
  req,
  res,
  next,
) => {
  try {
    const { branchId } = req.query;

    if (!branchId) {
      return next(errorHandler(400, "branchId is required"));
    }

    const [products] = await pool.query(
      `SELECT idPawning_Product, Name FROM pawning_product WHERE Branch_idBranch = ? ORDER BY Name ASC`,
      [branchId],
    );

    return res.status(200).json({
      success: true,
      products: products,
    });
  } catch (error) {
    console.error(
      "Error in fetch and send all products for selected branch:",
      error,
    );
    return next(errorHandler(500, "Internal server error"));
  }
};

// Fetch and sends all the Tickets for selected pawning product
export const fetchAndSendAllTicketsForSelectedPawningProduct = async (
  req,
  res,
  next,
) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { productId, branchId, status } = req.query;

    if (!productId || !branchId) {
      return next(errorHandler(400, "productId and branchId are required"));
    }

    const [product] = await pool.query(
      `SELECT idPawning_Product, Name FROM pawning_product WHERE idPawning_Product = ?`,
      [productId],
    );
    if (product.length === 0) {
      return next(errorHandler(404, "Product not found"));
    }

    const ticketWhereParams = [productId, branchId];
    let ticketWhereSql =
      "Pawning_Product_idPawning_Product = ? AND Branch_idBranch = ?";
    if (status !== undefined && status !== null && status !== "") {
      ticketWhereSql += " AND Status = ?";
      ticketWhereParams.push(status);
    }

    const paginationData = await getReportPaginationData(
      `SELECT COUNT(*) as count FROM pawning_ticket WHERE ${ticketWhereSql}`,
      ticketWhereParams,
      page,
      limit,
    );

    if (paginationData.totalCount === 0) {
      return res.status(200).json({
        success: true,
        tickets: [],
        pagination: paginationData,
      });
    }

    const [tickets] = await pool.query(
      `SELECT idPawning_Ticket, Ticket_No, SEQ_No, Date_Time, Maturity_date, Status, Pawning_Advance_Amount, Balance_Amount,Gross_Weight,Net_Weight,No_Of_Items,Assessed_Value,Payble_Value
       FROM pawning_ticket
       WHERE ${ticketWhereSql}
       ORDER BY Date_Time DESC
       LIMIT ? OFFSET ?`,
      [...ticketWhereParams, limit, paginationData.offset],
    );

    return res.status(200).json({
      success: true,
      tickets: tickets,
      pagination: paginationData,
    });
  } catch (error) {
    console.error(
      "Error in fetch and send all tickets for selected pawning product:",
      error,
    );
    return next(errorHandler(500, "Internal server error"));
  }
};
