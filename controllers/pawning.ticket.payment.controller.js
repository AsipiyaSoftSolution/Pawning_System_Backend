import { errorHandler } from "../utils/errorHandler.js";
import { pool, pool2 } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";
import { formatSearchPattern } from "../utils/helper.js";
import { getCompanyBranches } from "../utils/helper.js";
import { createPawningTicketLogOnAdditionalCharge } from "../utils/pawning.ticket.logs.js";

// Search tickets by ticket number, customer NIC, or customer name with pagination
export const searchByTickerNumberCustomerNICOrName = async (req, res, next) => {
  try {
    const { searchTerm } = req.query;
    if (!searchTerm) {
      return next(errorHandler(400, "Search term is required"));
    }

    const searchPattern = formatSearchPattern(searchTerm); // Format the search term for SQL LIKE query
    const sanitizedSearch = searchTerm.replace(/[^a-zA-Z0-9]/g, ""); // For NIC search clean up
    const formattedNIC = formatSearchPattern(sanitizedSearch);

    // Step 1: Search for matching customers in Account Center (pool2)
    // Note: Schema doesn't have Full_name, only First_Name and Last_Name
    const [matchingCustomers] = await pool2.query(
      `SELECT isPawningUserId, First_Name, Last_Name, Nic 
       FROM customer 
       WHERE (Nic LIKE ? OR First_Name LIKE ? OR Last_Name LIKE ?) 
       AND isPawningUserId IS NOT NULL`,
      [formattedNIC, searchPattern, searchPattern],
    );

    const pawningCustomerIds = matchingCustomers.map((c) => c.isPawningUserId);

    // Step 2: Search for tickets in Pawning DB (pool)
    let query = `SELECT pt.idPawning_Ticket, pt.Ticket_No, pt.Customer_idCustomer, pt.Status 
                 FROM pawning_ticket pt 
                 WHERE pt.Branch_idBranch = ? AND pt.Status != '-1' AND pt.Status IS NOT NULL`;

    let queryParams = [req.branchId];
    let whereConditions = [];

    // Condition 1: Match Ticket Number
    whereConditions.push("pt.Ticket_No LIKE ?");
    queryParams.push(searchPattern);

    // Condition 2: Match Customer IDs (from Step 1)
    if (pawningCustomerIds.length > 0) {
      const placeholders = pawningCustomerIds.map(() => "?").join(",");
      whereConditions.push(`pt.Customer_idCustomer IN (${placeholders})`);
      queryParams.push(...pawningCustomerIds);
    }

    // Combine conditions with OR
    if (whereConditions.length > 0) {
      query += ` AND (${whereConditions.join(" OR ")})`;
    }

    const [tickets] = await pool.query(query, queryParams);

    if (tickets.length === 0) {
      return res.status(200).json({
        success: true,
        ticketSearchResults: [],
      });
    }

    // Step 3: Fetch Customer Details from pool2
    const uniqueCustomerIds = [
      ...new Set(tickets.map((t) => t.Customer_idCustomer)),
    ];

    // Get accountCenterCusId from pawning DB
    const [pawningCustomers] = await pool.query(
      `SELECT idCustomer, accountCenterCusId FROM customer WHERE idCustomer IN (?)`,
      [uniqueCustomerIds],
    );

    const accCenterCusIds = pawningCustomers
      .map((c) => c.accountCenterCusId)
      .filter((id) => id);
    let customerMap = {};

    if (accCenterCusIds.length > 0) {
      // Fetch details from pool2 - using First_Name, Last_Name
      const [accDetails] = await pool2.query(
        `SELECT idCustomer, Nic, First_Name, Last_Name FROM customer WHERE idCustomer IN (?)`,
        [accCenterCusIds],
      );

      const accMap = {};
      accDetails.forEach((c) => {
        accMap[c.idCustomer] = c;
      });

      pawningCustomers.forEach((pc) => {
        if (pc.accountCenterCusId && accMap[pc.accountCenterCusId]) {
          customerMap[pc.idCustomer] = accMap[pc.accountCenterCusId];
        }
      });
    }

    // Step 4: Format Response
    const result = tickets.map((t) => {
      const cus = customerMap[t.Customer_idCustomer] || {};
      const firstName = cus.First_Name || "";
      const lastName = cus.Last_Name || "";
      const fullName =
        firstName && lastName
          ? `${firstName} ${lastName}`
          : firstName || lastName || "Unknown";

      return {
        idPawning_Ticket: t.idPawning_Ticket,
        Ticket_No: t.Ticket_No,
        Full_name: fullName,
        NIC: cus.Nic || "",
      };
    });

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
      "SELECT idPawning_Ticket, Ticket_No,Pawning_Product_idPawning_Product,Period,Date_Time,Status,Maturity_date,Pawning_Advance_Amount,Customer_idCustomer,Gross_Weight,Net_Weight,Interest_Rate,Service_charge_Amount,Late_charge_Presentage,User_idUser,Note,Interest_apply_on,Period_Type,SEQ_No,renewReqStatus FROM pawning_ticket WHERE idPawning_Ticket = ? AND  Branch_idBranch = ?",
      [ticketId, req.branchId],
    );

    if (ticketData.length === 0) {
      return next(errorHandler(404, "No ticket found for the given ID"));
    }

    // fetch ticket images
    const [ticketImages] = await pool.query(
      "SELECT * FROM ticket_artical_images WHERE Pawning_Ticket_idPawning_Ticket = ?",
      [ticketData[0].idPawning_Ticket],
    );

    // attach images to ticket data
    ticketData[0].images = ticketImages;

    // Fetch and attach the last comment for this ticket if exists (user is in pool2)
    const [lastCommentData] = await pool.query(
      `SELECT tc.*
         FROM ticket_comment tc
        WHERE tc.Pawning_Ticket_idPawning_Ticket = ?
     ORDER BY tc.idTicket_Comment DESC
        LIMIT 1`,
      [ticketData[0].idPawning_Ticket],
    );

    // Fetch user name from pool2 if comment exists
    if (lastCommentData.length > 0 && lastCommentData[0].User_idUser) {
      const [commentUser] = await pool2.query(
        "SELECT full_name FROM user WHERE idUser = ?",
        [lastCommentData[0].User_idUser],
      );
      lastCommentData[0].Full_name = commentUser[0]?.full_name || null;
    }

    ticketData[0].lastComment = lastCommentData[0] || null;

    // get the product name for the ticket
    const [productData] = await pool.query(
      "SELECT Name,Early_Settlement_Charge,Early_Settlement_Charge_Create_As,Early_Settlement_Charge_Value_type,Early_Settlement_Charge_Value,Interest_Method FROM pawning_product WHERE idPawning_Product = ?",
      [ticketData[0].Pawning_Product_idPawning_Product],
    );

    ticketData[0].productName = productData[0].Name || "Unknown Product"; // attach product name to ticket data

    // get the officer name for the ticket from pool2 (user table is in pool2)
    const [officerData] = await pool2.query(
      "SELECT full_name FROM user WHERE idUser = ?",
      [ticketData[0].User_idUser],
    );
    ticketData[0].officerName = officerData[0]?.full_name || "Unknown Officer"; // attach officer name to ticket data
    delete ticketData[0].User_idUser; // remove User_idUser from ticket data

    // fetch customer data for the ticket
    // First get accountCenterCusId from pawning DB
    const [pawningCustomer] = await pool.query(
      "SELECT idCustomer, accountCenterCusId FROM customer WHERE idCustomer = ?",
      [ticketData[0].Customer_idCustomer],
    );

    if (pawningCustomer.length === 0) {
      return next(
        errorHandler(
          404,
          "No customer found for the ticket's customer ID: " +
            ticketData[0].Customer_idCustomer,
        ),
      );
    }

    // Fetch customer details from Account Center (pool2)
    // Schema: First_Name, Last_Name, Nic, Contact_No, Customer_Risk_Level (No Full_name)
    const [accCustomer] = await pool2.query(
      "SELECT idCustomer, First_Name, Last_Name, Nic, Customer_Risk_Level, Contact_No FROM customer WHERE idCustomer = ?",
      [pawningCustomer[0].accountCenterCusId],
    );

    let customerDetails = {};
    if (accCustomer.length > 0) {
      const acc = accCustomer[0];
      const firstName = acc.First_Name || "";
      const lastName = acc.Last_Name || "";
      const fullName =
        firstName && lastName
          ? `${firstName} ${lastName}`
          : firstName || lastName || "Unknown";

      customerDetails = {
        Full_name: fullName,
        Risk_Level: acc.Customer_Risk_Level,
        Mobile_No: acc.Contact_No,
      };
    } else {
      customerDetails = {
        Full_name: "Unknown",
        Risk_Level: null,
        Mobile_No: null,
      };
    }

    // Fetch customer documents from Pawning DB (pool)
    const [customerDocs] = await pool.query(
      "SELECT Document_Name, Path FROM customer_documents WHERE Customer_idCustomer = ?",
      [ticketData[0].Customer_idCustomer],
    );

    const customer = {
      idCustomer: pawningCustomer[0].idCustomer,
      Full_name: customerDetails.Full_name,
      Risk_Level: customerDetails.Risk_Level,
      Mobile_No: customerDetails.Mobile_No,
      documents: customerDocs.map((r) => ({
        Document_Name: r.Document_Name,
        Path: r.Path,
      })),
    };
    // fetch customer ative,inactive and overdue ticket counts and attach them to customer data
    const [ticketCounts] = await pool.query(
      "SELECT Status, COUNT(*) AS count FROM pawning_ticket WHERE Customer_idCustomer = ? AND Branch_idBranch = ? GROUP BY Status",
      [ticketData[0].Customer_idCustomer, req.branchId],
    );

    customer.activeTickets =
      ticketCounts.find((t) => parseInt(t.Status) === 1)?.count || 0;
    customer.settledTickets =
      ticketCounts.find((t) => parseInt(t.Status) === 2)?.count || 0;
    customer.overdueTickets =
      ticketCounts.find((t) => parseInt(t.Status) === 3)?.count || 0;

    // article items for the ticket
    [articleItems] = await pool.query(
      "SELECT * FROM ticket_articles WHERE Pawning_Ticket_idPawning_Ticket = ?",
      [ticketData[0].idPawning_Ticket],
    );

    // get article type and category names from pool2 for each article item and attach them
    for (let item of articleItems) {
      const [typeData] = await pool2.query(
        "SELECT Description FROM article_types WHERE idArticle_Types = ?",
        [parseInt(item.Article_type)],
      );
      item.ArticleTypeName = typeData[0]?.Description || "Unknown Type";

      const [categoryData] = await pool2.query(
        "SELECT Description FROM article_categories WHERE idArticle_Categories = ?",
        [parseInt(item.Article_category)],
      );
      item.categoryName = categoryData[0]?.Description || "Unknown Category";

      // Remove Article_type and Article_category from item
      delete item.Article_type;
      delete item.Article_category;
    }

    [ticketCharges] = await pool.query(
      "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
      [ticketData[0].idPawning_Ticket],
    );

    // get ticket payment history from ticket payment table (user is in pool2)
    [paymentHistory] = await pool.query(
      "SELECT p.Date_Time, p.Type, p.Amount, p.Description, p.Advance_Payment, p.Service_Charge_Payment, p.Interest_Payment, p.Other_Charges_Payment, p.Late_Charges_Payment, p.Early_Charge_Payment, p.User FROM payment p WHERE p.Ticket_no = ? ORDER BY STR_TO_DATE(p.Date_Time, '%Y-%m-%d %H:%i:%s') DESC",
      [String(ticketData[0].Ticket_No)],
    );

    // Fetch user names from pool2 for each payment
    for (let payment of paymentHistory) {
      if (payment.User) {
        const [userData] = await pool2.query(
          "SELECT full_name FROM user WHERE idUser = ?",
          [payment.User],
        );
        payment.full_name = userData[0]?.full_name || null;
      } else {
        payment.full_name = null;
      }
      delete payment.User; // Remove User id from response
    }

    let earlySettlementCharge = 0;
    // find the early settlement charge value
    if (productData[0].Early_Settlement_Charge === "1") {
      // if early settlement charge is active

      // if create as is charge for product
      if (
        productData[0].Early_Settlement_Charge_Create_As ===
        "Charge For Product"
      ) {
        if (
          productData[0].Early_Settlement_Charge_Value_type === "Percentage"
        ) {
          // percentage of pawning advance amount
          earlySettlementCharge =
            (productData[0].Early_Settlement_Charge_Value / 100) *
            ticketCharges[0].Advance_Balance;
        } else if (
          productData[0].Early_Settlement_Charge_Value_type === "Fixed Amount"
        ) {
          // fixed amount
          earlySettlementCharge = productData[0].Early_Settlement_Charge_Value;
        }
      }

      // if create as is Charge For Product Item
      if (
        productData[0].Early_Settlement_Charge_Create_As ===
        "Charge For Product Item"
      ) {
        // check what is the interest method

        // if interest for period
        if (productData[0].Interest_Method === "Interest For Period") {
          // get the early settlement value from product plans table by mathing the ticket period and period type
          const [planData] = await pool.query(
            "SELECT Early_Settlement_Charge_Value,Early_Settlement_Charge_Value_type FROM product_plan WHERE Pawning_Product_idPawning_Product = ? AND Period_Type = ? AND CAST(? AS UNSIGNED) BETWEEN CAST(Minimum_Period AS UNSIGNED) AND CAST(Maximum_Period AS UNSIGNED)",
            [
              ticketData[0].Pawning_Product_idPawning_Product,
              ticketData[0].Period_Type,
              ticketData[0].Period,
            ],
          );

          if (planData.length > 0) {
            if (
              planData[0].Early_Settlement_Charge_Value_type === "percentage"
            ) {
              // percentage of pawning advance amount
              earlySettlementCharge =
                (planData[0].Early_Settlement_Charge_Value / 100) *
                ticketCharges[0].Advance_Balance;
            } else if (
              planData[0].Early_Settlement_Charge_Value_type === "fixed"
            ) {
              // fixed amount
              earlySettlementCharge = planData[0].Early_Settlement_Charge_Value;
            }
          }
        }

        // if Interest For Pawning Amount
        if (productData[0].Interest_Method === "Interest For Pawning Amount") {
          // get the early settlement charge from product plan table by matching the pawning advance amount with Minimum and Maximum Amount range
          const [planData] = await pool.query(
            "SELECT Early_Settlement_Charge_Value,Early_Settlement_Charge_Value_type FROM product_plan WHERE Pawning_Product_idPawning_Product = ? AND CAST(Minimum_Amount AS UNSIGNED) <= CAST(? AS UNSIGNED) AND CAST(Maximum_Amount AS UNSIGNED) >= CAST(? AS UNSIGNED)",
            [
              ticketData[0].Pawning_Product_idPawning_Product,
              ticketCharges[0].Advance_Balance,
              ticketCharges[0].Advance_Balance,
            ],
          );

          if (planData.length > 0) {
            if (
              planData[0].Early_Settlement_Charge_Value_type === "percentage"
            ) {
              // percentage of pawning advance amount
              earlySettlementCharge =
                (planData[0].Early_Settlement_Charge_Value / 100) *
                ticketCharges[0].Advance_Balance;
            } else if (
              planData[0].Early_Settlement_Charge_Value_type === "fixed"
            ) {
              // fixed amount
              earlySettlementCharge = planData[0].Early_Settlement_Charge_Value;
            }
          }
        }
      }

      // if Charge For Settlement Amount
      if (
        productData[0].Early_Settlement_Charge_Create_As ===
        "Charge For Settlement Amount"
      ) {
        // go to the early_settlement_charges table and get the early settlement charge by matching pawning advance with From Amount and To Amount range
        const [chargeData] = await pool.query(
          "SELECT Value_Type,Amount FROM early_settlement_charges WHERE Pawning_Product_idPawning_Product = ? AND CAST(From_Amount AS UNSIGNED) <= CAST(? AS UNSIGNED) AND CAST(To_Amount AS UNSIGNED) >= CAST(? AS UNSIGNED)",
          [
            ticketData[0].Pawning_Product_idPawning_Product,
            ticketCharges[0].Advance_Balance,
            ticketCharges[0].Advance_Balance,
          ],
        );

        if (chargeData.length > 0) {
          if (chargeData[0].Value_Type === "Percentage") {
            // percentage of pawning advance amount
            earlySettlementCharge =
              (chargeData[0].Amount / 100) * ticketCharges[0].Advance_Balance;
          } else if (chargeData[0].Value_Type === "Fixed Amount") {
            // fixed amount
            earlySettlementCharge = chargeData[0].Amount;
          }
        }
      }
    }

    // calculate the minimum renewal amount
    function safeParse(val) {
      const n = parseFloat(val);
      return isNaN(n) ? 0 : n;
    }

    console.log(ticketCharges);
    let minimumRenewalAmount =
      safeParse(ticketCharges[0].Interest_Balance) +
      safeParse(ticketCharges[0].Service_Charge_Balance) +
      safeParse(ticketCharges[0].Late_Charges_Balance) +
      safeParse(ticketCharges[0].Additional_Charge_Balance);

    //console.log("Minimum Renewal Amount:", minimumRenewalAmount);

    ticketCharges[0].minimumRenewalAmount = minimumRenewalAmount;

    // calculaate the loan settlement amount
    let loanSettlementAmount =
      safeParse(ticketCharges[0].Total_Balance) +
      safeParse(earlySettlementCharge);
    ticketCharges[0].loanSettlementAmount = loanSettlementAmount;

    res.status(200).json({
      success: true,
      ticketDetails: {
        ticketData: ticketData[0],
        customerData: customer,
        articleItems,
        ticketCharges: ticketCharges[0] || {},
        paymentHistory,
        earlySettlementCharge,
        isRenewReqEnabled:
          ticketData[0].Maturity_date <
            new Date().toISOString().split("T")[0] &&
          ticketData[0].renewReqStatus === null,
        canRenew:
          ticketData[0].Maturity_date <
            new Date().toISOString().split("T")[0] &&
          ticketData[0].renewReqStatus === 2,
        renewState:
          ticketData[0].Maturity_date < new Date().toISOString().split("T")[0],
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

    // Fetch ticket logs without user JOIN (user is in pool2)
    const [result] = await pool.query(
      `SELECT tl.*
   FROM ticket_log tl
   WHERE tl.Pawning_Ticket_idPawning_Ticket = ?`,
      [ticketId],
    );

    // Fetch user names from pool2 for each log entry
    for (let log of result) {
      if (log.User_idUser) {
        const [userData] = await pool2.query(
          "SELECT full_name FROM user WHERE idUser = ?",
          [log.User_idUser],
        );
        log.officerName = userData[0]?.full_name || null;
      } else {
        log.officerName = null;
      }
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

// get ticket additional charges by ticket id
export const getTicketAdditionalChargesById = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const ticketId = req.params.id || req.params.ticketId;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }

    const paginationData = await getPaginationData(
      "SELECT COUNT(*) AS TOTAL FROM additional_charges WHERE Pawning_Ticket_idPawning_Ticket = ?",
      [ticketId],
      page,
      limit,
    );

    // Fetch additional charges without user JOIN (user is in pool2)
    const [ticketAdditionalCharges] = await pool.query(
      `SELECT ac.*
       FROM additional_charges ac
      WHERE ac.Pawning_Ticket_idPawning_Ticket = ?
   ORDER BY STR_TO_DATE(ac.Date_Time, '%Y-%m-%d %H:%i:%s') DESC
      LIMIT ? OFFSET ?`,
      [ticketId, limit, offset],
    );

    // Fetch user names from pool2 for each charge
    for (let charge of ticketAdditionalCharges) {
      if (charge.User_idUser) {
        const [userData] = await pool2.query(
          "SELECT full_name FROM user WHERE idUser = ?",
          [charge.User_idUser],
        );
        charge.officerName = userData[0]?.full_name || null;
      } else {
        charge.officerName = null;
      }
    }

    res.status(200).json({
      success: true,
      ticketAdditionalCharges,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error fetching ticket additional charges by ID:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// create a new ticket additional charge
export const createTicketAdditionalCharge = async (req, res, next) => {
  try {
    const ticketId = req.params.id || req.params.ticketId;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }

    const { description, amount, note } = req.body;

    if (!amount || !description) {
      return next(errorHandler(400, "Amount and Description is required"));
    }

    const [result] = await pool.query(
      "INSERT INTO additional_charges (Description,Amount,Pawning_Ticket_idPawning_Ticket,Note,User_idUser,Date_Time) VALUES (?,?,?,?,?,NOW())",
      [description, amount, ticketId, note, req.userId],
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create additional charge"));
    }

    // send the created additional charge data as response (user is in pool2)
    const [newCharge] = await pool.query(
      `SELECT ac.*
       FROM additional_charges ac
      WHERE ac.idAdditional_Charges = ?`,
      [result.insertId],
    );

    // Fetch user name from pool2
    if (newCharge.length > 0 && newCharge[0].User_idUser) {
      const [userData] = await pool2.query(
        "SELECT full_name FROM user WHERE idUser = ?",
        [newCharge[0].User_idUser],
      );
      newCharge[0].officerName = userData[0]?.full_name || null;
    }

    // create a pawning ticket log entry for the additional charge
    await createPawningTicketLogOnAdditionalCharge(
      ticketId,
      "ADDITIONAL CHARGE",
      req.userId,
      amount,
    );

    res.status(201).json({
      success: true,
      message: "Additional charge created successfully.",
      additionalCharge: newCharge[0],
    });
  } catch (error) {
    console.error("Error creating ticket additional charge:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// create the part payment for a ticket
export const createPaymentForTicket = async (req, res, next) => {
  let connection;
  let connection2;
  try {
    const ticketId = req.params.id || req.params.ticketId;
    const { paymentAmount, toAccountId } = req.body;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }

    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      return next(errorHandler(400, "Valid part payment amount is required"));
    }
    if (!toAccountId) {
      return next(errorHandler(400, "To Account ID is required"));
    }

    // Get connections from both pools
    connection = await pool.getConnection();
    connection2 = await pool2.getConnection();

    // Start transactions on both connections
    await connection.beginTransaction();
    await connection2.beginTransaction();

    try {
      // validate toAccountId exists in the accounts table (pool2)
      const [accountData] = await connection2.query(
        "SELECT * FROM accounting_accounts WHERE idAccounting_Accounts = ?",
        [toAccountId],
      );

      if (accountData.length === 0) {
        await connection.rollback();
        await connection2.rollback();
        connection.release();
        connection2.release();
        return next(errorHandler(400, "Invalid To Account ID"));
      }

      // check if the ticket exists and belongs to the branch (pool)
      const [existingTicket] = await connection.query(
        "SELECT Interest_apply_on,Maturity_date,Date_Time,Ticket_No FROM pawning_ticket WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
        [ticketId, req.branchId],
      );
      if (existingTicket.length === 0) {
        await connection.rollback();
        await connection2.rollback();
        connection.release();
        connection2.release();
        return next(errorHandler(404, "No ticket found for the given ID"));
      }

      // get the lastest ticket log entry for the ticket (pool)
      const [ticketLog] = await connection.query(
        "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
        [ticketId],
      );

      if (ticketLog.length === 0) {
        await connection.rollback();
        await connection2.rollback();
        connection.release();
        connection2.release();
        return next(
          errorHandler(500, "No ticket log found for the given ticket"),
        );
      }

      // get the day count by from today date to ticket Date_Time
      const today = new Date();
      const ticketDate = new Date(existingTicket[0].Date_Time);
      const timeDiff = Math.abs(today - ticketDate);
      const dayCount = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      // Insert into payment table (pool)
      const [ticketPaymentResult] = await connection.query(
        "INSERT INTO payment(Date_time,Description,Ticket_no,Amount,User,Ticket_Date,Maturity_Date,Day_Count,Type) VALUES(NOW(),?,?,?,?,?,?,?,?)",
        [
          `Customer Payment(Ticket No:${existingTicket[0].Ticket_No})`,
          existingTicket[0].Ticket_No,
          paymentAmount,
          req.userId,
          existingTicket[0].Date_Time,
          existingTicket[0].Maturity_date,
          dayCount,
          "PART PAYMENT",
        ],
      );

      if (ticketPaymentResult.affectedRows === 0) {
        throw errorHandler(500, "Failed to create part payment");
      }

      const createdTicketPaymentId = ticketPaymentResult.insertId;

      // Calculate payment distribution
      let remainingPayment = paymentAmount;
      let {
        Interest_Balance,
        Service_Charge_Balance,
        Late_Charges_Balance,
        Aditional_Charge_Balance,
        Advance_Balance,
      } = ticketLog[0];

      let paidInterest = 0;
      let paidServiceCharge = 0;
      let paidLateCharges = 0;
      let paidAdditionalCharges = 0;
      let paidAdvance = 0;

      function safePay(balance, remaining) {
        balance = parseFloat(balance);
        balance = isNaN(balance) ? 0 : balance;
        let paid = 0;
        if (remaining > 0 && balance > 0) {
          paid = Math.min(remaining, balance);
          remaining -= paid;
          balance -= paid;
        }
        return { paid, balance, remaining };
      }

      // Additional Charges
      let result = safePay(Aditional_Charge_Balance, remainingPayment);
      paidAdditionalCharges = result.paid;
      Aditional_Charge_Balance = result.balance;
      remainingPayment = result.remaining;

      // Late Charges
      result = safePay(Late_Charges_Balance, remainingPayment);
      paidLateCharges = result.paid;
      Late_Charges_Balance = result.balance;
      remainingPayment = result.remaining;

      // Interest Charges
      result = safePay(Interest_Balance, remainingPayment);
      paidInterest = result.paid;
      Interest_Balance = result.balance;
      remainingPayment = result.remaining;

      // Service Charges
      result = safePay(Service_Charge_Balance, remainingPayment);
      paidServiceCharge = result.paid;
      Service_Charge_Balance = result.balance;
      remainingPayment = result.remaining;

      // Advance Balance
      result = safePay(Advance_Balance, remainingPayment);
      paidAdvance = result.paid;
      Advance_Balance = result.balance;
      remainingPayment = result.remaining;

      // Total Balance
      const Total_Balance =
        Interest_Balance +
        Service_Charge_Balance +
        Late_Charges_Balance +
        Aditional_Charge_Balance +
        Advance_Balance;

      // Insert ticket log record (pool)
      const [logResult] = await connection.query(
        "INSERT INTO ticket_log(Pawning_Ticket_idPawning_Ticket,Date_Time,Type,Description,Amount,Interest_Balance,Service_Charge_Balance,Late_Charges_Balance,Aditional_Charge_Balance,Advance_Balance,Total_Balance,User_idUser,Type_Id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          ticketId,
          new Date(),
          "PAYMENT",
          `Part payment received. Payment ID: ${createdTicketPaymentId}`,
          paymentAmount,
          Interest_Balance,
          Service_Charge_Balance,
          Late_Charges_Balance,
          Aditional_Charge_Balance,
          Advance_Balance,
          Total_Balance,
          req.userId,
          createdTicketPaymentId,
        ],
      );

      if (logResult.affectedRows === 0) {
        throw errorHandler(500, "Failed to update ticket log");
      }

      // Update payment record (pool)
      const [updatePaymentResult] = await connection.query(
        "UPDATE payment SET Interest_Payment = ?, Service_Charge_Payment = ?, Late_Charges_Payment = ?, Other_Charges_Payment = ?, Advance_Payment = ? WHERE id = ?",
        [
          paidInterest || 0,
          paidServiceCharge || 0,
          paidLateCharges || 0,
          paidAdditionalCharges || 0,
          paidAdvance || 0,
          createdTicketPaymentId,
        ],
      );

      if (updatePaymentResult.affectedRows === 0) {
        throw errorHandler(500, "Failed to update payment details");
      }

      // Helper to credit/debit accounting accounts (using connection2 for pool2)
      const creditAccount = async ({
        accountType,
        group,
        amount,
        description,
        contraAccountId,
        isAssetDecrease = false,
      }) => {
        if (!amount || amount <= 0) return;
        console.log(accountType, group, req.branchId);
        const [accountRows] = await connection2.query(
          "SELECT idAccounting_Accounts, Account_Balance FROM accounting_accounts WHERE Account_Type = ? AND Group_Of_Type = ? AND Branch_idBranch = ? And Account_Name = ? LIMIT 1",
          ["System Default", group, req.branchId, accountType],
        );
        if (accountRows.length === 0) {
          throw errorHandler(500, `${accountType} account not found`);
        }
        const accountId = accountRows[0].idAccounting_Accounts;
        const currentBal = parseFloat(accountRows[0].Account_Balance) || 0;
        const newBal = isAssetDecrease
          ? currentBal - amount
          : currentBal + amount;

        await connection2.query(
          "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ?",
          [newBal, accountId],
        );

        const [logInsert] = await connection2.query(
          "INSERT INTO accounting_accounts_log (Accounting_Accounts_idAccounting_Accounts, Date_Time, Type, Description, Debit, Credit, Balance, Contra_Account, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            accountId,
            new Date(),
            "Ticket Part Payment",
            description,
            isAssetDecrease ? 0 : amount,
            isAssetDecrease ? amount : 0,
            newBal,
            contraAccountId,
            req.userId,
          ],
        );

        if (logInsert.affectedRows === 0) {
          throw errorHandler(
            500,
            `Failed to add entry to ${accountType} account`,
          );
        }
      };

      // Update the balance of the toAccountId (pool2)
      let currentBalance = parseFloat(accountData[0].Account_Balance) || 0;
      currentBalance += parseFloat(paymentAmount);

      await connection2.query(
        "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ?",
        [currentBalance, toAccountId],
      );

      await connection2.query(
        "INSERT INTO accounting_accounts_log (Accounting_Accounts_idAccounting_Accounts,Date_Time,Type,Description,Debit,Credit,Balance,Contra_Account,User_idUser) VALUES (?,?,?,?,?,?,?,?,?)",
        [
          toAccountId,
          new Date(),
          "Ticket Part Payment",
          `Customer Part Payment (Ticket No: ${existingTicket[0].Ticket_No})`,
          paymentAmount,
          0,
          currentBalance,
          null,
          req.userId,
        ],
      );

      // Credit Pawn Loan Receivable (pool2)
      await creditAccount({
        accountType: "Pawn Loan Receivable",
        group: "Assets",
        amount: paidAdvance,
        description: `Customer Part Payment (Ticket No: ${existingTicket[0].Ticket_No})`,
        contraAccountId: toAccountId,
        isAssetDecrease: true,
      });

      // Credit Pawning Interest Revenue (pool2)
      await creditAccount({
        accountType: "Pawning Interest Revenue",
        group: "Revenue",
        amount: paidInterest,
        description: `Customer Part Payment (Ticket No: ${existingTicket[0].Ticket_No}) Interest Payment`,
        contraAccountId: toAccountId,
      });

      // Credit Penalty / Overdue Charges Revenue (pool2)
      await creditAccount({
        accountType: "Penalty / Overdue Charges Revenue",
        group: "Revenue",
        amount: paidLateCharges,
        description: `Customer Part Payment (Ticket No: ${existingTicket[0].Ticket_No}) Late Charges Payment`,
        contraAccountId: toAccountId,
      });

      // Credit Pawn Service Charge / Handling Fee Revenue (pool2)
      await creditAccount({
        accountType: "Pawn Service Charge / Handling Fee Revenue",
        group: "Revenue",
        amount: paidServiceCharge,
        description: `Customer Part Payment (Ticket No: ${existingTicket[0].Ticket_No}) Service Charge Payment`,
        contraAccountId: toAccountId,
      });

      await creditAccount({
        accountType: "Pawn Service Charge / Handling Fee Revenue",
        group: "Revenue",
        amount: paidAdditionalCharges,
        description: `Customer Part Payment (Ticket No: ${existingTicket[0].Ticket_No}) Additional Charges Payment`,
        contraAccountId: toAccountId,
      });

      // Commit both transactions
      await connection.commit();
      await connection2.commit();
      connection.release();
      connection2.release();

      res.status(201).json({
        success: true,
        message: "Part payment created successfully.",
      });
    } catch (innerError) {
      await connection.rollback();
      await connection2.rollback();
      connection.release();
      connection2.release();
      console.error("Error creating part payment for ticket:", innerError);
      return next(errorHandler(500, "Internal Server Error"));
    }
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    if (connection2) {
      await connection2.rollback();
      connection2.release();
    }
    console.error("Error creating part payment for ticket:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// make a payment for ticket renewal
export const createTicketRenewalPayment = async (req, res, next) => {
  let connection;
  let connection2;
  try {
    const ticketId = req.params.id || req.params.ticketId;
    const { paymentAmount, toAccountId } = req.body;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }
    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      return next(errorHandler(400, "Valid part payment amount is required"));
    }

    if (!toAccountId) {
      return next(errorHandler(400, "To Account ID is required"));
    }

    // Get connections from both pools
    connection = await pool.getConnection();
    connection2 = await pool2.getConnection();

    // Start transactions on both connections
    await connection.beginTransaction();
    await connection2.beginTransaction();

    try {
      // validate toAccountId exists in the accounts table (pool2)
      const [accountData] = await connection2.query(
        "SELECT * FROM accounting_accounts WHERE idAccounting_Accounts = ?",
        [toAccountId],
      );

      if (accountData.length === 0) {
        await connection.rollback();
        await connection2.rollback();
        connection.release();
        connection2.release();
        return next(errorHandler(400, "Invalid To Account ID"));
      }

      // check if the ticket exists and belongs to the branch (pool)
      const [existingTicket] = await connection.query(
        "SELECT Interest_apply_on,Maturity_date,Date_Time,Ticket_No,Period_Type,Period FROM pawning_ticket WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
        [ticketId, req.branchId],
      );
      if (existingTicket.length === 0) {
        await connection.rollback();
        await connection2.rollback();
        connection.release();
        connection2.release();
        return next(errorHandler(404, "No ticket found for the given ID"));
      }

      // get the lastest ticket log entry for the ticket (pool)
      const [ticketLog] = await connection.query(
        "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
        [ticketId],
      );

      if (ticketLog.length === 0) {
        await connection.rollback();
        await connection2.rollback();
        connection.release();
        connection2.release();
        return next(
          errorHandler(500, "No ticket log found for the given ticket"),
        );
      }

      // First check payment amount is equal or greater than the ticket's other charges sum
      const otherChargesTotal =
        (parseFloat(ticketLog[0].Interest_Balance) || 0) +
        (parseFloat(ticketLog[0].Service_Charge_Balance) || 0) +
        (parseFloat(ticketLog[0].Late_Charges_Balance) || 0) +
        (parseFloat(ticketLog[0].Aditional_Charge_Balance) || 0);

      if (paymentAmount < otherChargesTotal) {
        await connection.rollback();
        await connection2.rollback();
        connection.release();
        connection2.release();
        return next(
          errorHandler(
            400,
            `Payment amount should be at least ${otherChargesTotal} to cover all other charges.`,
          ),
        );
      }

      // update the ticket's maturity date from today to new maturity date based on ticket's Period_Type and Period
      let newMaturityDate = new Date(); // start from today
      if (existingTicket[0].Period_Type === "days") {
        newMaturityDate.setDate(
          newMaturityDate.getDate() + parseInt(existingTicket[0].Period),
        );
      }
      if (existingTicket[0].Period_Type === "months") {
        newMaturityDate.setMonth(
          newMaturityDate.getMonth() + parseInt(existingTicket[0].Period),
        );
      }

      if (existingTicket[0].Period_Type === "years") {
        newMaturityDate.setFullYear(
          newMaturityDate.getFullYear() + parseInt(existingTicket[0].Period),
        );
      }

      if (existingTicket[0].Period_Type === "weeks") {
        newMaturityDate.setDate(
          newMaturityDate.getDate() + 7 * parseInt(existingTicket[0].Period),
        );
      }

      // update the ticket's maturity date and Status to active (1) with grant date to today (pool)
      const [updateMaturityResult] = await connection.query(
        "UPDATE pawning_ticket SET Maturity_date = ? , Status = '1',Date_Time = ?, Print_Status = '0' WHERE idPawning_Ticket = ?",
        [newMaturityDate, new Date(), ticketId],
      );

      if (updateMaturityResult.affectedRows === 0) {
        throw errorHandler(500, "Failed to update ticket maturity date");
      }

      // get the day count by from today date to ticket Date_Time
      const today = new Date();
      const ticketDate = new Date(existingTicket[0].Date_Time);
      const timeDiff = Math.abs(today - ticketDate);
      const dayCount = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      // Insert into payment table (pool)
      const [ticketPaymentResult] = await connection.query(
        "INSERT INTO payment(Date_time,Description,Ticket_no,Amount,User,Ticket_Date,Maturity_Date,Day_Count,Type) VALUES(NOW(),?,?,?,?,?,?,?,?)",
        [
          `Customer Payment(Ticket No:${existingTicket[0].Ticket_No})`,
          existingTicket[0].Ticket_No,
          paymentAmount,
          req.userId,
          existingTicket[0].Date_Time,
          new Date(),
          dayCount,
          "RENEWAL PAYMENT",
        ],
      );

      if (ticketPaymentResult.affectedRows === 0) {
        throw errorHandler(500, "Failed to create renewal payment");
      }

      const createdTicketPaymentId = ticketPaymentResult.insertId;

      // Calculate payment distribution
      let remainingPayment = paymentAmount;
      let {
        Interest_Balance,
        Service_Charge_Balance,
        Late_Charges_Balance,
        Aditional_Charge_Balance,
        Advance_Balance,
      } = ticketLog[0];

      let paidInterest = 0;
      let paidServiceCharge = 0;
      let paidLateCharges = 0;
      let paidAdditionalCharges = 0;
      let paidAdvance = 0;

      function safePay(balance, remaining) {
        balance = parseFloat(balance);
        balance = isNaN(balance) ? 0 : balance;
        let paid = 0;
        if (remaining > 0 && balance > 0) {
          paid = Math.min(remaining, balance);
          remaining -= paid;
          balance -= paid;
        }
        return { paid, balance, remaining };
      }

      // Additional Charges
      let result = safePay(Aditional_Charge_Balance, remainingPayment);
      paidAdditionalCharges = result.paid;
      Aditional_Charge_Balance = result.balance;
      remainingPayment = result.remaining;

      // Late Charges
      result = safePay(Late_Charges_Balance, remainingPayment);
      paidLateCharges = result.paid;
      Late_Charges_Balance = result.balance;
      remainingPayment = result.remaining;

      // Interest Charges
      result = safePay(Interest_Balance, remainingPayment);
      paidInterest = result.paid;
      Interest_Balance = result.balance;
      remainingPayment = result.remaining;

      // Service Charges
      result = safePay(Service_Charge_Balance, remainingPayment);
      paidServiceCharge = result.paid;
      Service_Charge_Balance = result.balance;
      remainingPayment = result.remaining;

      // Advance Balance
      result = safePay(Advance_Balance, remainingPayment);
      paidAdvance = result.paid;
      Advance_Balance = result.balance;
      remainingPayment = result.remaining;

      // Total Balance
      const Total_Balance =
        Interest_Balance +
        Service_Charge_Balance +
        Late_Charges_Balance +
        Aditional_Charge_Balance +
        Advance_Balance;

      // Insert ticket log record (pool)
      const [logResult] = await connection.query(
        "INSERT INTO ticket_log(Pawning_Ticket_idPawning_Ticket,Date_Time,Type,Description,Amount,Interest_Balance,Service_Charge_Balance,Late_Charges_Balance,Aditional_Charge_Balance,Advance_Balance,Total_Balance,User_idUser,Type_Id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          ticketId,
          new Date(),
          "PAYMENT",
          `Renewal payment received. Payment ID: ${createdTicketPaymentId}`,
          paymentAmount,
          Interest_Balance,
          Service_Charge_Balance,
          Late_Charges_Balance,
          Aditional_Charge_Balance,
          Advance_Balance,
          Total_Balance,
          req.userId,
          createdTicketPaymentId,
        ],
      );

      if (logResult.affectedRows === 0) {
        throw errorHandler(500, "Failed to update ticket log");
      }

      // Update payment record (pool)
      const [updatePaymentResult] = await connection.query(
        "UPDATE payment SET Interest_Payment = ?, Service_Charge_Payment = ?, Late_Charges_Payment = ?, Other_Charges_Payment = ?, Advance_Payment = ? WHERE id = ?",
        [
          paidInterest || 0,
          paidServiceCharge || 0,
          paidLateCharges || 0,
          paidAdditionalCharges || 0,
          paidAdvance || 0,
          createdTicketPaymentId,
        ],
      );

      if (updatePaymentResult.affectedRows === 0) {
        throw errorHandler(500, "Failed to update payment details");
      }

      // Update the balance of the toAccountId (pool2)
      let currentBalance = parseFloat(accountData[0].Account_Balance) || 0;
      currentBalance += parseFloat(paymentAmount);

      const [updateAccountResult] = await connection2.query(
        "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ?",
        [currentBalance, toAccountId],
      );

      if (updateAccountResult.affectedRows === 0) {
        throw errorHandler(500, "Failed to update account balance");
      }

      // Add a debit entry to accounting_accounts_log table (pool2)
      const [accountLogResult] = await connection2.query(
        "INSERT INTO accounting_accounts_log (Accounting_Accounts_idAccounting_Accounts,Date_Time,Type,Description,Debit,Credit,Balance,Contra_Account,User_idUser) VALUES (?,?,?,?,?,?,?,?,?)",
        [
          toAccountId,
          new Date(),
          "Ticket Renewal Payment",
          `Customer Renewal Payment (Ticket No: ${existingTicket[0].Ticket_No})`,
          paymentAmount,
          0,
          currentBalance,
          null,
          req.userId,
        ],
      );

      if (accountLogResult.affectedRows === 0) {
        throw errorHandler(500, "Failed to create account log");
      }

      // Commit both transactions
      await connection.commit();
      await connection2.commit();
      connection.release();
      connection2.release();

      res.status(201).json({
        success: true,
        message: "Renewal payment created successfully.",
      });
    } catch (innerError) {
      await connection.rollback();
      await connection2.rollback();
      connection.release();
      connection2.release();
      console.error("Error creating renewal payment for ticket:", innerError);
      return next(errorHandler(500, "Internal Server Error"));
    }
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    if (connection2) {
      await connection2.rollback();
      connection2.release();
    }
    console.error("Error creating renewal payment for ticket:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// make ticket settlement payment
export const createTicketSettlementPayment = async (req, res, next) => {
  let connection;
  let connection2;
  try {
    const ticketId = req.params.id || req.params.ticketId;
    const { paymentAmount, toAccountId } = req.body;

    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }
    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      return next(
        errorHandler(400, "Valid settlement payment amount is required"),
      );
    }
    if (!toAccountId) {
      return next(errorHandler(400, "To Account ID is required"));
    }

    // Get connections from both pools
    connection = await pool.getConnection();
    connection2 = await pool2.getConnection();

    // Start transactions on both connections
    await connection.beginTransaction();
    await connection2.beginTransaction();

    try {
      // validate toAccountId exists in the accounts table (pool2)
      const [accountData] = await connection2.query(
        "SELECT * FROM accounting_accounts WHERE idAccounting_Accounts = ?",
        [toAccountId],
      );

      if (accountData.length === 0) {
        await connection.rollback();
        await connection2.rollback();
        connection.release();
        connection2.release();
        return next(errorHandler(400, "Invalid To Account ID"));
      }

      // check if the ticket exists and belongs to the branch (pool)
      const [existingTicket] = await connection.query(
        "SELECT Interest_apply_on,Maturity_date,Date_Time,Ticket_No,Status,Pawning_Product_idPawning_Product FROM pawning_ticket WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
        [ticketId, req.branchId],
      );

      if (existingTicket.length === 0) {
        await connection.rollback();
        await connection2.rollback();
        connection.release();
        connection2.release();
        return next(errorHandler(404, "No ticket found for the given ID"));
      }

      // check if ticket is already settled
      if (existingTicket[0].Status === "2") {
        await connection.rollback();
        await connection2.rollback();
        connection.release();
        connection2.release();
        return next(errorHandler(400, "Ticket is already settled"));
      }

      // get the latest ticket log entry for the ticket (pool)
      const [ticketLog] = await connection.query(
        "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
        [ticketId],
      );

      if (ticketLog.length === 0) {
        await connection.rollback();
        await connection2.rollback();
        connection.release();
        connection2.release();
        return next(
          errorHandler(500, "No ticket log found for the given ticket"),
        );
      }

      // get product data for early settlement charge calculation (pool)
      const [productData] = await connection.query(
        "SELECT Early_Settlement_Charge,Early_Settlement_Charge_Create_As,Early_Settlement_Charge_Value_type,Early_Settlement_Charge_Value,Interest_Method FROM pawning_product WHERE idPawning_Product = ?",
        [existingTicket[0].Pawning_Product_idPawning_Product],
      );

      // calculate early settlement charge
      let earlySettlementCharge = 0;
      if (productData[0]?.Early_Settlement_Charge === "1") {
        if (
          productData[0].Early_Settlement_Charge_Create_As ===
          "Charge For Product"
        ) {
          if (
            productData[0].Early_Settlement_Charge_Value_type === "Percentage"
          ) {
            earlySettlementCharge =
              (productData[0].Early_Settlement_Charge_Value / 100) *
              ticketLog[0].Advance_Balance;
          } else if (
            productData[0].Early_Settlement_Charge_Value_type === "Fixed Amount"
          ) {
            earlySettlementCharge =
              productData[0].Early_Settlement_Charge_Value;
          }
        }
      }

      // calculate total settlement amount required
      const totalBalanceRequired =
        (parseFloat(ticketLog[0].Interest_Balance) || 0) +
        (parseFloat(ticketLog[0].Service_Charge_Balance) || 0) +
        (parseFloat(ticketLog[0].Late_Charges_Balance) || 0) +
        (parseFloat(ticketLog[0].Aditional_Charge_Balance) || 0) +
        (parseFloat(ticketLog[0].Advance_Balance) || 0) +
        (parseFloat(earlySettlementCharge) || 0);

      // validate payment amount covers total settlement
      if (paymentAmount < totalBalanceRequired) {
        await connection.rollback();
        await connection2.rollback();
        connection.release();
        connection2.release();
        return next(
          errorHandler(
            400,
            `Settlement payment amount should be at least ${totalBalanceRequired.toFixed(
              2,
            )} to cover all balances and charges.`,
          ),
        );
      }

      // get the day count from today date to ticket Date_Time
      const today = new Date();
      const ticketDate = new Date(existingTicket[0].Date_Time);
      const timeDiff = Math.abs(today - ticketDate);
      const dayCount = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      // insert into the payment table (pool)
      const [ticketPaymentResult] = await connection.query(
        "INSERT INTO payment(Date_time,Description,Ticket_no,Amount,User,Ticket_Date,Maturity_Date,Day_Count,Type) VALUES(NOW(),?,?,?,?,?,?,?,?)",
        [
          `Customer Settlement Payment(Ticket No:${existingTicket[0].Ticket_No})`,
          existingTicket[0].Ticket_No,
          paymentAmount,
          req.userId,
          existingTicket[0].Date_Time,
          existingTicket[0].Maturity_date,
          dayCount,
          "SETTLEMENT PAYMENT",
        ],
      );

      if (ticketPaymentResult.affectedRows === 0) {
        throw errorHandler(500, "Failed to create settlement payment");
      }

      const createdTicketPaymentId = ticketPaymentResult.insertId;

      // calculate payment allocation
      let remainingPayment = paymentAmount;
      let {
        Interest_Balance,
        Service_Charge_Balance,
        Late_Charges_Balance,
        Aditional_Charge_Balance,
        Advance_Balance,
      } = ticketLog[0];

      let paidInterest = 0;
      let paidServiceCharge = 0;
      let paidLateCharges = 0;
      let paidAdditionalCharges = 0;
      let paidAdvance = 0;
      let paidEarlySettlement = 0;

      function safePay(balance, remaining) {
        balance = parseFloat(balance);
        balance = isNaN(balance) ? 0 : balance;
        let paid = 0;
        if (remaining > 0 && balance > 0) {
          paid = Math.min(remaining, balance);
          remaining -= paid;
          balance -= paid;
        }
        return { paid, balance, remaining };
      }

      // pay balances in settlement order
      let result = safePay(Aditional_Charge_Balance, remainingPayment);
      paidAdditionalCharges = result.paid;
      Aditional_Charge_Balance = result.balance;
      remainingPayment = result.remaining;

      result = safePay(Late_Charges_Balance, remainingPayment);
      paidLateCharges = result.paid;
      Late_Charges_Balance = result.balance;
      remainingPayment = result.remaining;

      result = safePay(Interest_Balance, remainingPayment);
      paidInterest = result.paid;
      Interest_Balance = result.balance;
      remainingPayment = result.remaining;

      result = safePay(Service_Charge_Balance, remainingPayment);
      paidServiceCharge = result.paid;
      Service_Charge_Balance = result.balance;
      remainingPayment = result.remaining;

      result = safePay(Advance_Balance, remainingPayment);
      paidAdvance = result.paid;
      Advance_Balance = result.balance;
      remainingPayment = result.remaining;

      result = safePay(earlySettlementCharge, remainingPayment);
      paidEarlySettlement = result.paid;
      remainingPayment = result.remaining;

      // insert settlement record into ticket log table (pool)
      const [logResult] = await connection.query(
        "INSERT INTO ticket_log(Pawning_Ticket_idPawning_Ticket,Date_Time,Type,Description,Amount,Interest_Balance,Service_Charge_Balance,Late_Charges_Balance,Aditional_Charge_Balance,Advance_Balance,Total_Balance,User_idUser,Type_Id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          ticketId,
          new Date(),
          "SETTLEMENT",
          `Settlement payment received. Payment ID: ${createdTicketPaymentId}`,
          paymentAmount,
          0,
          0,
          0,
          0,
          0,
          0,
          req.userId,
          createdTicketPaymentId,
        ],
      );

      if (logResult.affectedRows === 0) {
        throw errorHandler(500, "Failed to update ticket log");
      }

      // update payment table with breakdown (pool)
      const [updatePaymentResult] = await connection.query(
        "UPDATE payment SET Interest_Payment = ?, Service_Charge_Payment = ?, Late_Charges_Payment = ?, Other_Charges_Payment = ?, Advance_Payment = ? WHERE id = ?",
        [
          paidInterest || 0,
          paidServiceCharge || 0,
          paidLateCharges || 0,
          paidAdditionalCharges || 0,
          paidAdvance || 0,
          createdTicketPaymentId,
        ],
      );

      if (updatePaymentResult.affectedRows === 0) {
        throw errorHandler(500, "Failed to update payment details");
      }

      // update ticket status to settled (pool)
      const [updateTicketResult] = await connection.query(
        "UPDATE pawning_ticket SET Status = '2' WHERE idPawning_Ticket = ?",
        [ticketId],
      );

      if (updateTicketResult.affectedRows === 0) {
        throw errorHandler(500, "Failed to update ticket status");
      }

      // update the balance of the toAccountId (pool2)
      let currentBalance = parseFloat(accountData[0].Account_Balance) || 0;
      currentBalance += parseFloat(paymentAmount);

      const [updateAccountResult] = await connection2.query(
        "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ?",
        [currentBalance, toAccountId],
      );

      if (updateAccountResult.affectedRows === 0) {
        throw errorHandler(500, "Failed to update account balance");
      }

      // add a debit entry to accounting_accounts_log table (pool2)
      const [accountLogResult] = await connection2.query(
        "INSERT INTO accounting_accounts_log (Accounting_Accounts_idAccounting_Accounts,Date_Time,Type,Description,Debit,Credit,Balance,Contra_Account,User_idUser) VALUES (?,?,?,?,?,?,?,?,?)",
        [
          toAccountId,
          new Date(),
          "Ticket Settlement Payment",
          `Customer Settlement Payment (Ticket No: ${existingTicket[0].Ticket_No})`,
          paymentAmount,
          0,
          currentBalance,
          null,
          req.userId,
        ],
      );

      if (accountLogResult.affectedRows === 0) {
        throw errorHandler(500, "Failed to create account log");
      }

      // Commit both transactions
      await connection.commit();
      await connection2.commit();
      connection.release();
      connection2.release();

      res.status(201).json({
        success: true,
        message:
          "Settlement payment created successfully. Ticket has been settled.",
        paymentBreakdown: {
          totalPaid: paymentAmount,
          paidInterest,
          paidServiceCharge,
          paidLateCharges,
          paidAdditionalCharges,
          paidAdvance,
          paidEarlySettlement,
          excessAmount: remainingPayment,
        },
      });
    } catch (innerError) {
      await connection.rollback();
      await connection2.rollback();
      connection.release();
      connection2.release();
      console.error(
        "Error creating settlement payment for ticket:",
        innerError,
      );
      return next(errorHandler(500, "Internal Server Error"));
    }
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    if (connection2) {
      await connection2.rollback();
      connection2.release();
    }
    console.error("Error creating settlement payment for ticket:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// update pawning ticket note
export const updatePawningTicketNote = async (req, res, next) => {
  try {
    const ticketId = req.params.id || req.params.ticketId;
    const { note } = req.body;

    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }
    if (note === undefined || note === null) {
      return next(errorHandler(400, "Note content is required"));
    }

    const [result] = await pool.query(
      "UPDATE pawning_ticket SET Note = ? WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [note, ticketId, req.branchId],
    );

    if (result.affectedRows === 0) {
      return next(
        errorHandler(404, "No ticket found or note is the same as existing"),
      );
    }

    res.status(200).json({
      success: true,
      message: "Ticket note updated successfully",
    });
  } catch (error) {
    console.error("Error in updatePawningTicketNote:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// get tickets payment histories data for the branch
export const getTicketsPaymentsHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { start_date, end_date, branchId } = req.query;

    // Build base WHERE conditions
    let baseWhereConditions = "";
    let countParams = [];
    let dataParams = [];

    if (req.isHeadBranch) {
      console.log("Head Branch");
      if (branchId) {
        // Head branch viewing a specific branch
        baseWhereConditions = "pt.Branch_idBranch = ?";
        countParams.push(branchId);
        dataParams.push(branchId);
      } else {
        // Head branch viewing all company branches
        const branches = await getCompanyBranches(req.companyId);
        baseWhereConditions = "pt.Branch_idBranch IN (?)";
        countParams.push(branches);
        dataParams.push(branches);
      }
    } else {
      // Regular branch - only their own data
      baseWhereConditions = "pt.Branch_idBranch = ?";
      countParams.push(req.branchId);
      dataParams.push(req.branchId);
    }

    // Add date filter conditions dynamically
    if (start_date) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(start_date)) {
        return next(
          errorHandler(400, "Invalid start_date format. Use YYYY-MM-DD"),
        );
      }
      baseWhereConditions +=
        " AND DATE(STR_TO_DATE(p.Date_time, '%Y-%m-%d %H:%i:%s')) >= ?";
      countParams.push(start_date);
      dataParams.push(start_date);
    }

    if (end_date) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(end_date)) {
        return next(
          errorHandler(400, "Invalid end_date format. Use YYYY-MM-DD"),
        );
      }
      baseWhereConditions +=
        " AND DATE(STR_TO_DATE(p.Date_time, '%Y-%m-%d %H:%i:%s')) <= ?";
      countParams.push(end_date);
      dataParams.push(end_date);
    }

    // Validate date range if both dates are provided
    if (start_date && end_date) {
      if (new Date(start_date) > new Date(end_date)) {
        return next(errorHandler(400, "start_date cannot be after end_date"));
      }
    }

    // Build count query
    const countQuery = `SELECT COUNT(*) AS total 
                        FROM payment p
                        JOIN pawning_ticket pt ON p.Ticket_no COLLATE utf8mb4_unicode_ci = pt.Ticket_No COLLATE utf8mb4_unicode_ci
                        WHERE ${baseWhereConditions}`;

    const paginationData = await getPaginationData(
      countQuery,
      countParams,
      page,
      limit,
    );

    // Build main data query (without user JOIN - user is in pool2)
    // We fetch accountCenterCusId from pawning customer table to link with account center
    const dataQuery = `SELECT p.*, p.User AS User_idUser, pt.idPawning_Ticket, pt.Status AS Ticket_Status, 
                              pt.Customer_idCustomer,pt.Net_Weight, c.accountCenterCusId
                       FROM payment p
                       JOIN pawning_ticket pt ON p.Ticket_no COLLATE utf8mb4_unicode_ci = pt.Ticket_No COLLATE utf8mb4_unicode_ci
                       LEFT JOIN customer c ON pt.Customer_idCustomer = c.idCustomer
                       WHERE ${baseWhereConditions}
                       ORDER BY STR_TO_DATE(p.Date_time, '%Y-%m-%d %H:%i:%s') DESC
                       LIMIT ? OFFSET ?`;

    dataParams.push(limit, offset);

    const [payments] = await pool.query(dataQuery, dataParams);

    // Fetch customer details from account center
    if (payments.length > 0) {
      const accountCenterCusIds = [
        ...new Set(
          payments.map((p) => p.accountCenterCusId).filter((id) => id),
        ),
      ];

      let customerMap = {};
      if (accountCenterCusIds.length > 0) {
        // Schema: First_Name, Last_Name, Nic, Contact_No (No Full_Name)
        const [accCustomers] = await pool2.query(
          `SELECT idCustomer, Nic, First_Name, Last_Name, Contact_No FROM customer WHERE idCustomer IN (?)`,
          [accountCenterCusIds],
        );

        accCustomers.forEach((c) => {
          const firstName = c.First_Name || "";
          const lastName = c.Last_Name || "";
          const fullName =
            firstName && lastName
              ? `${firstName} ${lastName}`
              : firstName || lastName || "Unknown";

          customerMap[c.idCustomer] = {
            name: fullName,
            nic: c.Nic,
            mobile: c.Contact_No,
          };
        });
      }

      // Attach customer details to payments
      payments.forEach((payment) => {
        const cus = customerMap[payment.accountCenterCusId] || {};
        payment.customerName = cus.name || "Unknown";
        payment.customerNIC = cus.nic || null;
        payment.customerMobile = cus.mobile || null;

        // Cleanup internal fields
        delete payment.Customer_idCustomer;
        delete payment.accountCenterCusId;
      });
    }

    // Fetch officer names from pool2 for each payment
    for (let payment of payments) {
      if (payment.User_idUser) {
        const [userData] = await pool2.query(
          "SELECT full_name FROM user WHERE idUser = ?",
          [payment.User_idUser],
        );
        payment.officerName = userData[0]?.full_name || null;
      } else {
        payment.officerName = null;
      }
      delete payment.User_idUser; // Remove User_idUser from response
    }

    res.status(200).json({
      success: true,
      payments: payments || [],
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error fetching ticket payment history:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// req access for pawning ticket renew
export const reqAccessForTicketRenew = async (req, res, next) => {
  try {
    const ticketId = req.params.ticketId;

    const [ticketData] = await pool.query(
      "SELECT renewReqStatus FROM pawning_ticket WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [ticketId, req.branchId],
    );

    if (!ticketData || ticketData.length === 0) {
      return next(errorHandler(404, "Ticket not found"));
    }

    if (ticketData[0].renewReqStatus === 1) {
      return next(errorHandler(400, "Ticket renewal request already pending"));
    }

    if (ticketData[0].renewReqStatus === 2) {
      return next(errorHandler(400, "Ticket renewal request already approved"));
    }

    if (ticketData[0].renewReqStatus === 3) {
      return next(errorHandler(400, "Ticket renewal request already rejected"));
    }

    const [updateReqStatus] = await pool.query(
      "UPDATE pawning_ticket SET renewReqStatus = 1, renewal_req_created_at = NOW(), renewal_req_created_userId = ? WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [req.userId, ticketId, req.branchId],
    );

    if (!updateReqStatus || updateReqStatus.length === 0) {
      return next(errorHandler(404, "Ticket not found"));
    }

    res.status(200).json({
      success: true,
      message: "Ticket renewal request sent successfully",
    });
  } catch (error) {
    console.log("Error in request access for ticket renewal", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// send req of ticket renewal for approval
export const sendReqsOfTicketRenewalForApproval = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;
    const status = req.query.status || "";

    // Build WHERE conditions - only filter by status if provided, otherwise return all (1, 2, 3)
    let whereConditions = "Branch_idBranch = ? AND renewReqStatus IS NOT NULL";
    let params = [req.branchId];

    // Add status filter only if provided
    if (status) {
      whereConditions += " AND renewReqStatus = ?";
      params.push(parseInt(status));
    }

    // Add search filter for Ticket_No
    if (search) {
      whereConditions += " AND Ticket_No LIKE ?";
      params.push(`%${search}%`);
    }

    // Add date range filter for renewal_req_created_at
    if (dateFrom) {
      whereConditions += " AND DATE(renewal_req_created_at) >= ?";
      params.push(dateFrom);
    }

    if (dateTo) {
      whereConditions += " AND DATE(renewal_req_created_at) <= ?";
      params.push(dateTo);
    }

    const paginationData = await getPaginationData(
      `SELECT idPawning_Ticket FROM pawning_ticket WHERE ${whereConditions}`,
      params,
      page,
      limit,
    );

    let tickets;
    [tickets] = await pool.query(
      `SELECT idPawning_Ticket, Ticket_No, Date_Time, renewal_req_created_at, renewReqStatus, renewal_req_created_userId, renewal_req_approved_at, renewal_req_approved_by FROM pawning_ticket WHERE ${whereConditions} ORDER BY renewal_req_created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    for (const ticket of tickets) {
      // fetch user full_name who created renewal request
      if (ticket.renewal_req_created_userId) {
        const [creatorData] = await pool2.query(
          "SELECT full_name FROM user WHERE idUser = ?",
          [ticket.renewal_req_created_userId],
        );
        ticket.createdByUserName = creatorData[0]?.full_name || null;
      } else {
        ticket.createdByUserName = null;
      }

      // fetch user full_name who approved/rejected (if status is 2 or 3)
      if (
        (ticket.renewReqStatus === 2 || ticket.renewReqStatus === 3) &&
        ticket.renewal_req_approved_by
      ) {
        const [approverData] = await pool2.query(
          "SELECT full_name FROM user WHERE idUser = ?",
          [ticket.renewal_req_approved_by],
        );
        ticket.approvedByUserName = approverData[0]?.full_name || null;
      } else {
        ticket.approvedByUserName = null;
      }

      // Clean up internal IDs from response (optional - keep if you need them)
      delete ticket.renewal_req_created_userId;
      delete ticket.renewal_req_approved_by;
    }

    res.status(200).json({
      success: true,
      tickets: tickets || [],
      pagination: paginationData,
    });
  } catch (error) {
    console.log("Error in fetching ticket renewal requests", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// approve or reject req for ticket renewal
export const approveOrRejectReqForTicketRenewal = async (req, res, next) => {
  try {
    const ticketId = req.params.ticketId;
    const renewReqStatus = req.body.renewReqStatus;

    // Validate renewReqStatus is either 2 (approved) or 3 (rejected)
    if (![2, 3].includes(renewReqStatus)) {
      return next(
        errorHandler(
          400,
          "Invalid renew request status. Must be 2 (approve) or 3 (reject)",
        ),
      );
    }

    const [ticketData] = await pool.query(
      "SELECT renewReqStatus FROM pawning_ticket WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [ticketId, req.branchId],
    );

    if (!ticketData || ticketData.length === 0) {
      return next(errorHandler(404, "Ticket not found"));
    }

    if (ticketData[0].renewReqStatus !== 1) {
      return next(
        errorHandler(400, "Ticket renewal request is already processed"),
      );
    }

    const [updateReqStatus] = await pool.query(
      "UPDATE pawning_ticket SET renewReqStatus = ?, renewal_req_approved_by = ?, renewal_req_approved_at = NOW() WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [renewReqStatus, req.userId, ticketId, req.branchId],
    );

    if (!updateReqStatus || updateReqStatus.affectedRows === 0) {
      return next(errorHandler(404, "Failed to update ticket renewal request"));
    }

    const message =
      renewReqStatus === 2
        ? "Ticket renewal request approved successfully"
        : "Ticket renewal request rejected successfully";

    res.status(200).json({
      approvedStatus: renewReqStatus,
      success: true,
      message,
    });
  } catch (error) {
    console.log("Error in approve/reject ticket renewal request", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
