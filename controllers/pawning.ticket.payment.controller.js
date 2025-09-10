import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";
import { formatSearchPattern } from "../utils/helper.js";

// Search tickets by ticket number, customer NIC, or customer name with pagination
export const searchByTickerNumberCustomerNICOrName = async (req, res, next) => {
  try {
    const { searchTerm } = req.query;
    if (!searchTerm) {
      return next(errorHandler(400, "Search term is required"));
    }

    const searchPattern = formatSearchPattern(searchTerm); // Format the search term for SQL LIKE query

    const [result] = await pool.query(
      "SELECT pt.idPawning_Ticket, pt.Ticket_No, c.Full_name, c.NIC FROM pawning_ticket pt JOIN customer c on pt.Customer_idCustomer = c.idCustomer WHERE (pt.Ticket_No LIKE ? OR c.NIC LIKE ? OR c.First_Name LIKE ?)  GROUP BY pt.idPawning_Ticket",
      [searchPattern, searchPattern, searchPattern]
    );

    if (result.length === 0) {
      return next(errorHandler(404, "No matching tickets found"));
    }

    res.status(200).json({
      success: true,
      ticketSearchResults: result,
    });
  } catch (error) {
    console.error("Error searching tickets:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Return ticket data by ID
export const getTicketDataById = async (req, res, next) => {
  try {
    const ticketId = req.params.id || req.params.ticketId;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }

    let customerData;
    let ticketData;
    let articleItems;
    let ticketCharges;
    let paymentHistory;

    //fetch ticket initial data
    [ticketData] = await pool.query(
      "SELECT idPawning_Ticket, Ticket_No,Pawning_Product_idPawning_Product,Period,Date_Time,Status,Maturity_date,Pawning_Advance_Amount,Customer_idCustomer,Gross_Weight,Net_Weight,Interest_Rate,Service_charge_Amount,Late_charge_Presentage,User_idUser,Note,Interest_apply_on,Period_Type,SEQ_No FROM pawning_ticket WHERE idPawning_Ticket = ? AND  Branch_idBranch = ?",
      [ticketId, req.branchId]
    );

    if (ticketData.length === 0) {
      return next(errorHandler(404, "No ticket found for the given ID"));
    }

    // fetch ticket images
    const [ticketImages] = await pool.query(
      "SELECT * FROM ticket_artical_images WHERE Pawning_Ticket_idPawning_Ticket = ?",
      [ticketData[0].idPawning_Ticket]
    );

    // attach images to ticket data
    ticketData[0].images = ticketImages;

    // get the product name for the ticket
    const [productData] = await pool.query(
      "SELECT Name FROM pawning_product WHERE idPawning_Product = ?",
      [ticketData[0].Pawning_Product_idPawning_Product]
    );

    ticketData[0].productName = productData[0].Name || "Unknown Product"; // attach product name to ticket data

    // get the office name for the ticket
    const [officerData] = await pool.query(
      "SELECT full_name FROM user WHERE idUser = ?",
      [ticketData[0].User_idUser]
    );
    ticketData[0].officerName = officerData[0]?.full_name || "Unknown Officer"; // attach officer name to ticket data
    delete ticketData[0].User_idUser; // remove User_idUser from ticket data

    // fetch customer data for the ticket
    [customerData] = await pool.query(
      "SELECT idCustomer,Full_name,Risk_Level,Mobile_No FROM customer WHERE idCustomer = ? ",
      [ticketData[0].Customer_idCustomer]
    );

    // fetch customer ative,inactive and overdue ticket counts and attach them to customer data
    const [ticketCounts] = await pool.query(
      "SELECT Status, COUNT(*) AS count FROM pawning_ticket WHERE Customer_idCustomer = ? AND Branch_idBranch = ? GROUP BY Status",
      [ticketData[0].Customer_idCustomer, req.branchId]
    );

    customerData[0].activeTickets =
      ticketCounts.find((t) => parseInt(t.Status) === 1)?.count || 0;
    customerData[0].settledTickets =
      ticketCounts.find((t) => parseInt(t.Status) === 2)?.count || 0;
    customerData[0].overdueTickets =
      ticketCounts.find((t) => parseInt(t.Status) === 3)?.count || 0;

    // article items for the ticket
    [articleItems] = await pool.query(
      "SELECT * FROM ticket_articles WHERE Pawning_Ticket_idPawning_Ticket = ?",
      [ticketData[0].idPawning_Ticket]
    );

    // get article type and category names for each article item and attach them
    for (let item of articleItems) {
      const [typeData] = await pool.query(
        "SELECT Description FROM article_types WHERE idArticle_Types = ?",
        [parseInt(item.Article_type)]
      );
      item.ArticleTypeName = typeData[0]?.Description || "Unknown Type";

      const [categoryData] = await pool.query(
        "SELECT Description FROM article_categories WHERE idArticle_Categories = ?",
        [parseInt(item.Article_category)]
      );
      item.categoryName = categoryData[0]?.Description || "Unknown Category";

      // Remove Article_type and Article_category from item
      delete item.Article_type;
      delete item.Article_category;
    }

    [ticketCharges] = await pool.query(
      "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
      [ticketData[0].idPawning_Ticket]
    );

    // get ticket payment history from ticket payment table
    [paymentHistory] = await pool.query(
      "SELECT idTicket_payment,Date_Time,Payment_Type,Paid_Amount,User_idUser FROM ticket_payment WHERE Pawning_Ticket_idPawning_Ticket = ? ",
      [ticketData[0].idPawning_Ticket]
    );

    // get the officer name for each payment entry
    for (let payment of paymentHistory) {
      const [officerData] = await pool.query(
        "SELECT full_name FROM user WHERE idUser = ?",
        [payment.User_idUser]
      );
      payment.officerName = officerData[0]?.full_name || "Unknown Officer"; // attach officer name to payment data
      // remove User_idUser from payment entry
      delete payment.User_idUser;
    }

    res.status(200).json({
      success: true,
      ticketDetails: {
        ticketData: ticketData[0],
        customerData: customerData[0],
        articleItems,
        ticketCharges: ticketCharges[0] || {},
        paymentHistory,
      },
    });
  } catch (error) {
    console.error("Error fetching ticket data by ID:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Return ticket log data by ID
export const getTicketLogDataById = async (req, res, next) => {
  try {
    const ticketId = req.params.id || req.params.ticketId;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }

    const [result] = await pool.query(
      `SELECT tl.*, u.full_name AS officerName
   FROM ticket_log tl
   LEFT JOIN user u ON tl.User_idUser = u.idUser
   WHERE tl.Pawning_Ticket_idPawning_Ticket = ?`,
      [ticketId]
    );

    res.status(200).json({
      success: true,
      ticketLogData: result,
    });
  } catch (error) {
    console.error("Error fetching ticket log data by ID:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
