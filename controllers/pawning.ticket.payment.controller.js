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
      "SELECT pt.idPawning_Ticket, pt.Ticket_No FROM pawning_ticket pt JOIN customer c on pt.Customer_idCustomer = c.idCustomer WHERE (pt.ticket_number LIKE ? OR c.NIC LIKE ? OR c.First_Name LIKE ?)  GROUP BY pt.idPawning_Ticket",
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
    const { ticketId } = req.params.id || req.params.ticketId;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }
  } catch (error) {
    console.error("Error fetching ticket data by ID:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Return ticket log data by ID
export const getTicketLogDataById = async (req, res, next) => {
  try {
    const { ticketId } = req.params.id || req.params.ticketId;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }

    const [result] = await pool.query(
      "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? GROUP BY Type",
      [ticketId]
    );
    if (result.length === 0) {
      return next(errorHandler(404, "No ticket logs found for the given ID"));
    }

    res.status(200).json({
      success: true,
      ticketLogData: result,
    });
  } catch (error) {
    console.error("Error fetching ticket log data by ID:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
