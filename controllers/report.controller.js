import { errorHandler } from "../utils/errorHandler.js";
import { pool, pool2 } from "../utils/db.js";
import { getReportPaginationData } from "../utils/helper.js";

// Helper function to get all branches for a company
const getAllBranchesForTheCompany = async (companyId) => {
  const [branches] = await pool2.query(
    "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
    [companyId],
  );
  return branches;
};

// controller to send all the branches of the company
export const getCompanyBranches = async (req, res, next) => {
  try {
    const [branches] = await pool2.query(
      "SELECT idBranch, Name,Branch_Code FROM branch WHERE Company_idCompany = ?",
      [req.companyId],
    );

    return res.status(200).json({
      success: true,
      branches: branches,
    });
  } catch (error) {
    console.error("Error fetching company branches:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};

// Controller to generate Loan to Market Value report
export const loanToMarketValueReport = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { start_date, end_date, branchId } = req.query;

    let branchIds;

    if (branchId) {
      // Validate branchId is a valid integer
      const parsedBranchId = parseInt(branchId, 10);
      if (isNaN(parsedBranchId)) {
        return next(errorHandler(400, "Invalid branchId parameter"));
      }

      // If branchId is provided, verify it belongs to the company
      const [branch] = await pool2.query(
        "SELECT idBranch FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
        [parsedBranchId, req.companyId],
      );

      if (branch.length === 0) {
        return next(
          errorHandler(
            404,
            "Branch not found or does not belong to your company",
          ),
        );
      }

      branchIds = [parsedBranchId];
    } else {
      // Get all branches for the company
      const branches = await getAllBranchesForTheCompany(req.companyId);

      if (branches.length === 0) {
        return next(
          errorHandler(
            404,
            "No branches found for the company to generate report",
          ),
        );
      }

      branchIds = branches.map((branch) => branch.idBranch);
    }

    // Build dynamic WHERE clause (use table alias 't' to avoid ambiguity)
    let whereConditions = ["t.Branch_idBranch IN (?)"];
    let queryParams = [branchIds];

    if (start_date) {
      whereConditions.push("DATE(t.Date_Time) >= ?");
      queryParams.push(start_date);
    }

    if (end_date) {
      whereConditions.push("DATE(t.Date_Time) <= ?");
      queryParams.push(end_date);
    }

    const whereClause = whereConditions.join(" AND ");

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get pagination data using your existing function
    const paginationData = await getReportPaginationData(
      `SELECT COUNT(*) as count FROM pawning_ticket t WHERE ${whereClause}`,
      queryParams,
      page,
      limit,
    );

    // If no records, return early
    if (paginationData.totalCount === 0) {
      return res.status(200).json({
        success: true,
        reports: [],
        pagination: paginationData,
      });
    }

    // Fetch ticket data with pagination using calculated offset (without branch - it's in pool2)
    const [ticketsData] = await pool.query(
      `SELECT 
        t.idPawning_Ticket, 
        t.Ticket_No, 
        t.Date_Time, 
        t.Pawning_Advance_Amount, 
        t.Period, 
        t.Period_Type, 
        t.Maturity_date, 
        t.Status,
        t.Branch_idBranch,
        c.NIC, 
        c.Full_name
      FROM pawning_ticket t 
      JOIN customer c ON t.Customer_idCustomer = c.idCustomer 
      WHERE ${whereClause}
      ORDER BY t.Date_Time DESC 
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset],
    );

    if (ticketsData.length === 0) {
      return res.status(200).json({
        success: true,
        reports: [],
        pagination: paginationData,
      });
    }

    // Fetch branch names from pool2 for all unique branch IDs
    const uniqueBranchIds = [
      ...new Set(ticketsData.map((t) => t.Branch_idBranch).filter((id) => id)),
    ];

    if (uniqueBranchIds.length > 0) {
      const placeholders = uniqueBranchIds.map(() => "?").join(",");
      const [branches] = await pool2.query(
        `SELECT idBranch, Name FROM branch WHERE idBranch IN (${placeholders})`,
        uniqueBranchIds,
      );

      const branchMap = new Map(branches.map((b) => [b.idBranch, b.Name]));

      ticketsData.forEach((ticket) => {
        ticket.Branch_Name = branchMap.get(ticket.Branch_idBranch) || null;
        delete ticket.Branch_idBranch;
      });
    }

    const ticketIds = ticketsData.map((ticket) => ticket.idPawning_Ticket);

    // Batch fetch approved users for all tickets
    const [approvedUsers] = await pool.query(
      `SELECT 
        pta.Pawning_Ticket_idPawning_Ticket, 
        u.full_name 
      FROM user u 
      JOIN ticket_has_approval pta ON u.idUser = pta.User 
      WHERE pta.Pawning_Ticket_idPawning_Ticket IN (?)`,
      [ticketIds],
    );

    // Create a map for quick lookup
    const approvedUserMap = {};
    approvedUsers.forEach((user) => {
      approvedUserMap[user.Pawning_Ticket_idPawning_Ticket] = user.full_name;
    });

    // Assign approved users to tickets
    ticketsData.forEach((ticket) => {
      ticket.Approved_By = approvedUserMap[ticket.idPawning_Ticket] || "";
    });

    // fetch capital outstanding for each ticket from ticket log
    const [ticketLogs] = await pool.query(
      `SELECT 
        Pawning_Ticket_idPawning_Ticket,
        Total_Balance as Total_Capital_Outstanding
      FROM ticket_log
      WHERE Pawning_Ticket_idPawning_Ticket IN (?)
      `,
      [ticketIds],
    );

    const ticketLogMap = {};
    ticketLogs.forEach((log) => {
      ticketLogMap[log.Pawning_Ticket_idPawning_Ticket] =
        log.Total_Capital_Outstanding;
    });

    // Assign capital outstanding to tickets
    ticketsData.forEach((ticket) => {
      ticket.Capital_Outstanding =
        parseFloat(ticketLogMap[ticket.idPawning_Ticket]) || 0;
    });

    // Batch fetch articles for all tickets
    const [articles] = await pool.query(
      `SELECT 
        ta.idTicket_Articles, 
        ta.Caratage, 
        ta.Gross_Weight, 
        ta.Net_Weight, 
        ta.Assessed_Value, 
        ta.Advanced_Value, 
        ta.Pawning_Ticket_idPawning_Ticket, 
        at.Description as Article_Type 
      FROM ticket_articles ta 
      JOIN article_types at ON ta.Article_type = at.idArticle_Types 
      WHERE ta.Pawning_Ticket_idPawning_Ticket IN (?)`,
      [ticketIds],
    );

    // Get unique caratages
    const uniqueCaratages = [
      ...new Set(
        articles.map((a) => parseInt(a.Caratage)).filter((c) => !isNaN(c)),
      ),
    ];

    // Batch fetch assessed values for all caratages
    let assessedValueMap = {};
    if (uniqueCaratages.length > 0) {
      const [assessedValues] = await pool.query(
        "SELECT Carat, Amount FROM assessed_value WHERE Carat IN (?)",
        [uniqueCaratages],
      );

      assessedValues.forEach((av) => {
        assessedValueMap[av.Carat] = av.Amount;
      });
    }

    // Process articles and group by ticket
    const articlesByTicket = {};
    articles.forEach((article) => {
      const ticketId = article.Pawning_Ticket_idPawning_Ticket;
      if (!articlesByTicket[ticketId]) {
        articlesByTicket[ticketId] = [];
      }

      // Calculate advance amount as percentage of estimated value
      const advancePercentage =
        article.Assessed_Value > 0
          ? (article.Advanced_Value / article.Assessed_Value) * 100
          : 0;
      article.Advance_Amount_As_Percentage_Of_Estimated_Value = parseFloat(
        advancePercentage.toFixed(2),
      );

      // Calculate current market value
      const caratage = parseInt(article.Caratage);
      const assessedAmount = assessedValueMap[caratage];

      if (assessedAmount && article.Net_Weight) {
        const marketValue = assessedAmount * article.Net_Weight;
        article.Current_Market_Value = parseFloat(marketValue.toFixed(2));

        // Calculate advance-to-value percentage
        const advanceToValuePercentage =
          marketValue > 0 ? (article.Advanced_Value / marketValue) * 100 : 0;
        article.Advance_To_Value_Percentage = parseFloat(
          advanceToValuePercentage.toFixed(2),
        );
      } else {
        article.Current_Market_Value = 0;
        article.Advance_To_Value_Percentage = 0;
      }

      // Remove the ticket ID field from article (not needed in response)
      delete article.Pawning_Ticket_idPawning_Ticket;

      articlesByTicket[ticketId].push(article);
    });

    // Variables to track totals
    let totalContractsWithXS = 0;
    let totalXSValue = 0;
    let totalContractsWithShortfall = 0;
    let totalShortfallValue = 0;

    // Assign articles to tickets and calculate XS/Shortfall
    ticketsData.forEach((ticket) => {
      ticket.articles = articlesByTicket[ticket.idPawning_Ticket] || [];

      // Calculate total market value and total advanced value for this ticket
      let totalMarketValue = 0;
      let totalAdvancedValue = 0;

      ticket.articles.forEach((article) => {
        totalMarketValue += parseFloat(article.Current_Market_Value) || 0;
        totalAdvancedValue += parseFloat(article.Advanced_Value) || 0;
      });

      // Calculate the difference (Market Value - Advanced Amount)
      const difference = totalMarketValue - totalAdvancedValue;

      if (difference > 0) {
        // Excess (XS) - Market value is higher than loan amount
        ticket.Contract_Type = "XS";
        ticket.XS_Value = parseFloat(difference.toFixed(2));
        ticket.Shortfall_Value = 0;

        totalContractsWithXS++;
        totalXSValue += difference;
      } else if (difference < 0) {
        // Shortfall - Loan amount is higher than market value
        ticket.Contract_Type = "Shortfall";
        ticket.Shortfall_Value = parseFloat(Math.abs(difference).toFixed(2));
        ticket.XS_Value = 0;

        totalContractsWithShortfall++;
        totalShortfallValue += Math.abs(difference);
      } else {
        // Equal - rare case
        ticket.Contract_Type = "Equal";
        ticket.XS_Value = 0;
        ticket.Shortfall_Value = 0;
      }

      // Add total values to ticket for reference
      ticket.Total_Market_Value = parseFloat(totalMarketValue.toFixed(2));
      ticket.Total_Advanced_Value = parseFloat(totalAdvancedValue.toFixed(2));
    });

    return res.status(200).json({
      success: true,
      reports: ticketsData,
      pagination: paginationData,
      summary: {
        total_contracts_with_xs: totalContractsWithXS,
        total_xs_value: parseFloat(totalXSValue.toFixed(2)),
        total_contracts_with_shortfall: totalContractsWithShortfall,
        total_shortfall_value: parseFloat(totalShortfallValue.toFixed(2)),
        net_position: parseFloat(
          (totalXSValue - totalShortfallValue).toFixed(2),
        ),
      },
    });
  } catch (error) {
    console.error("Error in loan to market value report:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};

// Ticket day end report
export const ticketDayEndReport = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { date, branchId } = req.query;

    // validate date
    if (date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return next(errorHandler(400, "Invalid date format. Use YYYY-MM-DD"));
      }
    }

    // if branchId is provided use it (after validation), otherwise get all company branches
    let branchIds;
    if (branchId) {
      // Validate branchId is a valid integer
      const parsedBranchId = parseInt(branchId, 10);
      if (isNaN(parsedBranchId)) {
        return next(errorHandler(400, "Invalid branchId parameter"));
      }

      // Verify the branch belongs to this company
      const [branchRow] = await pool2.query(
        "SELECT idBranch FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
        [parsedBranchId, req.companyId],
      );

      if (branchRow.length === 0) {
        return next(
          errorHandler(
            404,
            "Branch not found or does not belong to your company",
          ),
        );
      }

      branchIds = [parsedBranchId];
    } else {
      // get all branches for the company
      const branches = await getAllBranchesForTheCompany(req.companyId);
      if (branches.length === 0) {
        return next(
          errorHandler(
            404,
            "No branches found for the company to generate report",
          ),
        );
      }

      branchIds = branches.map((branch) => branch.idBranch); // branch id's
    }

    // Build pagination/count query
    let paginationQuery = `SELECT COUNT(*) as count FROM pawning_ticket pt WHERE pt.Branch_idBranch IN (?)`;
    let paginationQueryParams = [branchIds];

    // Build data query (do NOT join ticket_articles here — a ticket can have multiple articles/categories)
    // fetch articles separately and attach them per ticket to avoid duplicate ticket rows.
    // Also fetch branch names separately from pool2 since branch is on a different database
    let dataQuery = `SELECT pt.idPawning_Ticket, pt.Ticket_No, pt.SEQ_No, pt.Date_Time, pt.Period_Type, pt.Period, pt.Net_Weight, pt.Gross_Weight, pt.Pawning_Advance_Amount, pt.Status, pt.updated_at, pt.Branch_idBranch, c.Full_name, c.NIC FROM pawning_ticket pt JOIN customer c ON pt.Customer_idCustomer = c.idCustomer WHERE pt.Branch_idBranch IN (?)`;
    let dataQueryParams = [branchIds];

    // If a specific date is provided use otherwise default to current date
    if (date) {
      paginationQuery += ` AND STR_TO_DATE(pt.Date_Time, '%Y-%m-%d') = ?`;
      paginationQueryParams.push(date);

      dataQuery += ` AND STR_TO_DATE(pt.Date_Time, '%Y-%m-%d') = ?`;
      dataQueryParams.push(date);
    } else {
      paginationQuery += ` AND STR_TO_DATE(pt.Date_Time, '%Y-%m-%d') = CURDATE()`;
      dataQuery += ` AND STR_TO_DATE(pt.Date_Time, '%Y-%m-%d') = CURDATE()`;
    }

    // Add ordering and pagination to data query
    dataQuery += ` ORDER BY pt.Date_Time DESC LIMIT ? OFFSET ?`;
    dataQueryParams.push(limit, offset);

    // Get pagination data
    const paginationData = await getReportPaginationData(
      paginationQuery,
      paginationQueryParams,
      page,
      limit,
    );

    // Get ticket rows (one row per ticket)
    const [ticketsData] = await pool.query(dataQuery, dataQueryParams);

    if (ticketsData.length === 0) {
      return res.status(200).json({
        success: true,
        dayEndTicketReport: [],
        pagination: paginationData,
      });
    }

    // Fetch branch names from pool2 for all unique branch IDs
    if (ticketsData.length > 0) {
      const uniqueBranchIds = [
        ...new Set(
          ticketsData.map((t) => t.Branch_idBranch).filter((id) => id),
        ),
      ];

      if (uniqueBranchIds.length > 0) {
        const placeholders = uniqueBranchIds.map(() => "?").join(",");
        const [branches] = await pool2.query(
          `SELECT idBranch, Name FROM branch WHERE idBranch IN (${placeholders})`,
          uniqueBranchIds,
        );

        const branchMap = new Map(branches.map((b) => [b.idBranch, b.Name]));

        ticketsData.forEach((ticket) => {
          ticket.Branch_Name = branchMap.get(ticket.Branch_idBranch) || null;
          delete ticket.Branch_idBranch;
        });
      }
    }

    // Fetch article categories for all tickets in this page and group them by ticket id
    const ticketIds = ticketsData.map((t) => t.idPawning_Ticket);
    const [articleRows] = await pool.query(
      `SELECT ta.Pawning_Ticket_idPawning_Ticket as ticketId, ac.Description as Article_Category
       FROM ticket_articles ta
       LEFT JOIN article_categories ac ON ta.Article_category = ac.idArticle_Categories
       WHERE ta.Pawning_Ticket_idPawning_Ticket IN (?)`,
      [ticketIds],
    );

    const categoriesByTicket = {};
    articleRows.forEach((row) => {
      const id = row.ticketId;
      if (!categoriesByTicket[id]) categoriesByTicket[id] = new Set();
      categoriesByTicket[id].add(row.Article_Category || "N/A");
    });

    // Attach categories (as array) to each ticket
    ticketsData.forEach((ticket) => {
      const set = categoriesByTicket[ticket.idPawning_Ticket] || new Set();
      ticket.Article_Categories = Array.from(set);
    });

    return res.status(200).json({
      success: true,
      dayEndTicketReport: ticketsData,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error in ticket day end report:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};
