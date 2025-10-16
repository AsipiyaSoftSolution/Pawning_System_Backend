import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";
import { uploadImage } from "../utils/cloudinary.js";
import {
  createPawningTicketLogOnCreate,
  markServiceChargeInTicketLog,
  addTicketLogsByTicketId,
  createPawningTicketLogOnApprovalandLoanDisbursement,
} from "../utils/pawning.ticket.logs.js";
import { createCustomerLogOnCreateTicket } from "../utils/customer.logs.js";
import { formatSearchPattern } from "../utils/helper.js";
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
      "Interest_Rate_Duration",
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
      "advanceValue",
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

    // get the ticket's product service charge type and other data
    const [productData] = await pool.query(
      "SELECT Service_Charge_Create_As,Interest_Method,Service_Charge_Value,Service_Charge_Value_Type FROM pawning_product WHERE idPawning_Product = ?",
      [data.ticketData.productId]
    );

    if (!productData || productData.length === 0) {
      return next(
        errorHandler(400, "Product not found for the given product ID")
      );
    }

    // Cal the service charge rate
    let serviceChargeRate = 0;
    // if service charge create as is "Charge For Product"
    if (productData[0].Service_Charge_Create_As === "Charge For Product") {
      // Check if service charge is inactive
      if (productData[0]?.Service_Charge_Value_Type === "inactive") {
        serviceChargeRate = 0; // No service charge when inactive
      } else if (productData[0]?.Service_Charge_Value_Type === "Percentage") {
        serviceChargeRate =
          parseFloat(data.ticketData.pawningAdvance) *
          (parseFloat(
            productData[0]?.Service_Charge_Value ||
              data.ticketData.serviceCharge
          ) /
            100);
      } else if (productData[0]?.Service_Charge_Value_Type === "Fixed Amount") {
        serviceChargeRate = parseFloat(
          productData[0]?.Service_Charge_Value || data.ticketData.serviceCharge
        );
      }
    }

    let productPlanData;
    // if service charge create as is "Charge For Product Item"
    if (productData[0].Service_Charge_Create_As === "Charge For Product Item") {
      if (productData[0].Interest_Method === "Interest For Period") {
        [productPlanData] = await pool.query(
          "SELECT idProduct_Plan,Service_Charge_Value_type, Service_Charge_Value FROM product_plan WHERE Pawning_Product_idPawning_Product = ? AND Period_Type = ? AND ? BETWEEN CAST(Minimum_Period AS UNSIGNED) AND CAST(Maximum_Period AS UNSIGNED)",
          [
            data.ticketData.productId,
            data.ticketData.periodType,
            data.ticketData.period,
          ]
        );

        if (productPlanData.length === 0) {
          return next(
            errorHandler(
              400,
              "No matching product plan found for the given product ID, period type, and period"
            )
          );
        }

        if (productPlanData[0]?.Service_Charge_Value_type === "percentage") {
          serviceChargeRate =
            parseFloat(data.ticketData.pawningAdvance) *
            (parseFloat(productPlanData[0]?.Service_Charge_Value) / 100);
        }

        if (productPlanData[0]?.Service_Charge_Value_type === "fixed") {
          serviceChargeRate = parseFloat(
            productPlanData[0]?.Service_Charge_Value
          );
        }
      }

      if (productData[0].Interest_Method === "Interest For Pawning Amount") {
        [productPlanData] = await pool.query(
          "SELECT idProduct_Plan,Service_Charge_Value_type, Service_Charge_Value FROM product_plan WHERE Pawning_Product_idPawning_Product = ? AND ? BETWEEN CAST(Minimum_Amount AS UNSIGNED) AND CAST(Maximum_Amount AS UNSIGNED)",
          [data.ticketData.productId, data.ticketData.pawningAdvance]
        );

        if (productPlanData.length === 0) {
          return next(
            errorHandler(
              400,
              "No matching product plan found for the given product ID and pawning advance amount"
            )
          );
        }

        if (productPlanData[0]?.Service_Charge_Value_type === "percentage") {
          serviceChargeRate =
            parseFloat(data.ticketData.pawningAdvance) *
            (parseFloat(productPlanData[0]?.Service_Charge_Value) / 100);
        }

        if (productPlanData[0]?.Service_Charge_Value_type === "fixed") {
          serviceChargeRate = parseFloat(
            productPlanData[0]?.Service_Charge_Value
          );
        }
      }
    }

    // service charge type (to insert into pawning_ticket table)
    let serviceChargeType;
    if (productData[0].Service_Charge_Create_As === "Charge For Product") {
      serviceChargeType =
        productData[0]?.Service_Charge_Value_Type === "inactive"
          ? "inactive"
          : productData[0]?.Service_Charge_Value_Type || "unknown";
    }

    if (productData[0].Service_Charge_Create_As === "Charge For Product Item") {
      if (!productPlanData || productPlanData.length === 0) {
        return next(
          errorHandler(
            400,
            "No matching product plan found for the given interest method and parameters"
          )
        );
      }
      serviceChargeType =
        productPlanData[0]?.Service_Charge_Value_type || "unknown";
    }

    // Fetch product plan stages data only if productPlanData exists
    let productPlanStagesData = [];
    if (
      productPlanData &&
      productPlanData.length > 0 &&
      productPlanData[0]?.idProduct_Plan
    ) {
      const [stagesData] = await pool.query(
        "SELECT stage1StartDate,stage1EndDate,stage2StartDate,stage2EndDate,stage3StartDate,stage3EndDate,stage4StartDate,stage4EndDate,stage1Interest,stage2Interest,stage3Interest,stage4Interest,interestApplicableMethod FROM product_plan WHERE idProduct_Plan = ?",
        [productPlanData[0].idProduct_Plan]
      );
      productPlanStagesData = stagesData || [];
    }

    // Insert into pawning_ticket table
    const [result] = await pool.query(
      "INSERT INTO pawning_ticket (Ticket_No,SEQ_No,Date_Time,Customer_idCustomer,Period_Type,Period,Maturity_Date,Gross_Weight,Assessed_Value,Net_Weight,Payble_Value,Pawning_Advance_Amount,Interest_Rate,Service_charge_Amount,Late_charge_Presentage,Interest_apply_on,User_idUser,Branch_idBranch,Pawning_Product_idPawning_Product,Total_Amount,Service_Charge_Type,Service_Charge_Rate,Early_Settlement_Charge_Balance,Additiona_Charges_Balance,Service_Charge_Balance,Late_Charge_Balance,Interest_Amount_Balance,Balance_Amount,Interest_Rate_Duration,stage1StartDate,stage1EndDate,stage2StartDate,stage2EndDate,stage3StartDate,stage3EndDate,stage4StartDate,stage4EndDate,stage1Interest,stage2Interest,stage3Interest,stage4Interest) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
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
        serviceChargeRate, // service charge rate
        data.ticketData.lateChargePercent,
        data.ticketData.interestApplyOn,
        req.userId,
        req.branchId, // Fixed: removed extra comma
        data.ticketData.productId,
        data.ticketData.pawningAdvance, // as total amount
        serviceChargeType,
        data.ticketData.serviceCharge, // service charge rate
        0, // initial early settlement charge balance set to 0
        0, // initial additional charges balance set to 0
        0, // initial service charge balance set to 0
        0, // initial late charge balance set to 0
        0, // initial interest amount balance set to 0
        data.ticketData.pawningAdvance, // initial balance amount set to pawning advance
        data.ticketData.Interest_Rate_Duration,
        productPlanStagesData[0]?.stage1StartDate || null,
        productPlanStagesData[0]?.stage1EndDate || null,
        productPlanStagesData[0]?.stage2StartDate || null,
        productPlanStagesData[0]?.stage2EndDate || null,
        productPlanStagesData[0]?.stage3StartDate || null,
        productPlanStagesData[0]?.stage3EndDate || null,
        productPlanStagesData[0]?.stage4StartDate || null,
        productPlanStagesData[0]?.stage4EndDate || null,
        productPlanStagesData[0]?.stage1Interest || 0,
        productPlanStagesData[0]?.stage2Interest || 0,
        productPlanStagesData[0]?.stage3Interest || 0,
        productPlanStagesData[0]?.stage4Interest || 0,
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
    let noOfTicketArticles = ticketArticles.length;
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

      // Calculate proportional advance value for this article
      let ticketPawningAdvance = parseFloat(data.ticketData.pawningAdvance); // total pawning advance for the ticket
      let declaredValueForArticle = parseFloat(article.declaredValue); // declared value for this article
      let advancedValueForArticle = 0;
      if (
        totalDeclaredValue > 0 &&
        !isNaN(ticketPawningAdvance) &&
        !isNaN(declaredValueForArticle)
      ) {
        advancedValueForArticle = parseFloat(
          (
            (declaredValueForArticle / totalDeclaredValue) *
            ticketPawningAdvance
          ).toFixed(2)
        );
      }

      const [result] = await pool.query(
        "INSERT INTO ticket_articles (Article_type,Article_category,Article_Condition,Caratage,No_Of_Items,Gross_Weight,Acid_Test_Status,DM_Reading,Net_Weight,Assessed_Value,Declared_Value,Pawning_Ticket_idPawning_Ticket,Image_Path,Advanced_Value,Remark) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
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
          advancedValueForArticle,
          article.remark || null,
        ]
      );
    }

    // create initial log entry for ticket creation
    await createPawningTicketLogOnCreate(
      ticketId,
      "CREATE",
      req.userId,
      data.ticketData.pawningAdvance
    );

    // create service charge log entry
    await markServiceChargeInTicketLog(
      ticketId,
      "SERVICE CHARGE",
      req.userId,
      serviceChargeRate // service charge amount
    );

    // create customer log for ticket creation
    await createCustomerLogOnCreateTicket(
      "CREATE TICKET",
      `Created ticket No: ${data.ticketData.ticketNo}`,
      data.ticketData.customerId,
      req.userId
    );

    /*if (data.grantDate !== new Date().toISOString().split("T")[0]) {
      // If the grant date is not today, create logs for interest and penalty up to today
      // This happens when old tickets are created on current system
      await addTicketLogsByTicketId(ticketId);
    } */

    res.status(201).json({
      success: true,
      message: "Pawning ticket created successfully.",
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
    const formatedNIC = formatSearchPattern(NIC); // Format NIC for SQL LIKE query

    // Fetch customer data with their documents
    const [customers] = await pool.query(
      `SELECT 
        c.idCustomer, 
        c.NIC, 
        c.Full_name,
        c.Address1,
        c.Address2,
        c.Address3,
        c.Mobile_No,
        c.Status,
        c.Risk_Level,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'Document_Name', cd.Document_Name,
            'Path', cd.Path
          )
        ) as documents
      FROM customer c
      LEFT JOIN customer_documents cd ON c.idCustomer = cd.Customer_idCustomer
      WHERE c.NIC LIKE ? AND c.Branch_idBranch = ?
      GROUP BY c.idCustomer, c.NIC, c.Full_name, c.Address1, c.Address2, c.Address3, c.Mobile_No, c.Status, c.Risk_Level`,
      [formatedNIC, req.branchId]
    );

    // Parse the documents JSON for each customer
    if (customers && customers.length > 0) {
      customers.forEach((customer) => {
        // Check if documents is already an object/array or needs parsing
        if (typeof customer.documents === "string") {
          try {
            customer.documents = JSON.parse(customer.documents);
          } catch (e) {
            customer.documents = [];
          }
        } else if (!customer.documents) {
          customer.documents = [];
        }

        // Filter out null documents (when LEFT JOIN returns no matches)
        if (Array.isArray(customer.documents)) {
          customer.documents = customer.documents.filter(
            (doc) => doc && doc.Document_Name !== null
          );
        } else {
          customer.documents = [];
        }
      });
    }

    res.status(200).json({
      success: true,
      customer: customers || null,
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
      "SELECT idProduct_Plan, Amount_For_22_Caratage, Minimum_Period, Maximum_Period, Minimum_Amount, Maximum_Amount,Week_Precentage_Amount_22_Caratage,Month1_Precentage_Amount_22_Caratage,Month3_Precentage_Amount_22_Caratage,Month6_Precentage_Amount_22_Caratage,Month9_Precentage_Amount_22_Caratage,Month12_Precentage_Amount_22_Caratage FROM product_plan WHERE Pawning_Product_idPawning_Product = ? ",
      [productId]
    );

    let filteredItem = null;
    let caratAmountPrecentage = 0;
    if (Number(interestMethod) === 0) {
      // for interest method Interest for Pawning Amount
      // All records have the same Amount_For_22_Caratage, use the first one
      if (!productItems.length) {
        return res.status(404).json({
          success: false,
          message: "No product plan found for the given criteria",
        });
      }

      // if the period type is days , weeks , months or years have to get the caratage precentage amount based on period
      if (periodType === "days") {
        // period is in days
        if (Number(period) <= 7) {
          caratAmountPrecentage = Number(
            productItems[0].Week_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 7 && Number(period) <= 30) {
          caratAmountPrecentage = Number(
            productItems[0].Month1_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 30 && Number(period) <= 90) {
          caratAmountPrecentage = Number(
            productItems[0].Month3_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 90 && Number(period) <= 180) {
          caratAmountPrecentage = Number(
            productItems[0].Month6_Precentage_Amount_22_Caratage
          );
        }
        if (Number(period) > 180 && Number(period) <= 270) {
          caratAmountPrecentage = Number(
            productItems[0].Month9_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 270 && Number(period) <= 365) {
          caratAmountPrecentage = Number(
            productItems[0].Month12_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 365) {
          caratAmountPrecentage = 100; // assign 100% if more than a year
        }
      }

      if (periodType === "weeks") {
        // period is in weeks
        if (Number(period) === 1) {
          caratAmountPrecentage = Number(
            productItems[0].Week_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 1 && Number(period) <= 4) {
          caratAmountPrecentage = Number(
            productItems[0].Month1_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 4 && Number(period) <= 13) {
          caratAmountPrecentage = Number(
            productItems[0].Month3_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 13 && Number(period) <= 26) {
          caratAmountPrecentage = Number(
            productItems[0].Month6_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 26 && Number(period) <= 39) {
          caratAmountPrecentage = Number(
            productItems[0].Month9_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 39 && Number(period) <= 52) {
          caratAmountPrecentage = Number(
            productItems[0].Month12_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 52) {
          caratAmountPrecentage = 100; // assign 100% if more than a year
        }
      }

      if (periodType === "months") {
        if (Number(period) === 1) {
          caratAmountPrecentage = Number(
            productItems[0].Month1_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 1 && Number(period) <= 3) {
          caratAmountPrecentage = Number(
            productItems[0].Month3_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 3 && Number(period) <= 6) {
          caratAmountPrecentage = Number(
            productItems[0].Month6_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 6 && Number(period) <= 9) {
          caratAmountPrecentage = Number(
            productItems[0].Month9_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 9 && Number(period) <= 12) {
          caratAmountPrecentage = Number(
            productItems[0].Month12_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 12) {
          caratAmountPrecentage = 100; // assign 100% if more than a year
        }
      }

      if (periodType === "years") {
        // period is in years
        if (Number(period) === 1) {
          caratAmountPrecentage = Number(
            productItems[0].Month12_Precentage_Amount_22_Caratage
          );
        }

        if (Number(period) > 1) {
          caratAmountPrecentage = 100; // assign 100% if more than a year
        }
      }

      const baseAmount = Number(productItems[0].Amount_For_22_Caratage); // base amount for 22 caratage
      const caratNum = Number(caratage); // selected caratage
      if (isNaN(baseAmount) || isNaN(caratNum)) {
        return next(errorHandler(400, "Invalid caratage or base amount"));
      }
      const amountForSelectedCaratage = parseFloat(
        (baseAmount * (caratNum / 22)).toFixed(2)
      ); // amount for selected caratage

      let amount = parseFloat(
        amountForSelectedCaratage * (caratAmountPrecentage / 100)
      ); // calculated amount based on caratage precentage

      // Round amount to nearest 1000
      amount = Math.ceil(amount / 1000) * 1000;

      const perPoundAmount = parseFloat(amount / 8).toFixed(2); // calculated amount per pound

      return res.status(200).json({
        success: true,
        caratage: caratNum,
        amount: perPoundAmount,
      });
    } else if (Number(interestMethod) === 1) {
      // for interest method Interest for Period
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
    let interestType;
    let serviceChargeType;

    // Convert interestMethod to number for comparison
    const interestMethodNum = Number(interestMethod);

    if (interestMethodNum === 1) {
      // interest method is Interest for Period
      // get the matching product plans
      [productPlans] = await pool.query(
        "SELECT * FROM product_plan WHERE Pawning_Product_idPawning_Product = ? ",
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

      console.log(filteredPlan, "filteredPlan");

      if (!filteredPlan) {
        return next(errorHandler(404, "No matching product plan found"));
      }

      if (filteredPlan.interestApplicableMethod === "calculate for stages ") {
        interestRate = parseFloat(filteredPlan.stage4Interest) || 0;
      } else {
        interestRate = parseFloat(filteredPlan.Interest) || 0;
      }
      serviceCharge = parseFloat(filteredPlan.Service_Charge_Value);
      lateChargePrecentage = parseFloat(filteredPlan.Late_Charge);
      interestType = filteredPlan.Interest_type || "N/A";
      serviceChargeType = filteredPlan.Service_Charge_Value_type || "N/A";

      console.log("Interest rate:", interestRate);

      // Fixed date calculation - add days to current date
      const currentDate = new Date();
      const daysToAdd = Number(filteredPlan.Interest_Calculate_After);
      interestApplyOn = new Date(
        currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000
      );
    } else if (interestMethodNum === 0) {
      [productPlans] = await pool.query(
        "SELECT * FROM product_plan WHERE Pawning_Product_idPawning_Product = ? ",
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
      console.log(filteredPlan, "filteredPlan");

      if (!filteredPlan) {
        return next(errorHandler(404, "No matching product plan found"));
      }
      if (filteredPlan.interestApplicableMethod === "calculate for stages ") {
        interestRate = Number(filteredPlan.stage4Interest) || 0;
      } else {
        interestRate = Number(filteredPlan.Interest) || 0;
      }
      serviceCharge = Number(filteredPlan.Service_Charge_Value);
      lateChargePrecentage = Number(filteredPlan.Late_Charge);
      interestType = filteredPlan.Interest_type || "N/A";
      console.log("Interest rate:", interestRate);
      serviceChargeType = filteredPlan.Service_Charge_Value_type || "N/A";

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
      interestType,
      serviceChargeType,
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
    let balanceLogs;
    let paymentHistory;
    let ticketLogs;

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

    // fetch the latest record of balance data from ticket logs
    [balanceLogs] = await pool.query(
      `SELECT  Advance_Balance,Interest_Balance,Aditional_Charge_Balance,Late_Charges_Balance,Total_Balance,Service_Charge_Balance
         FROM ticket_log
        WHERE Pawning_Ticket_idPawning_Ticket = ?
     ORDER BY idTicket_Log DESC
        LIMIT 1`,
      [ticketData[0].idPawning_Ticket]
    );

    if (!balanceLogs || balanceLogs.length === 0) {
      return next(errorHandler(404, "No balance log found for the ticket"));
    }

    // fetch payment history for the ticket
    [paymentHistory] = await pool.query(
      "SELECT p.Date_Time, p.Type, p.Amount, p.Description, u.full_name FROM payment p LEFT JOIN user u ON p.User = u.idUser WHERE p.Ticket_no = ? ORDER BY STR_TO_DATE(p.Date_Time, '%Y-%m-%d %H:%i:%s') DESC",
      [String(ticketData[0].Ticket_No)]
    );

    // fetch ticket logs for the ticket
    [ticketLogs] = await pool.query(
      `SELECT tl.*, u.full_name 
         FROM ticket_log tl
    LEFT JOIN user u ON tl.User_idUser = u.idUser
        WHERE tl.Pawning_Ticket_idPawning_Ticket = ? 
     ORDER BY tl.idTicket_Log ASC`,
      [ticketData[0].idPawning_Ticket]
    );

    res.status(200).json({
      success: true,
      ticketData: {
        ticketData: ticketData[0],
        customerData: customerData[0],
        articleItems,
        balanceData: balanceLogs[0],
        paymentHistory: paymentHistory || [],
        ticketLogs: ticketLogs || [],
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

// send pawning tickets for ticket approval
export const getPawningTicketsForApproval = async (req, res, next) => {
  try {
    const { product, date, nic } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build base WHERE conditions for both count and data queries
    let baseWhereConditions =
      "pt.Branch_idBranch = ? AND (pt.Status IS NULL OR pt.Status = '0')";
    let countParams = [req.branchId];
    let dataParams = [req.branchId];

    // Add filter conditions dynamically
    if (product) {
      // Sanitize product name for LIKE query
      const sanitizedProduct = `%${product.replace(/[%_\\]/g, "\\$&")}%`;
      baseWhereConditions += " AND pp.Name LIKE ?";
      countParams.push(sanitizedProduct);
      dataParams.push(sanitizedProduct);
    }

    if (date) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return next(errorHandler(400, "Invalid date format. Use YYYY-MM-DD"));
      }
      baseWhereConditions +=
        " AND DATE(STR_TO_DATE(pt.Date_Time, '%Y-%m-%d %H:%i:%s')) = ?";
      countParams.push(date);
      dataParams.push(date);
    }

    if (nic) {
      // Sanitize and format NIC for SQL LIKE query
      const sanitizedNIC = nic.replace(/[^a-zA-Z0-9]/g, ""); // Remove special characters

      const formattedNIC = formatSearchPattern(sanitizedNIC);
      baseWhereConditions += " AND c.NIC LIKE ?";
      countParams.push(formattedNIC);
      dataParams.push(formattedNIC);
    }

    // Build count query with same conditions as main query
    const countQuery = `SELECT COUNT(*) AS total
                        FROM pawning_ticket pt
                 LEFT JOIN customer c ON pt.Customer_idCustomer = c.idCustomer
                 LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product 
                       WHERE ${baseWhereConditions}`;

    const paginationData = await getPaginationData(
      countQuery,
      countParams,
      page,
      limit
    );

    // Build main data query - fetch ticket data with customer NIC and product name
    let query = `SELECT pt.idPawning_Ticket, pt.Ticket_No, pt.Date_Time, pt.Maturity_Date, pt.Pawning_Advance_Amount, pt.Status, c.NIC, pp.Name AS ProductName
                 FROM pawning_ticket pt
          LEFT JOIN customer c ON pt.Customer_idCustomer = c.idCustomer
          LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product
                WHERE ${baseWhereConditions}
             ORDER BY pt.idPawning_Ticket DESC LIMIT ? OFFSET ?`;

    dataParams.push(limit, offset);

    const [tickets] = await pool.query(query, dataParams);
    console.log(tickets, "tickets for approval");

    res.status(200).json({
      success: true,
      tickets: tickets || [],
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error in getPawningTicketsForApproval:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// ticket approve (state to -1 approved before loan disbursement)
export const approvePawningTicket = async (req, res, next) => {
  try {
    const ticketId = req.params.id || req.params.ticketId;
    const { note } = req.body;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }

    if (note && note.length > 500) {
      return next(errorHandler(400, "Note cannot exceed 500 characters"));
    }

    if (note) {
      const sanitizedNote = note.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // basic sanitization
      req.body.note = sanitizedNote;
    }

    // Check if the ticket exists and is pending approval
    const [existingTicketRow] = await pool.query(
      "SELECT Status,idPawning_Ticket FROM pawning_ticket WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [ticketId, req.branchId]
    );

    if (existingTicketRow.length === 0) {
      return next(errorHandler(404, "No ticket found for the given ID"));
    }

    // Check if ticket is already approved or in different status
    const currentStatus = existingTicketRow[0].Status;
    if (currentStatus !== null && currentStatus !== "0") {
      return next(
        errorHandler(400, "Only tickets with pending status can be approved")
      );
    }

    const ticketIdToUpdate = existingTicketRow[0].idPawning_Ticket;

    // Update the ticket status to approved (-1)
    const [result] = await pool.query(
      "UPDATE pawning_ticket SET Status = '-1' WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [ticketIdToUpdate, req.branchId]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to approve the ticket"));
    }

    // insert a record to ticket_has_approval table
    const [approvalResult] = await pool.query(
      "INSERT INTO ticket_has_approval (Pawning_Ticket_idPawning_Ticket, User, Date_Time, Note, Type) VALUES (?, ?, NOW(), ?, ?)",
      [ticketIdToUpdate, req.userId, req.body.note || null, "APPROVE"]
    );

    if (approvalResult.affectedRows === 0) {
      return next(
        errorHandler(500, "Failed to record the ticket approval action")
      );
    }

    // create a log in ticket log for approval action
    await createPawningTicketLogOnApprovalandLoanDisbursement(
      ticketIdToUpdate,
      approvalResult.insertId,
      "APPROVE-TICKET",
      req.body.note || "Ticket approved",
      req.userId
    );

    res.status(200).json({
      success: true,
      ticketId: ticketIdToUpdate,
      message: "Pawning ticket approved successfully.",
    });
  } catch (error) {
    console.error("Error in approvePawningTicket:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// reject pawning ticket (set state to 4 rejected)
export const rejectPawningTicket = async (req, res, next) => {
  try {
    const ticketId = req.params.id || req.params.ticketId;
    const { note } = req.body;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }
    if (!note) {
      return next(errorHandler(400, "Rejection note is required"));
    }

    if (note.length > 500) {
      return next(errorHandler(400, "Note cannot exceed 500 characters"));
    }

    if (note) {
      const sanitizedNote = note.replace(/</g, "&lt;").replace(/>/g, "&gt;"); // basic sanitization
      req.body.note = sanitizedNote;
    }

    // Check if the ticket exists and is pending approval
    const [existingTicketRow] = await pool.query(
      "SELECT Status,idPawning_Ticket FROM pawning_ticket WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [ticketId, req.branchId]
    );

    if (existingTicketRow.length === 0) {
      return next(errorHandler(404, "No ticket found for the given ID"));
    }

    // Check if ticket is already approved or in different status
    const currentStatus = existingTicketRow[0].Status;
    if (currentStatus !== null && currentStatus !== "0") {
      return next(
        errorHandler(400, "Only tickets with pending status can be rejected")
      );
    }

    const ticketIdToUpdate = existingTicketRow[0].idPawning_Ticket;
    // Update the ticket status to rejected (4)
    const [result] = await pool.query(
      "UPDATE pawning_ticket SET Status = '4' WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [ticketIdToUpdate, req.branchId]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to reject the ticket"));
    }

    // insert a record to ticket_has_approval table
    const [approvalResult] = await pool.query(
      "INSERT INTO ticket_has_approval (Pawning_Ticket_idPawning_Ticket, User, Date_Time, Note, Type) VALUES (?, ?, NOW(), ?, ?)",
      [ticketIdToUpdate, req.userId, req.body.note, "REJECT"]
    );

    if (approvalResult.affectedRows === 0) {
      return next(
        errorHandler(500, "Failed to record the ticket rejection action")
      );
    }

    res.status(200).json({
      success: true,
      ticketId: ticketIdToUpdate,
      message: "Pawning ticket rejected successfully.",
    });
  } catch (error) {
    console.error("Error in rejectPawningTicket:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// get approved (-1) pawning tickets for loan disbursement
export const getApprovedPawningTickets = async (req, res, next) => {
  try {
    const { product, start_date, end_date, nic } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build base WHERE conditions for both count and data queries
    let baseWhereConditions = "pt.Branch_idBranch = ? AND pt.Status = '-1'";
    let countParams = [req.branchId];
    let dataParams = [req.branchId];

    // Add filter conditions dynamically
    if (product) {
      // Sanitize product name for LIKE query
      const sanitizedProduct = `%${product.replace(/[%_\\]/g, "\\$&")}%`;
      baseWhereConditions += " AND pp.Name LIKE ?";
      countParams.push(sanitizedProduct);
      dataParams.push(sanitizedProduct);
    }

    if (start_date) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(start_date)) {
        return next(
          errorHandler(400, "Invalid start_date format. Use YYYY-MM-DD")
        );
      }
      baseWhereConditions +=
        " AND DATE(STR_TO_DATE(pt.Date_Time, '%Y-%m-%d %H:%i:%s')) >= ?";
      countParams.push(start_date);
      dataParams.push(start_date);
    }

    if (end_date) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(end_date)) {
        return next(
          errorHandler(400, "Invalid end_date format. Use YYYY-MM-DD")
        );
      }
      baseWhereConditions +=
        " AND DATE(STR_TO_DATE(pt.Date_Time, '%Y-%m-%d %H:%i:%s')) <= ?";
      countParams.push(end_date);
      dataParams.push(end_date);
    }

    // Validate date range if both dates are provided
    if (start_date && end_date) {
      if (new Date(start_date) > new Date(end_date)) {
        return next(errorHandler(400, "start_date cannot be after end_date"));
      }
    }

    if (nic) {
      // Sanitize and format NIC for SQL LIKE query
      const sanitizedNIC = nic.replace(/[^a-zA-Z0-9]/g, ""); // Remove special characters

      const formattedNIC = formatSearchPattern(sanitizedNIC);
      baseWhereConditions += " AND c.NIC LIKE ?";
      countParams.push(formattedNIC);
      dataParams.push(formattedNIC);
    }

    // Build count query with same conditions as main query
    const countQuery = `SELECT COUNT(*) AS total
                        FROM pawning_ticket pt
                 LEFT JOIN customer c ON pt.Customer_idCustomer = c.idCustomer
                 LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product 
                       WHERE ${baseWhereConditions}`;
    const paginationData = await getPaginationData(
      countQuery,
      countParams,
      page,
      limit
    );

    // Build main data query - fetch ticket data with customer NIC and product name
    let query = `SELECT pt.idPawning_Ticket, pt.Ticket_No, pt.Date_Time, pt.Maturity_Date, pt.Pawning_Advance_Amount, pt.Status, c.Full_name, c.NIC, c.Mobile_No, pp.Name AS ProductName
                  FROM pawning_ticket pt
            LEFT JOIN customer c ON pt.Customer_idCustomer = c.idCustomer
            LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product
                  WHERE ${baseWhereConditions}
               ORDER BY pt.idPawning_Ticket DESC LIMIT ? OFFSET ?`;
    dataParams.push(limit, offset);

    const [tickets] = await pool.query(query, dataParams);
    console.log(tickets, "approved tickets for loan disbursement");
    res.status(200).json({
      success: true,
      tickets: tickets || [],
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error in getApprovedPawningTickets:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// make approved ticket as active once we disburse the loan
export const activatePawningTicket = async (req, res, next) => {
  let connection;
  try {
    const ticketId = req.params.id || req.params.ticketId;
    const { fromAccountId, amount } = req.body;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }

    if (!fromAccountId) {
      return next(errorHandler(400, "From Account ID is required"));
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return next(errorHandler(400, "A valid disbursement amount is required"));
    }

    // check if there is a valid from account
    const [fromAccount] = await pool.query(
      "SELECT idAccounting_Accounts, Account_Type, Account_Balance, Cashier_idCashier, Branch_idBranch FROM accounting_accounts WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?",
      [fromAccountId, req.branchId]
    );

    if (fromAccount.length === 0) {
      return next(errorHandler(404, "From Account not found"));
    }

    // Check if the ticket exists and is approved
    const [existingTicketRow] = await pool.query(
      "SELECT Status,idPawning_Ticket,Pawning_Advance_Amount FROM pawning_ticket WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [ticketId, req.branchId]
    );

    if (existingTicketRow.length === 0) {
      return next(errorHandler(404, "No ticket found for the given ID"));
    }

    // Check if ticket is already active or in different status
    const currentStatus = existingTicketRow[0].Status;
    if (currentStatus !== "-1") {
      return next(
        errorHandler(400, "Only tickets with approved status can be activated")
      );
    }

    const ticketIdToUpdate = existingTicketRow[0].idPawning_Ticket;

    // check if the disbursement amount is not more than the approved advance amount
    if (amount > parseFloat(existingTicketRow[0].Pawning_Advance_Amount)) {
      return next(
        errorHandler(
          400,
          "Disbursement amount cannot be more than the approved advance amount"
        )
      );
    }

    // check if the account has sufficient balance
    if (amount > parseFloat(fromAccount[0].Account_Balance)) {
      return next(
        errorHandler(400, "Insufficient balance in the selected account")
      );
    }

    // begin transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // check if from Account is either cashier account or not
    if (fromAccount[0].Account_Type === "Cashier") {
      // check if this user is assigned to this cashier account
      if (
        fromAccount[0].Cashier_idCashier !== req.userId ||
        fromAccount[0].Branch_idBranch !== req.branchId
      ) {
        await connection.rollback();
        connection.release();
        return next(
          errorHandler(
            403,
            "You are not authorized to use this cashier account"
          )
        );
      }

      // Update the ticket status to active (1)
      const [result] = await connection.query(
        "UPDATE pawning_ticket SET Status = '1' WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
        [ticketIdToUpdate, req.branchId]
      );

      const balanceAfterDisbursement = parseFloat(
        fromAccount[0].Account_Balance - amount
      );

      // deduct the amount from the cashier account balance
      const [updateAccountResult] = await connection.query(
        "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ? AND Branch_idBranch = ? AND Cashier_idCashier = ?",
        [balanceAfterDisbursement, fromAccountId, req.branchId, req.userId]
      );

      if (result.affectedRows === 0 || updateAccountResult.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return next(errorHandler(500, "Failed to activate the ticket"));
      }

      // insert a credit log to accounting accounting logs
      const [accountingLogResult] = await connection.query(
        "INSERT INTO accounting_accounts_log (Accounting_Accounts_idAccounting_Accounts, Date_Time, Type, Description, Debit, Credit, Balance, Contra_Account, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          fromAccountId,
          new Date(),
          "Ticket Loan Disbursement",
          `Loan disbursement for ticket #${ticketIdToUpdate}`,
          0,
          amount,
          balanceAfterDisbursement,
          null,
          req.userId,
        ]
      );
    } else {
      // check if the specific branch has the permission to use non-cashier accounts for disbursements
      if (fromAccount[0].Branch_idBranch !== req.branchId) {
        await connection.rollback();
        connection.release();
        return next(
          errorHandler(
            403,
            "You are not authorized to use this account from this branch"
          )
        );
      }

      // Update the ticket status to active (1)
      const [result] = await connection.query(
        "UPDATE pawning_ticket SET Status = '1' WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
        [ticketIdToUpdate, req.branchId]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return next(errorHandler(500, "Failed to activate the ticket"));
      }

      const balanceAfterDisbursement = parseFloat(
        fromAccount[0].Account_Balance - amount
      );
      // deduct the amount from the account balance
      const [updateAccountResult] = await connection.query(
        "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?",
        [balanceAfterDisbursement, fromAccountId, req.branchId]
      );

      if (updateAccountResult.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return next(errorHandler(500, "Failed to update account balance"));
      }

      // insert a credit log to accounting accounting logs
      const [accountingLogResult] = await connection.query(
        "INSERT INTO accounting_accounts_log (Accounting_Accounts_idAccounting_Accounts, Date_Time, Type, Description, Debit, Credit, Balance, Contra_Account, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          fromAccountId,
          new Date(),
          "Ticket Loan Disbursement",
          `Loan disbursement for ticket #${ticketIdToUpdate}`,
          0,
          amount,
          balanceAfterDisbursement,
          null,
          req.userId,
        ]
      );
    }

    // create a log in ticket log for loan disbursement action
    await createPawningTicketLogOnApprovalandLoanDisbursement(
      existingTicketRow[0].idPawning_Ticket,
      null,
      "LOAN-DISBURSEMENT",
      "Ticket activated and loan disbursed",
      req.userId
    );

    await connection.commit();
    connection.release();
    res.status(200).json({
      success: true,
      ticketId: ticketIdToUpdate,
      message: "Pawning ticket activated and loan disbursed successfully.",
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error("Error in activatePawningTicket:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// send active (1) pawning tickets
export const sendActiveTickets = async (req, res, next) => {
  try {
    const { product, start_date, end_date, nic } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build base WHERE conditions for both count and data queries
    let baseWhereConditions = "pt.Branch_idBranch = ? AND pt.Status = '1'";
    let countParams = [req.branchId];
    let dataParams = [req.branchId];

    // Add filter conditions dynamically
    if (product) {
      // Sanitize product name for LIKE query
      const sanitizedProduct = `%${product.replace(/[%_\\]/g, "\\$&")}%`;
      baseWhereConditions += " AND pp.Name LIKE ?";
      countParams.push(sanitizedProduct);
      dataParams.push(sanitizedProduct);
    }

    if (start_date) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(start_date)) {
        return next(
          errorHandler(400, "Invalid start_date format. Use YYYY-MM-DD")
        );
      }
      baseWhereConditions +=
        " AND DATE(STR_TO_DATE(pt.Date_Time, '%Y-%m-%d %H:%i:%s')) >= ?";
      countParams.push(start_date);
      dataParams.push(start_date);
    }

    if (end_date) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(end_date)) {
        return next(
          errorHandler(400, "Invalid end_date format. Use YYYY-MM-DD")
        );
      }
      baseWhereConditions +=
        " AND DATE(STR_TO_DATE(pt.Date_Time, '%Y-%m-%d %H:%i:%s')) <= ?";
      countParams.push(end_date);
      dataParams.push(end_date);
    }

    // Validate date range if both dates are provided
    if (start_date && end_date) {
      if (new Date(start_date) > new Date(end_date)) {
        return next(errorHandler(400, "start_date cannot be after end_date"));
      }
    }

    if (nic) {
      // Sanitize and format NIC for SQL LIKE query
      const sanitizedNIC = nic.replace(/[^a-zA-Z0-9]/g, ""); // Remove special characters

      const formattedNIC = formatSearchPattern(sanitizedNIC);
      baseWhereConditions += " AND c.NIC LIKE ?";
      countParams.push(formattedNIC);
      dataParams.push(formattedNIC);
    }

    // Build count query with same conditions as main query
    const countQuery = `SELECT COUNT(*) AS total
                        FROM pawning_ticket pt
                 LEFT JOIN customer c ON pt.Customer_idCustomer = c.idCustomer
                 LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product 
                       WHERE ${baseWhereConditions}`;
    const paginationData = await getPaginationData(
      countQuery,
      countParams,
      page,
      limit
    );

    // Build main data query - fetch ticket data with customer NIC and product name
    let query = `SELECT pt.idPawning_Ticket, pt.Ticket_No, pt.Date_Time, pt.Maturity_Date, pt.Pawning_Advance_Amount, pt.Status, c.Full_name, c.NIC, c.Mobile_No, pp.Name AS ProductName
                  FROM pawning_ticket pt
            LEFT JOIN customer c ON pt.Customer_idCustomer = c.idCustomer
            LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product
                  WHERE ${baseWhereConditions}
               ORDER BY pt.idPawning_Ticket DESC LIMIT ? OFFSET ?`;
    dataParams.push(limit, offset);

    const [tickets] = await pool.query(query, dataParams);

    res.status(200).json({
      success: true,
      tickets: tickets || [],
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error in getApprovedPawningTickets:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// send settled (2) pawning tickets
export const sendSettledTickets = async (req, res, next) => {
  try {
    const { product, start_date, end_date, nic } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build base WHERE conditions for both count and data queries
    let baseWhereConditions = "pt.Branch_idBranch = ? AND pt.Status = '2'";
    let countParams = [req.branchId];
    let dataParams = [req.branchId];

    // Add filter conditions dynamically
    if (product) {
      // Sanitize product name for LIKE query
      const sanitizedProduct = `%${product.replace(/[%_\\]/g, "\\$&")}%`;
      baseWhereConditions += " AND pp.Name LIKE ?";
      countParams.push(sanitizedProduct);
      dataParams.push(sanitizedProduct);
    }

    if (start_date) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(start_date)) {
        return next(
          errorHandler(400, "Invalid start_date format. Use YYYY-MM-DD")
        );
      }
      baseWhereConditions +=
        " AND DATE(STR_TO_DATE(pt.Date_Time, '%Y-%m-%d %H:%i:%s')) >= ?";
      countParams.push(start_date);
      dataParams.push(start_date);
    }

    if (end_date) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(end_date)) {
        return next(
          errorHandler(400, "Invalid end_date format. Use YYYY-MM-DD")
        );
      }
      baseWhereConditions +=
        " AND DATE(STR_TO_DATE(pt.Date_Time, '%Y-%m-%d %H:%i:%s')) <= ?";
      countParams.push(end_date);
      dataParams.push(end_date);
    }

    // Validate date range if both dates are provided
    if (start_date && end_date) {
      if (new Date(start_date) > new Date(end_date)) {
        return next(errorHandler(400, "start_date cannot be after end_date"));
      }
    }

    if (nic) {
      // Sanitize and format NIC for SQL LIKE query
      const sanitizedNIC = nic.replace(/[^a-zA-Z0-9]/g, ""); // Remove special characters

      const formattedNIC = formatSearchPattern(sanitizedNIC);
      baseWhereConditions += " AND c.NIC LIKE ?";
      countParams.push(formattedNIC);
      dataParams.push(formattedNIC);
    }

    // Build count query with same conditions as main query
    const countQuery = `SELECT COUNT(*) AS total
                        FROM pawning_ticket pt
                 LEFT JOIN customer c ON pt.Customer_idCustomer = c.idCustomer
                 LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product 
                       WHERE ${baseWhereConditions}`;
    const paginationData = await getPaginationData(
      countQuery,
      countParams,
      page,
      limit
    );

    // Build main data query - fetch ticket data with customer NIC and product name
    let query = `SELECT pt.idPawning_Ticket, pt.Ticket_No, pt.Date_Time, pt.Maturity_Date, pt.Pawning_Advance_Amount, pt.Status, c.Full_name, c.NIC, c.Mobile_No, pp.Name AS ProductName
                  FROM pawning_ticket pt
            LEFT JOIN customer c ON pt.Customer_idCustomer = c.idCustomer
            LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product
                  WHERE ${baseWhereConditions}
               ORDER BY pt.idPawning_Ticket DESC LIMIT ? OFFSET ?`;
    dataParams.push(limit, offset);

    const [tickets] = await pool.query(query, dataParams);

    res.status(200).json({
      success: true,
      tickets: tickets || [],
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error in getApprovedPawningTickets:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// send ticket which status '1' or '-1' for ticket print after ticket approve or ticket renewal (-1 after ticket approve and after renewal ticket goes to 1 which is active state)
export const sendTicketsForPrinting = async (req, res, next) => {
  try {
    const { product, start_date, end_date, nic } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    console.log(req.query, "query params for printing");

    // Build base WHERE conditions for both count and data queries
    let baseWhereConditions =
      "pt.Branch_idBranch = ? AND (pt.Status = '1' OR pt.Status = '-1') AND pt.Print_Status = '0'";
    let countParams = [req.branchId];
    let dataParams = [req.branchId];

    // Add filter conditions dynamically
    if (product) {
      // Sanitize product name for LIKE query
      const sanitizedProduct = `%${product.replace(/[%_\\]/g, "\\$&")}%`;
      baseWhereConditions += " AND pp.Name LIKE ?";
      countParams.push(sanitizedProduct);
      dataParams.push(sanitizedProduct);
    }

    if (start_date) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(start_date)) {
        return next(
          errorHandler(400, "Invalid start_date format. Use YYYY-MM-DD")
        );
      }
      baseWhereConditions +=
        " AND DATE(STR_TO_DATE(pt.Date_Time, '%Y-%m-%d %H:%i:%s')) >= ?";
      countParams.push(start_date);
      dataParams.push(start_date);
    }

    if (end_date) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(end_date)) {
        return next(
          errorHandler(400, "Invalid end_date format. Use YYYY-MM-DD")
        );
      }
      baseWhereConditions +=
        " AND DATE(STR_TO_DATE(pt.Date_Time, '%Y-%m-%d %H:%i:%s')) <= ?";
      countParams.push(end_date);
      dataParams.push(end_date);
    }

    // Validate date range if both dates are provided
    if (start_date && end_date) {
      if (new Date(start_date) > new Date(end_date)) {
        return next(errorHandler(400, "start_date cannot be after end_date"));
      }
    }

    if (nic) {
      // Sanitize and format NIC for SQL LIKE query
      const sanitizedNIC = nic.replace(/[^a-zA-Z0-9]/g, ""); // Remove special characters

      const formattedNIC = formatSearchPattern(sanitizedNIC);
      baseWhereConditions += " AND c.NIC LIKE ?";
      countParams.push(formattedNIC);
      dataParams.push(formattedNIC);
    }

    // Build count query with same conditions as main query
    const countQuery = `SELECT COUNT(*) AS total
                        FROM pawning_ticket pt
                 LEFT JOIN customer c ON pt.Customer_idCustomer = c.idCustomer
                 LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product 
                       WHERE ${baseWhereConditions}`;
    const paginationData = await getPaginationData(
      countQuery,
      countParams,
      page,
      limit
    );

    // Determine if any search filters are applied
    const hasSearchFilters = product || start_date || end_date || nic;

    // Choose ordering based on whether search filters are applied
    const orderBy = hasSearchFilters
      ? "ORDER BY pt.idPawning_Ticket DESC"
      : "ORDER BY pt.updated_at DESC, pt.idPawning_Ticket DESC";

    // Build main data query - fetch ticket data with customer NIC and product name
    let query = `SELECT pt.idPawning_Ticket, pt.Ticket_No, pt.Date_Time, pt.Maturity_Date, pt.Pawning_Advance_Amount, pt.Status, c.Full_name, c.NIC, c.Mobile_No, pp.Name AS ProductName
                  FROM pawning_ticket pt
            LEFT JOIN customer c ON pt.Customer_idCustomer = c.idCustomer
            LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product
                  WHERE ${baseWhereConditions}
               ${orderBy} LIMIT ? OFFSET ?`;
    dataParams.push(limit, offset);

    const [tickets] = await pool.query(query, dataParams);

    res.status(200).json({
      success: true,
      tickets: tickets || [],
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error in sendTicketsForPrinting:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Mark ticket Print_Status as '1' after printing
export const markTicketAsPrinted = async (req, res, next) => {
  try {
    const ticketId = req.params.id || req.params.ticketId;
    if (!ticketId) {
      return next(errorHandler(400, "Ticket ID is required"));
    }

    const [existingTicketRow] = await pool.query(
      "SELECT 1 FROM pawning_ticket WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [ticketId, req.branchId]
    );

    if (existingTicketRow.length === 0) {
      return next(errorHandler(404, "No ticket found for the given ID"));
    }

    // Update the Print_Status to '1'
    const [result] = await pool.query(
      "UPDATE pawning_ticket SET Print_Status = '1' WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [ticketId, req.branchId]
    );

    if (result.affectedRows === 0) {
      return next(
        errorHandler(500, "Failed to update the ticket print status")
      );
    }

    res.status(200).json({
      success: true,
      ticketId: ticketId,
      message: "Ticket marked as printed successfully.",
    });
  } catch (error) {
    console.error("Error in markTicketAsPrinted:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Generate pawning ticket number
export const generatePawningTicketNumber = async (req, res, next) => {
  try {
    const { customerId, productId } = req.query;
    const formatComponents = [
      "Branch Number",
      "Branch's Customer Count",
      "Product Code",
      "Customer Number",
      "Auto Create Number",
    ];
    let ticketNo = "";

    const [ticketFormat] = await pool.query(
      "SELECT * FROM pawning_ticket_format WHERE company_id = ?",
      [req.companyId]
    );

    if (ticketFormat.length === 0) {
      return next(
        errorHandler(404, "Pawning ticket number format not configured")
      );
    }

    // check if the ticket format type is custom format

    if (ticketFormat[0].format_type === "Format") {
      const formatString = ticketFormat[0].format; // get the format string (eg : branch-customer-product-customer-autonumber)

      // Split the format string but preserve separators
      const formatPartsWithSeparators = formatString.split(/([-.\/])/);

      for (let i = 0; i < formatPartsWithSeparators.length; i++) {
        const part = formatPartsWithSeparators[i].trim();

        // If it's a separator, add it to ticketNo
        if (["-", ".", "/"].includes(part)) {
          ticketNo += part;
          continue;
        }

        // If it's a format component, process it
        if (part === "Branch Number") {
          // get the branch number
          const [branch] = await pool.query(
            "SELECT Branch_Code FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
            [req.branchId, req.companyId]
          );

          if (branch.length === 0) {
            return next(errorHandler(404, "Branch not found"));
          }

          ticketNo += branch[0].Branch_Code || "00";
        }

        if (part === "Branch's Customer Count") {
          const [customerCount] = await pool.query(
            "SELECT COUNT(*) AS count FROM customer WHERE Branch_idBranch = ?",
            [req.branchId]
          );

          if (customerCount.length === 0) {
            return next(errorHandler(404, "No customers found for the branch"));
          }

          ticketNo += customerCount[0].count.toString().padStart(4, "0");
        }

        if (part === "Product Code") {
          if (productId) {
            ticketNo += productId.toString().padStart(3, "0");
          } else {
            ticketNo += "000"; // default if productId not provided
          }
        }

        if (part === "Customer Number") {
          if (customerId) {
            ticketNo += customerId.toString().padStart(4, "0");
          } else {
            ticketNo += "0000"; // default if customerId not provided
          }
        }

        if (part === "Auto Create Number") {
          let autoNumber = ticketFormat[0].auto_generate_start_from;
          if (autoNumber !== undefined && autoNumber !== null) {
            // calculate the total tickets in the company
            let ticketCount = 0;
            // find all the branches for this specific company
            const [branches] = await pool.query(
              "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
              [req.companyId]
            );

            if (branches.length === 0) {
              return next(
                errorHandler(404, "No branches found for the company")
              );
            }

            // loop through each branch and count ticket's
            for (const branch of branches) {
              const [branchTicketCount] = await pool.query(
                "SELECT COUNT(*) AS count FROM pawning_ticket WHERE Branch_idBranch = ?",
                [branch.idBranch]
              );
              ticketCount += branchTicketCount[0].count;
            }

            autoNumber += ticketCount;

            ticketNo += autoNumber.toString();
          } else {
            ticketNo += "1"; // default auto number
          }
        }
      }
    } else {
      let ticketCount = 0;
      // find all the branches for this specific company
      const [branches] = await pool.query(
        "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
        [req.companyId]
      );

      if (branches.length === 0) {
        return next(errorHandler(404, "No branches found for the company"));
      }

      // loop through each branch and count ticket's
      for (const branch of branches) {
        const [branchTicketCount] = await pool.query(
          "SELECT COUNT(*) AS count FROM pawning_ticket WHERE Branch_idBranch = ?",
          [branch.idBranch]
        );
        ticketCount += branchTicketCount[0].count;
      }

      ticketNo = ticketCount;
    }

    res.status(200).json({
      success: true,
      ticketNumber: ticketNo,
      message: "Pawning ticket number generated successfully.",
    });
  } catch (error) {
    console.error("Error in generatePawningTicketNumber:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// check if there is tickets in the company (enable or disable ticket number auto generate start from input)
export const checkIfTicketsExistInCompany = async (req, res, next) => {
  try {
    const [isTicketExistInCompany] = await pool.query(
      `SELECT pt.idPawning_Ticket
       FROM pawning_ticket pt
       JOIN branch b ON pt.Branch_idBranch = b.idBranch
       WHERE b.Company_idCompany = ?
       LIMIT 1`,
      [req.companyId]
    );

    res.status(200).json({
      success: true,
      ticketsExist: isTicketExistInCompany.length > 0,
    });
  } catch (error) {
    console.error("Error in checkIfTicketsExistInCompany:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
