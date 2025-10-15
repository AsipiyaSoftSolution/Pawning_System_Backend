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

export const loanToMarketValueReport = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // variable to hold fetched data
    let ticketsData;

    // get all branches for the company
    const branches = await getAllBranchesForTheCompany(req.companyId);

    if (branches.length === 0) {
      return next(
        errorHandler(
          404,
          "No branches found for the company to generate report"
        )
      );
    }

    const branchIds = branches.map((branch) => branch.idBranch);

    // get pagination data
    const paginationData = await getReportPaginationData(
      "SELECT COUNT(*) as count FROM pawning_ticket WHERE Branch_idBranch IN (?)",
      [branchIds],
      page,
      limit
    );

    // fetch ticket data with pagination
    [ticketsData] = await pool.query(
      "SELECT t.idPawning_Ticket, t.Ticket_No, t.Date_Time, t.Pawning_Advance_Amount, t.Period, t.Period_Type, t.Maturity_date, c.NIC, c.Full_name, b.Name as Branch_Name FROM pawning_ticket t JOIN customer c ON t.Customer_idCustomer = c.idCustomer JOIN branch b ON t.Branch_idBranch = b.idBranch WHERE t.Branch_idBranch IN (?) ORDER BY STR_TO_DATE(t.Date_Time,'%Y-%m-%d %H:%i:%s') DESC LIMIT ? OFFSET ?",
      [branchIds, limit, offset]
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
      "SELECT pta.Pawning_Ticket_idPawning_Ticket, u.full_name FROM user u JOIN ticket_has_approval pta ON u.idUser = pta.User WHERE pta.Pawning_Ticket_idPawning_Ticket IN (?)",
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

    // Batch fetch articles for all tickets
    const [articles] = await pool.query(
      "SELECT ta.idTicket_Articles, ta.Caratage, ta.Gross_Weight, ta.Net_Weight, ta.Assessed_Value, ta.Advanced_Value, ta.Pawning_Ticket_idPawning_Ticket, at.Description as Article_Type FROM ticket_articles ta JOIN article_types at ON ta.Article_type = at.idArticle_Types WHERE ta.Pawning_Ticket_idPawning_Ticket IN (?)",
      [ticketIds]
    );

    // Get unique caratages
    const uniqueCaratages = [
      ...new Set(articles.map((a) => parseInt(a.Caratage))),
    ];

    // Batch fetch assessed values for all caratages
    const [assessedValues] = await pool.query(
      "SELECT Carat, Amount FROM assessed_value WHERE Carat IN (?)",
      [uniqueCaratages]
    );

    // Create a map for assessed values
    const assessedValueMap = {};
    assessedValues.forEach((av) => {
      assessedValueMap[av.Carat] = av.Amount;
    });

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

    // Assign articles to tickets
    ticketsData.forEach((ticket) => {
      ticket.articles = articlesByTicket[ticket.idPawning_Ticket] || [];
    });

    return res.status(200).json({
      success: true,
      reports: ticketsData,
      pagination: paginationData,
    });
  } catch (error) {
    console.log("error in loan to market value report", error);
    return next(errorHandler(500, "Internal server error"));
  }
};
