import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";
import { uploadImage } from "../utils/cloudinary.js";
import { createPawningTicketLogOnCreate } from "../utils/pawning.ticket.logs.js";
// Create Pawning Ticket
export const createPawningTicket = async (req, res, next) => {
  try {
    // net weight have to be equal or less than gross weight
    // pawning value have to equal or less than table value
    const { data } = req.body;
    console.log(data, "data in createPawningTicket");
    const requiredFields = [
      "ticketNo",
      "grantSeqNo",
      "grantDate",
      "productId",
      "customerId",
      "periodType",
      "period",
      "maturityDate",
      "grossWeight",
      "assessedValue",
      "netWeight",
      "payableValue",
      "pawningAdvance",
      "interestRate",
      "serviceCharge",
      "lateChargePercent",
      "interestApplyOn",
    ];
    const requiredFieldsForTicketArticles = [
      // data for pawning ticket article table
      "type",
      "category",
      "condition",
      "caratage",
      "noOfItems",
      "acidTestStatus",
      "grossWeight",
      "dmReading",
      "netWeight",
      "assessedValue",
      "declaredValue",
      //"image",
    ];

    // Check for missing required fields in the main data object
    for (const field of requiredFields) {
      if (
        data.ticketData[field] === undefined ||
        data.ticketData[field] === null
      ) {
        return next(errorHandler(400, `Missing required field: ${field}`));
      }
    }

    // Ensure at least one ticket article is provided
    if (data.ticketArticles && data.ticketArticles.length === 0) {
      return next(errorHandler(400, "At least one ticket article is required"));
    }

    // Check for missing required fields in each ticket article
    for (const article of data.ticketArticles) {
      for (const field of requiredFieldsForTicketArticles) {
        if (article[field] === undefined || article[field] === null) {
          return next(
            errorHandler(
              400,
              `Missing required field in ticket article: ${field}`
            )
          );
        }
      }
    }

    // Validate that productId exists in pawning_product table
    const [productExists] = await pool.query(
      "SELECT idPawning_Product FROM pawning_product WHERE idPawning_Product = ?",
      [data.ticketData.productId]
    );

    if (productExists.length === 0) {
      return next(
        errorHandler(
          400,
          `Invalid product ID: ${data.ticketData.productId}. Product does not exist.`
        )
      );
    }

    // Validate that customerId exists
    const [customerExists] = await pool.query(
      "SELECT idCustomer FROM customer WHERE idCustomer = ?",
      [data.ticketData.customerId]
    );

    if (customerExists.length === 0) {
      return next(
        errorHandler(
          400,
          `Invalid customer ID: ${data.ticketData.customerId}. Customer does not exist.`
        )
      );
    }

    // check if pawning advance is less than or equal to all ticketArticles's declaredValue
    const totalDeclaredValue = data.ticketArticles.reduce(
      (sum, article) => sum + parseFloat(article.declaredValue || 0),
      0
    );
    if (parseFloat(data.ticketData.pawningAdvance) > totalDeclaredValue) {
      return next(
        errorHandler(
          400,
          "Pawning advance cannot be greater than total declared value of articles"
        )
      );
    }

    // get the ticket's product service charge type
    const [productData] = await pool.query(
      "SELECT Service_Charge_Value_Type FROM pawning_product WHERE idPawning_Product = ?",
      [data.ticketData.productId]
    );

    // find the service charge rate
    let serviceChargeRate = 0;
    if (productData[0]?.Service_Charge_Value_Type === "Percentage") {
      serviceChargeRate =
        parseFloat(data.ticketData.pawningAdvance) *
        (parseFloat(data.ticketData.serviceCharge) / 100);
    }

    if (productData[0]?.Service_Charge_Value_Type === "Fixed Amount") {
      serviceChargeRate = parseFloat(data.ticketData.serviceCharge);
    }

    // Insert into pawning_ticket table
    const [result] = await pool.query(
      "INSERT INTO pawning_ticket (Ticket_No,SEQ_No,Date_Time,Customer_idCustomer,Period_Type,Period,Maturity_Date,Gross_Weight,Assessed_Value,Net_Weight,Payble_Value,Pawning_Advance_Amount,Interest_Rate,Service_charge_Amount,Late_charge_Presentage,Interest_apply_on,User_idUser,Branch_idBranch,Pawning_Product_idPawning_Product,Total_Amount,Service_Charge_Type,Service_Charge_Rate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        data.ticketData.ticketNo,
        data.ticketData.grantSeqNo,
        data.ticketData.grantDate,
        data.ticketData.customerId,
        data.ticketData.periodType,
        data.ticketData.period,
        data.ticketData.maturityDate,
        data.ticketData.grossWeight,
        data.ticketData.assessedValue,
        data.ticketData.netWeight,
        data.ticketData.payableValue,
        data.ticketData.pawningAdvance,
        data.ticketData.interestRate,
        data.ticketData.serviceCharge,
        data.ticketData.lateChargePercent,
        data.ticketData.interestApplyOn,
        req.userId,
        req.branchId, // Fixed: removed extra comma
        data.ticketData.productId,
        data.ticketData.pawningAdvance, // as total amount
        productData[0]?.Service_Charge_Value_Type || "unknown",
        serviceChargeRate, // service charge rate
      ]
    );

    const ticketId = result.insertId;

    // insert images into ticket_artical_images table
    if (data.images && data.images.length > 0) {
      try {
        for (const image of data.images) {
          const secure_url = await uploadImage(image);

          const imageUrl = secure_url || null;

          await pool.query(
            "INSERT INTO ticket_artical_images (File_Path, Pawning_Ticket_idPawning_Ticket) VALUES (?,?)",
            [imageUrl, ticketId]
          );
        }
      } catch (error) {
        throw error;
      }
    }

    // Insert into pawning_ticket_article table
    const ticketArticles = data.ticketArticles;
    for (const article of ticketArticles) {
      // Check net weight vs gross weight before processing
      if (parseFloat(article.netWeight) > parseFloat(article.grossWeight)) {
        return next(
          errorHandler(400, "Net weight cannot be greater than Gross weight")
        );
      }

      // upload article image if exists
      if (article.image) {
        try {
          const secure_url = await uploadImage(article.image);
          article.image = secure_url || null;
        } catch (error) {
          throw error;
        }
      }

      const [result] = await pool.query(
        "INSERT INTO ticket_articles (Article_type,Article_category,Article_Condition,Caratage,No_Of_Items,Gross_Weight,Acid_Test_Status,DM_Reading,Net_Weight,Assessed_Value,Declared_Value,Pawning_Ticket_idPawning_Ticket,Image_Path) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          article.type,
          article.category,
          article.condition,
          article.caratage,
          article.noOfItems,
          article.grossWeight,
          article.acidTestStatus,
          article.dmReading,
          article.netWeight,
          article.assessedValue,
          article.declaredValue,
          ticketId,
          article.image,
        ]
      );
    }

    let logMessage;
    const success = await createPawningTicketLogOnCreate(
      ticketId,
      "CREATE",
      req.userId,
      data.ticketData.pawningAdvance
    );

    if (!success) {
      logMessage = "failed to create log entry";
    }

    res.status(201).json({
      success: true,
      message: logMessage
        ? `Pawning ticket created successfully. but ${logMessage}`
        : "Pawning ticket created successfully.",
    });
  } catch (error) {
    console.error("Error in createPawningTicket:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Send Grand SEQ.No to frontend
export const getGrandSeqNo = async (req, res, next) => {
  try {
    const [result] = await pool.query(
      "SELECT COUNT(*) AS count FROM pawning_ticket WHERE DATE(Date_Time) = CURDATE()"
    );
    const count =
      result && result[0] && typeof result[0].count === "number"
        ? result[0].count
        : 0;
    res.status(200).json({
      success: true,
      grandSeqNo: count + 1,
    });
  } catch (error) {
    console.error("Error in getGrandSeqNo:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Send products and their interest methods to frontend
export const getProductsAndInterestMethod = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const paginationData = await getPaginationData(
      "SELECT COUNT(*) AS total FROM pawning_product WHERE Branch_idBranch = ?",
      [req.branchId],
      page,
      limit
    );

    const [products] = await pool.query(
      "SELECT idPawning_Product, Name, Interest_Method FROM pawning_product WHERE Branch_idBranch = ? ORDER BY idPawning_Product DESC LIMIT ? OFFSET ?",
      [req.branchId, limit, offset]
    );

    res.status(200).json({
      success: true,
      products,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error in getProductsAndInterestMethods:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Send period types of a specific pawning product's product plans to frontend
export const getProductPlanPeriods = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.params.branchId;
    if (!productId) {
      return next(errorHandler(400, "Product ID is required"));
    }
    const [rows] = await pool.query(
      "SELECT Period_Type FROM product_plan WHERE Pawning_Product_idPawning_Product = ?",
      [productId]
    );

    // Extract unique period types
    const periodTypeSet = new Set();
    for (const row of rows) {
      if (row.Period_Type) {
        periodTypeSet.add(row.Period_Type);
      }
    }
    const periodTypes = Array.from(periodTypeSet);

    res.status(200).json({
      success: true,
      periodTypes,
    });
  } catch (error) {
    console.error("Error in getPeriodTypes:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Send maximum and minium period data of a specific pawning product
export const getMaxMinPeriod = async (req, res, next) => {
  try {
    const { periodType, productId } = req.params;

    // Validate required parameters
    if (!periodType) {
      return next(errorHandler(400, "Period Type is required"));
    }

    if (!productId) {
      return next(errorHandler(400, "Product ID is required"));
    }

    // Get all records matching productId and periodType
    const [rows] = await pool.query(
      `SELECT Minimum_Period, Maximum_Period
       FROM product_plan 
       WHERE Pawning_Product_idPawning_Product = ? 
         AND Period_Type = ?`,
      [productId, periodType]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No period data found for the given product and period type",
      });
    }

    // Extract all periods and convert to numbers
    const allMinPeriods = rows.map((row) => Number(row.Minimum_Period));
    const allMaxPeriods = rows.map((row) => Number(row.Maximum_Period));

    // Get overall min and max
    const minPeriod = Math.min(...allMinPeriods);
    const maxPeriod = Math.max(...allMaxPeriods);

    res.status(200).json({
      success: true,
      minPeriod,
      maxPeriod,
    });
  } catch (error) {
    console.error("Error in getMaxMinPeriod:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
// search customer by NIC and return data
export const searchCustomerByNIC = async (req, res, next) => {
  try {
    const NIC = req.params.nic;
    if (!NIC) {
      return next(errorHandler(400, "NIC is required"));
    }

    const [customer] = await pool.query(
      "SELECT idCustomer,NIC, Full_name,Address1,Address2,Address3,Mobile_No,Status,Risk_Level FROM customer WHERE NIC = ?",
      [NIC]
    );

    res.status(200).json({
      success: true,
      customer: customer[0] || null,
    });
  } catch (error) {
    console.error("Error in searchCustomerByNIC:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Sending article types categories and article conditions are done from company controller

// Send caratage amount and selected product item data to frontend
export const sendCaratageAmountForSelectedProductItem = async (
  req,
  res,
  next
) => {
  try {
    const { productId, periodType, period, interestMethod, amount, caratage } =
      req.query;
    // Validate
    console.log(req.query, "req.query");
    if (!productId || !periodType || !interestMethod || !caratage) {
      return next(
        errorHandler(
          400,
          "productId, periodType, interestMethod  and caratage are all required"
        )
      );
    }

    // Fetch all product items for the product and period type
    const [productItems] = await pool.query(
      "SELECT idProduct_Plan, Amount_For_22_Caratage, Minimum_Period, Maximum_Period, Minimum_Amount, Maximum_Amount FROM product_plan WHERE Pawning_Product_idPawning_Product = ? AND Period_Type = ?",
      [productId, periodType]
    );

    let filteredItem = null;
    if (Number(interestMethod) === 0) {
      // All records have the same Amount_For_22_Caratage, use the first one
      if (!productItems.length) {
        return res.status(404).json({
          success: false,
          message: "No product plan found for the given criteria",
        });
      }
      const baseAmount = Number(productItems[0].Amount_For_22_Caratage);
      const caratNum = Number(caratage);
      if (isNaN(baseAmount) || isNaN(caratNum)) {
        return next(errorHandler(400, "Invalid caratage or base amount"));
      }
      const amount = parseFloat((baseAmount * (caratNum / 22)).toFixed(2));
      return res.status(200).json({
        success: true,
        caratage: caratNum,
        amount,
      });
    } else if (Number(interestMethod) === 1) {
      // Filter by period between min and max period
      const periodNum = Number(period);
      filteredItem = productItems.find((item) => {
        const min = Number(item.Minimum_Period);
        const max = Number(item.Maximum_Period);
        return periodNum >= min && periodNum <= max;
      });
      if (!filteredItem) {
        return res.status(404).json({
          success: false,
          message: "No matching product plan found for the given criteria",
        });
      }
      const caratages = [16, 17, 18, 19, 20, 21, 22, 23, 24];
      const baseAmount = Number(filteredItem.Amount_For_22_Caratage);
      const caratageData = caratages.map((carat) => ({
        carat,
        amount: parseFloat((baseAmount * (carat / 22)).toFixed(2)),
      }));
      const caratNum = Number(caratage);
      const found = caratageData.find((c) => c.carat === caratNum);
      if (!found) {
        return res.status(404).json({
          success: false,
          message: "Invalid caratage value. Must be between 16 and 24.",
        });
      }
      return res.status(200).json({
        success: true,
        productPlan: filteredItem,
        caratage: caratNum,
        amount: found.amount,
        caratageData,
      });
    } else {
      return next(errorHandler(400, "Invalid interest method"));
    }
  } catch (error) {
    console.error("Error in sendCaratageAmountForSelectedProductItem:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// send assessed values for each company
export const sendAssessedValues = async (req, res, next) => {
  try {
    const { caratage } = req.query;
    if (!caratage) {
      return next(errorHandler(400, "Caratage is required"));
    }
    const [assessedValue] = await pool.query(
      "SELECT Amount FROM  assessed_value WHERE Carat = ? AND Company_idCompany = ?",
      [caratage, req.companyId]
    );

    if (assessedValue.length === 0) {
      return next(
        errorHandler(404, "No assessed values found for the given caratage")
      );
    }

    res.status(200).json({
      success: true,
      assessedValue: assessedValue[0],
    });
  } catch (error) {
    console.error("Error in sendAssessedValues:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// send interest rate , service charge and late charge percentage for a specific ticket
export const getTicketGrantSummaryData = async (req, res, next) => {
  try {
    const { productId, periodType, period, pawningAdvance, interestMethod } =
      req.query;

    if (!productId || !periodType || !interestMethod || !pawningAdvance) {
      return next(
        errorHandler(
          400,
          "productId, periodType, interestMethod and pawningAdvance are all required"
        )
      );
    }

    let productPlans;
    let interestRate = 0;
    let serviceCharge = 0;
    let lateChargePrecentage = 0;
    let interestApplyOn = null;

    // Convert interestMethod to number for comparison
    const interestMethodNum = Number(interestMethod);

    if (interestMethodNum === 1) {
      // interest method is Interest for Period
      // get the matching product plans
      [productPlans] = await pool.query(
        "SELECT * FROM product_plan WHERE Pawning_Product_idPawning_Product = ? AND Period_Type = ?",
        [productId, periodType]
      );

      if (productPlans.length === 0) {
        return next(
          errorHandler(404, "No product plans found for the given criteria")
        );
      }

      // filter by period
      const periodNum = Number(period);
      const filteredPlan = productPlans.find((plan) => {
        const min = Number(plan.Minimum_Period);
        const max = Number(plan.Maximum_Period);
        return periodNum >= min && periodNum <= max;
      });

      if (!filteredPlan) {
        return next(errorHandler(404, "No matching product plan found"));
      }

      interestRate = Number(filteredPlan.Interest);
      serviceCharge = Number(filteredPlan.Service_Charge_Value);
      lateChargePrecentage = Number(filteredPlan.Late_Charge);

      // Fixed date calculation - add days to current date
      const currentDate = new Date();
      const daysToAdd = Number(filteredPlan.Interest_Calculate_After);
      interestApplyOn = new Date(
        currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000
      );
    } else if (interestMethodNum === 0) {
      [productPlans] = await pool.query(
        "SELECT * FROM product_plan WHERE Pawning_Product_idPawning_Product = ? AND Period_Type = ?",
        [productId, periodType]
      );

      if (productPlans.length === 0) {
        return next(
          errorHandler(404, "No product plans found for the given criteria")
        );
      }

      // have to filter by Minimum_Amount and Maximum_Amount
      const advanceNum = Number(pawningAdvance);
      const filteredPlan = productPlans.find((plan) => {
        const min = Number(plan.Minimum_Amount);
        const max = Number(plan.Maximum_Amount);
        return advanceNum >= min && advanceNum <= max;
      });

      if (!filteredPlan) {
        return next(errorHandler(404, "No matching product plan found"));
      }

      interestRate = Number(filteredPlan.Interest);
      serviceCharge = Number(filteredPlan.Service_Charge_Value);
      lateChargePrecentage = Number(filteredPlan.Late_Charge);

      // Fixed date calculation - add days to current date
      const currentDate = new Date();
      const daysToAdd = Number(filteredPlan.Interest_Calculate_After);
      interestApplyOn = new Date(
        currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000
      );
    } else {
      return next(errorHandler(400, "Invalid interestMethod. Must be 0 or 1"));
    }

    // Only return the date part as a string (YYYY-MM-DD) for interestApplyOn
    let interestApplyOnDate = null;
    if (interestApplyOn instanceof Date && !isNaN(interestApplyOn)) {
      interestApplyOnDate = interestApplyOn.toISOString().split("T")[0];
    }
    res.status(200).json({
      success: true,
      interestRate,
      serviceCharge,
      lateChargePrecentage,
      interestApplyOn: interestApplyOnDate,
    });
  } catch (error) {
    console.error("Error in getTicketFinancialDetails:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// get ticket data by id
export const getTicketDataById = async (req, res, next) => {
  try {
    const ticketId = req.params.id || req.params.ticketId;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }

    let ticketData;
    let customerData;
    let articleItems;

    [ticketData] = await pool.query(
      "SELECT * FROM pawning_ticket WHERE idPawning_Ticket = ? AND  Branch_idBranch = ?",
      [ticketId, req.branchId]
    );

    if (ticketData.length === 0) {
      return next(errorHandler(404, "No ticket found for the given ID"));
    }

    // fetch ticket images
    const [ticketImages] = await pool.query(
      "SELECT File_Path FROM ticket_artical_images WHERE Pawning_Ticket_idPawning_Ticket = ?",
      [ticketData[0].idPawning_Ticket]
    );

    // attach images to ticket data
    ticketData[0].images = ticketImages || [];

    delete ticketData[0].Branch_idBranch; // remove branch id from response

    // fetch the user name who created the ticket
    const [userData] = await pool.query(
      "SELECT full_name FROM user WHERE idUser = ?",
      [ticketData[0].User_idUser]
    );
    ticketData[0].createdUser = userData[0]?.full_name || "Unknown User";
    delete ticketData[0].User_idUser; // remove User_idUser from ticket data

    // get the product name for the ticket
    const [productData] = await pool.query(
      "SELECT Name FROM pawning_product WHERE idPawning_Product = ?",
      [ticketData[0].Pawning_Product_idPawning_Product]
    );

    ticketData[0].productName = productData[0].Name || "Unknown Product"; // attach product name to ticket data
    delete ticketData[0].Pawning_Product_idPawning_Product; // remove product id from response

    // fetch customer data for the ticket
    [customerData] = await pool.query(
      "SELECT idCustomer,NIC, Full_name,Address1,Address2,Address3,Mobile_No,Status,Risk_Level FROM customer WHERE idCustomer = ?",
      [ticketData[0].Customer_idCustomer]
    );

    if (customerData.length === 0) {
      return next(
        errorHandler(
          404,
          "No customer found for the ticket's customer ID: " +
            ticketData[0].Customer_idCustomer
        )
      );
    }

    // fetch ticket article items with JOINs for type and category names, casting VARCHAR keys
    [articleItems] = await pool.query(
      `SELECT ta.*, 
              at.Description AS ArticleTypeName, 
              ac.Description AS categoryName
         FROM ticket_articles ta
    LEFT JOIN article_types at ON CAST(ta.Article_type AS UNSIGNED) = at.idArticle_Types
    LEFT JOIN article_categories ac ON CAST(ta.Article_category AS UNSIGNED) = ac.idArticle_Categories
        WHERE ta.Pawning_Ticket_idPawning_Ticket = ?`,
      [ticketData[0].idPawning_Ticket]
    );

    if (articleItems.length === 0) {
      return next(errorHandler(404, "No article items found for the ticket"));
    }

    // Remove Article_type and Article_category from each item in the response
    for (let item of articleItems) {
      delete item.Article_type;
      delete item.Article_category;
    }

    res.status(200).json({
      success: true,
      ticketData: {
        ticketData: ticketData[0],
        customerData: customerData[0],
        articleItems,
      },
    });
  } catch (error) {
    console.error("Error in getTicketDataById:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// get ticket comments
export const getTicketComments = async (req, res, next) => {
  try {
    const ticketId = req.params.id || req.params.ticketId;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }

    const [comments] = await pool.query(
      `SELECT tc.*, u.Full_name
         FROM ticket_comment tc
    LEFT JOIN user u ON tc.User_idUser = u.idUser
        WHERE tc.Pawning_Ticket_idPawning_Ticket = ? 
       `,
      [ticketId]
    );

    res.status(200).json({
      success: true,
      comments: comments || [],
    });
  } catch (error) {
    console.error("Error in getTicketComments:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// create ticket comment
export const createTicketComment = async (req, res, next) => {
  try {
    const { comment, ticketId } = req.body;
    if (!comment) {
      return next(errorHandler(400, "Comment text is required"));
    }

    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }

    const [result] = await pool.query(
      "INSERT INTO ticket_comment (Comment, Pawning_Ticket_idPawning_Ticket, User_idUser,Date_Time) VALUES (?,?,?, NOW())",
      [comment, ticketId, req.userId]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to add comment"));
    }

    // return the created comment with user name and timestamp
    const [createdComment] = await pool.query(
      `SELECT tc.*, u.Full_name
         FROM ticket_comment tc
    LEFT JOIN user u ON tc.User_idUser = u.idUser
        WHERE tc.idTicket_Comment = ? 
       `,
      [result.insertId]
    );

    res.status(201).json({
      message: "Comment added successfully",
      success: true,
      comment: createdComment[0],
    });
  } catch (error) {
    console.error("Error in createTicketComment:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
