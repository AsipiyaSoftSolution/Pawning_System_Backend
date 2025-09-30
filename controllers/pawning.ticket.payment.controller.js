import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";
import { formatSearchPattern } from "../utils/helper.js";
import { createPawningTicketLogOnAdditionalCharge } from "../utils/pawning.ticket.logs.js";

// Search tickets by ticket number, customer NIC, or customer name with pagination
export const searchByTickerNumberCustomerNICOrName = async (req, res, next) => {
  try {
    const { searchTerm } = req.query;
    if (!searchTerm) {
      return next(errorHandler(400, "Search term is required"));
    }

    const searchPattern = formatSearchPattern(searchTerm); // Format the search term for SQL LIKE query

    const [result] = await pool.query(
      "SELECT pt.idPawning_Ticket, pt.Ticket_No, c.Full_name, c.NIC FROM pawning_ticket pt JOIN customer c on pt.Customer_idCustomer = c.idCustomer WHERE (pt.Ticket_No LIKE ? OR c.NIC LIKE ? OR c.First_Name LIKE ?) AND pt.Branch_idBranch = ? AND (pt.Status != '2' OR pt.Status IS NULL)",
      [searchPattern, searchPattern, searchPattern, req.branchId]
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

    // Fetch and attach the last comment for this ticket if exists
    const [lastCommentData] = await pool.query(
      `SELECT tc.*, u.Full_name
         FROM ticket_comment tc
    LEFT JOIN user u ON tc.User_idUser = u.idUser
        WHERE tc.Pawning_Ticket_idPawning_Ticket = ?
     ORDER BY tc.idTicket_Comment DESC
        LIMIT 1`,
      [ticketData[0].idPawning_Ticket]
    );

    ticketData[0].lastComment = lastCommentData[0] || null;

    // get the product name for the ticket
    const [productData] = await pool.query(
      "SELECT Name,Early_Settlement_Charge,Early_Settlement_Charge_Create_As,Early_Settlement_Charge_Value_type,Early_Settlement_Charge_Value,Interest_Method FROM pawning_product WHERE idPawning_Product = ?",
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
            ]
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
            ]
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
          ]
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

    let minimumRenewalAmount =
      safeParse(ticketCharges[0].Interest_Balance) +
      safeParse(ticketCharges[0].Service_Charge_Balance) +
      safeParse(ticketCharges[0].Late_Charges_Balance) +
      safeParse(ticketCharges[0].Additional_Charge_Balance);

    console.log("Minimum Renewal Amount:", minimumRenewalAmount);

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
        customerData: customerData[0],
        articleItems,
        ticketCharges: ticketCharges[0] || {},
        paymentHistory,
        earlySettlementCharge,
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
      limit
    );

    const [ticketAdditionalCharges] = await pool.query(
      `SELECT ac.*, u.full_name AS officerName
       FROM additional_charges ac
  LEFT JOIN user u ON ac.User_idUser = u.idUser
      WHERE ac.Pawning_Ticket_idPawning_Ticket = ?
   ORDER BY STR_TO_DATE(ac.Date_Time, '%Y-%m-%d %H:%i:%s') DESC
      LIMIT ? OFFSET ?`,
      [ticketId, limit, offset]
    );

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
      [description, amount, ticketId, note, req.userId]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create additional charge"));
    }

    // send the created additional charge data as response
    const [newCharge] = await pool.query(
      `SELECT ac.*, u.full_name AS officerName
       FROM additional_charges ac
  LEFT JOIN user u ON ac.User_idUser = u.idUser
      WHERE ac.idAdditional_Charges = ?`,
      [result.insertId]
    );

    // create a pawning ticket log entry for the additional charge
    await createPawningTicketLogOnAdditionalCharge(
      ticketId,
      "ADDITIONAL CHARGE",
      req.userId,
      amount
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
  try {
    const ticketId = req.params.id || req.params.ticketId;
    const { paymentAmount, toAccountId } = req.body;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }
    console.log("Payment Amount:", paymentAmount);
    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      return next(errorHandler(400, "Valid part payment amount is required"));
    }
    if (!toAccountId) {
      return next(errorHandler(400, "To Account ID is required"));
    }

    // validate toAccountId exists in the accounts table
    const [accountData] = await pool.query(
      "SELECT * FROM accounting_accounts WHERE idAccounting_Accounts = ?",
      [toAccountId]
    );

    if (accountData.length === 0) {
      return next(errorHandler(400, "Invalid To Account ID"));
    }

    // check if the ticket exists and belongs to the branch
    const [existingTicket] = await pool.query(
      "SELECT Interest_apply_on,Maturity_date,Date_Time,Ticket_No FROM pawning_ticket WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [ticketId, req.branchId]
    );
    if (existingTicket.length === 0) {
      return next(errorHandler(404, "No ticket found for the given ID"));
    }

    // get the lastest ticket log entry for the ticket
    const [ticketLog] = await pool.query(
      "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
      [ticketId]
    );

    if (ticketLog.length === 0) {
      return next(
        errorHandler(500, "No ticket log found for the given ticket")
      );
    }

    // first insert into the payment table (date_time,description,ticket_no,amount,user,ticket_date,maturity_date,day_count,type)

    // get the day count by from today date to ticket Date_Time
    const today = new Date();
    const ticketDate = new Date(existingTicket[0].Date_Time);
    const timeDiff = Math.abs(today - ticketDate);
    const dayCount = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    const [ticketPaymentResult] = await pool.query(
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
      ]
    );

    if (ticketPaymentResult.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create part payment"));
    }

    const createdTicketPaymentId = ticketPaymentResult.insertId; // get the created payment record to update payment amounts later

    // now we have to update the ticket log balances by reducing the part payment amount
    let remainingPayment = paymentAmount;
    let {
      Interest_Balance,
      Service_Charge_Balance,
      Late_Charges_Balance,
      Aditional_Charge_Balance,
      Advance_Balance,
    } = ticketLog[0];

    // to store in payment table
    let paidInterest = 0;
    let paidServiceCharge = 0;
    let paidLateCharges = 0;
    let paidAdditionalCharges = 0;
    let paidAdvance = 0;

    // pay the balances in order
    // first pay additonal charges.
    // penalty charges
    // interest charges
    // service charges
    // advance balance

    // Always pay as much as possible to each balance in order
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
    // now update the ticket log with new balances

    // insert the record into ticket log table
    const [logResult] = await pool.query(
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
      ]
    );

    if (logResult.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update ticket log"));
    }

    // insert into the payment table (paid_interest,paid_service_charge,paid_late_charges,paid_additional_charges,paid_advance)
    const [updatePaymentResult] = await pool.query(
      "UPDATE payment SET Interest_Payment = ?, Service_Charge_Payment = ?, Late_Charges_Payment = ?, Other_Charges_Payment = ?, Advance_Payment = ? WHERE id = ?",
      [
        paidInterest || 0,
        paidServiceCharge || 0,
        paidLateCharges || 0,
        paidAdditionalCharges || 0,
        paidAdvance || 0,
        createdTicketPaymentId,
      ]
    );

    if (updatePaymentResult.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update payment details"));
    }

    // update the balance of the toAccountId in the accounting_accounts table by increasing the balance
    let currentBalance = parseFloat(accountData[0].Account_Balance) || 0;

    currentBalance += parseFloat(paymentAmount); // increase the balance

    // update the account balance in acocunting_accounts table
    const [updateAccountResult] = await pool.query(
      "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ?",
      [currentBalance, toAccountId]
    );

    // add a debit entry to accounting_accounts_log table
    const [accountLogResult] = await pool.query(
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
      ]
    );
    res.status(201).json({
      success: true,
      message: "Part payment created successfully.",
    });
  } catch (error) {
    console.error("Error creating part payment for ticket:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// make a payment for ticket renewal
export const createTicketRenewalPayment = async (req, res, next) => {
  try {
    const ticketId = req.params.id || req.params.ticketId;
    const { paymentAmount } = req.body;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }
    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      return next(errorHandler(400, "Valid part payment amount is required"));
    }

    // check if the ticket exists and belongs to the branch
    const [existingTicket] = await pool.query(
      "SELECT Interest_apply_on,Maturity_date,Date_Time,Ticket_No FROM pawning_ticket WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [ticketId, req.branchId]
    );
    if (existingTicket.length === 0) {
      return next(errorHandler(404, "No ticket found for the given ID"));
    }

    // get the lastest ticket log entry for the ticket
    const [ticketLog] = await pool.query(
      "SELECT * FROM ticket_log WHERE Pawning_Ticket_idPawning_Ticket = ? ORDER BY idTicket_Log DESC LIMIT 1",
      [ticketId]
    );

    if (ticketLog.length === 0) {
      return next(
        errorHandler(500, "No ticket log found for the given ticket")
      );
    }

    // First check payment amount is equal or greater than the ticket's other charges sum
    const otherChargesTotal =
      (parseFloat(ticketLog[0].Interest_Balance) || 0) +
      (parseFloat(ticketLog[0].Service_Charge_Balance) || 0) +
      (parseFloat(ticketLog[0].Late_Charges_Balance) || 0) +
      (parseFloat(ticketLog[0].Aditional_Charge_Balance) || 0);

    if (paymentAmount < otherChargesTotal) {
      return next(
        errorHandler(
          400,
          `Payment amount should be at least ${otherChargesTotal} to cover all other charges.`
        )
      );
    }

    // update the ticket's maturity date to today
    const [updateMaturityResult] = await pool.query(
      "UPDATE pawning_ticket SET Maturity_date = ? WHERE idPawning_Ticket = ?",
      [new Date(), ticketId]
    );

    if (updateMaturityResult.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update ticket maturity date"));
    }

    // Insert into the payment table (date_time,description,ticket_no,amount,user,ticket_date,maturity_date,day_count,type)
    // maturity date should be today date

    // get the day count by from today date to ticket Date_Time
    const today = new Date();
    const ticketDate = new Date(existingTicket[0].Date_Time);
    const timeDiff = Math.abs(today - ticketDate);
    const dayCount = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    const [ticketPaymentResult] = await pool.query(
      "INSERT INTO payment(Date_time,Description,Ticket_no,Amount,User,Ticket_Date,Maturity_Date,Day_Count,Type) VALUES(NOW(),?,?,?,?,?,?,?,?)",
      [
        `Customer Payment(Ticket No:${existingTicket[0].Ticket_No})`,
        existingTicket[0].Ticket_No,
        paymentAmount,
        req.userId,
        existingTicket[0].Date_Time,
        new Date(), // maturity date is today
        dayCount,
        "RENEWAL PAYMENT",
      ]
    );

    if (ticketPaymentResult.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create part payment"));
    }

    const createdTicketPaymentId = ticketPaymentResult.insertId; // get the created payment record to update payment amounts later

    // now we have to update the ticket log balances by reducing the part payment amount
    let remainingPayment = paymentAmount;
    let {
      Interest_Balance,
      Service_Charge_Balance,
      Late_Charges_Balance,
      Aditional_Charge_Balance,
      Advance_Balance,
    } = ticketLog[0];

    // to store in payment table
    let paidInterest = 0;
    let paidServiceCharge = 0;
    let paidLateCharges = 0;
    let paidAdditionalCharges = 0;
    let paidAdvance = 0;

    // pay the balances in order
    // first pay additonal charges.
    // penalty charges
    // interest charges
    // service charges
    // advance balance

    // Always pay as much as possible to each balance in order
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
    // now update the ticket log with new balances

    // insert the record into ticket log table
    const [logResult] = await pool.query(
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
      ]
    );

    if (logResult.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update ticket log"));
    }

    // insert into the payment table (paid_interest,paid_service_charge,paid_late_charges,paid_additional_charges,paid_advance)
    const [updatePaymentResult] = await pool.query(
      "UPDATE payment SET Interest_Payment = ?, Service_Charge_Payment = ?, Late_Charges_Payment = ?, Other_Charges_Payment = ?, Advance_Payment = ? WHERE id = ?",
      [
        paidInterest || 0,
        paidServiceCharge || 0,
        paidLateCharges || 0,
        paidAdditionalCharges || 0,
        paidAdvance || 0,
        createdTicketPaymentId,
      ]
    );

    if (updatePaymentResult.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update payment details"));
    }

    res.status(201).json({
      success: true,
      message: "Renewal payment created successfully.",
    });
  } catch (error) {
    console.error("Error creating part payment for ticket:", error);
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
      [note, ticketId, req.branchId]
    );

    if (result.affectedRows === 0) {
      return next(
        errorHandler(404, "No ticket found or note is the same as existing")
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
