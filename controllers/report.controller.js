import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getReportPaginationData } from "../utils/helper.js";

// Helper function to get all branches for a company
const getAllBranchesForTheCompany = async (companyId) => {
  const [branches] = await pool.query(
    "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
    [companyId]
  );
  return branches;
};

// controller to send all the branches of the company
export const getCompanyBranches = async (req, res, next) => {
  try {
    const [branches] = await pool.query(
      "SELECT idBranch, Name,Branch_Code FROM branch WHERE Company_idCompany = ?",
      [req.companyId]
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
      const [branch] = await pool.query(
        "SELECT idBranch FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
        [parsedBranchId, req.companyId]
      );

      if (branch.length === 0) {
        return next(
          errorHandler(
            404,
            "Branch not found or does not belong to your company"
          )
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
            "No branches found for the company to generate report"
          )
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
      limit
    );

    // If no records, return early
    if (paginationData.totalCount === 0) {
      return res.status(200).json({
        success: true,
        reports: [],
        pagination: paginationData,
      });
    }

    // Fetch ticket data with pagination using calculated offset
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
        c.NIC, 
        c.Full_name, 
        b.Name as Branch_Name 
      FROM pawning_ticket t 
      JOIN customer c ON t.Customer_idCustomer = c.idCustomer 
      JOIN branch b ON t.Branch_idBranch = b.idBranch 
      WHERE ${whereClause}
      ORDER BY t.Date_Time DESC 
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );

    if (ticketsData.length === 0) {
      return res.status(200).json({
        success: true,
        reports: [],
        pagination: paginationData,
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
      [ticketIds]
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
      [ticketIds]
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
      [ticketIds]
    );

    // Get unique caratages
    const uniqueCaratages = [
      ...new Set(
        articles.map((a) => parseInt(a.Caratage)).filter((c) => !isNaN(c))
      ),
    ];

    // Batch fetch assessed values for all caratages
    let assessedValueMap = {};
    if (uniqueCaratages.length > 0) {
      const [assessedValues] = await pool.query(
        "SELECT Carat, Amount FROM assessed_value WHERE Carat IN (?)",
        [uniqueCaratages]
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
        advancePercentage.toFixed(2)
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
          advanceToValuePercentage.toFixed(2)
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
          (totalXSValue - totalShortfallValue).toFixed(2)
        ),
      },
    });
  } catch (error) {
    console.error("Error in loan to market value report:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};
