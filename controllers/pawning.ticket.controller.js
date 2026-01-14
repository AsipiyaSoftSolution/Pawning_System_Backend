import { errorHandler } from "../utils/errorHandler.js";
import { pool, pool2 } from "../utils/db.js";
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

    // console.log(data, "data in createPawningTicket");
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
        if (
          article[field] === undefined ||
          article[field] === null ||
          article[field] === ""
        ) {
          return next(
            errorHandler(
              400,
              `Missing required field in ticket article: ${field}`,
            ),
          );
        }
      }
    }

    // Validate that productId exists in pawning_product table
    const [productExists] = await pool.query(
      "SELECT idPawning_Product FROM pawning_product WHERE idPawning_Product = ?",
      [data.ticketData.productId],
    );

    if (productExists.length === 0) {
      return next(
        errorHandler(
          400,
          `Invalid product ID: ${data.ticketData.productId}. Product does not exist.`,
        ),
      );
    }

    // Validate that customerId exists
    const [customerExists] = await pool.query(
      "SELECT idCustomer FROM customer WHERE idCustomer = ?",
      [data.ticketData.customerId],
    );

    if (customerExists.length === 0) {
      return next(
        errorHandler(
          400,
          `Invalid customer ID: ${data.ticketData.customerId}. Customer does not exist.`,
        ),
      );
    }

    // check if pawning advance is less than or equal to all ticketArticles's declaredValue
    const totalDeclaredValue = data.ticketArticles.reduce(
      (sum, article) => sum + parseFloat(article.declaredValue || 0),
      0,
    );
    if (parseFloat(data.ticketData.pawningAdvance) > totalDeclaredValue) {
      return next(
        errorHandler(
          400,
          "Pawning advance cannot be greater than total declared value of articles",
        ),
      );
    }

    const [accountCenterCus] = await pool.query(
      "SELECT accountCenterCusId FROM customer WHERE idCustomer = ?",
      [data.ticketData.customerId],
    );
    // check if customer is blacklisted, if so block ticket creation
    const [customerStatusRows] = await pool2.query(
      "SELECT Status FROM customer WHERE idCustomer = ?",
      [accountCenterCus[0].accountCenterCusId],
    );

    if (
      customerStatusRows.length > 0 &&
      Number(customerStatusRows[0].Status) === 0
    ) {
      return next(
        errorHandler(400, "Cannot create ticket. Customer is blacklisted."),
      );
    }

    // get the ticket's product service charge type and other data
    const [productData] = await pool.query(
      "SELECT Service_Charge_Create_As,Interest_Method,Service_Charge_Value,Service_Charge_Value_Type FROM pawning_product WHERE idPawning_Product = ?",
      [data.ticketData.productId],
    );

    if (!productData || productData.length === 0) {
      return next(
        errorHandler(400, "Product not found for the given product ID"),
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
              data.ticketData.serviceCharge,
          ) /
            100);
      } else if (productData[0]?.Service_Charge_Value_Type === "Fixed Amount") {
        serviceChargeRate = parseFloat(
          productData[0]?.Service_Charge_Value || data.ticketData.serviceCharge,
        );
      }
    }

    let productPlanData;
    // if service charge create as is "Charge For Product Item"
    if (
      productData[0].Service_Charge_Create_As === "Charge For Product Item" ||
      productData[0].Service_Charge_Create_As === "inactive"
    ) {
      if (productData[0].Interest_Method === "Interest For Period") {
        [productPlanData] = await pool.query(
          "SELECT idProduct_Plan,Service_Charge_Value_type, Service_Charge_Value FROM product_plan WHERE Pawning_Product_idPawning_Product = ? AND Period_Type = ? AND ? BETWEEN CAST(Minimum_Period AS UNSIGNED) AND CAST(Maximum_Period AS UNSIGNED)",
          [
            data.ticketData.productId,
            data.ticketData.periodType,
            data.ticketData.period,
          ],
        );

        if (productPlanData.length === 0) {
          return next(
            errorHandler(
              400,
              "No matching product plan found for the given product ID, period type, and period",
            ),
          );
        }

        // Check if service charge is inactive
        if (productPlanData[0]?.Service_Charge_Value_type === "inactive") {
          serviceChargeRate = 0; // No service charge when inactive
        } else if (
          productPlanData[0]?.Service_Charge_Value_type === "percentage"
        ) {
          serviceChargeRate =
            parseFloat(data.ticketData.pawningAdvance) *
            (parseFloat(productPlanData[0]?.Service_Charge_Value) / 100);
        } else if (productPlanData[0]?.Service_Charge_Value_type === "fixed") {
          serviceChargeRate = parseFloat(
            productPlanData[0]?.Service_Charge_Value,
          );
        }
      }

      if (productData[0].Interest_Method === "Interest For Pawning Amount") {
        [productPlanData] = await pool.query(
          "SELECT idProduct_Plan,Service_Charge_Value_type, Service_Charge_Value FROM product_plan WHERE Pawning_Product_idPawning_Product = ? AND ? BETWEEN CAST(Minimum_Amount AS UNSIGNED) AND CAST(Maximum_Amount AS UNSIGNED)",
          [data.ticketData.productId, data.ticketData.pawningAdvance],
        );

        if (productPlanData.length === 0) {
          return next(
            errorHandler(
              400,
              "No matching product plan found for the given product ID and pawning advance amount",
            ),
          );
        }

        // Check if service charge is inactive
        if (productPlanData[0]?.Service_Charge_Value_type === "inactive") {
          serviceChargeRate = 0; // No service charge when inactive
        } else if (
          productPlanData[0]?.Service_Charge_Value_type === "percentage"
        ) {
          serviceChargeRate =
            parseFloat(data.ticketData.pawningAdvance) *
            (parseFloat(productPlanData[0]?.Service_Charge_Value) / 100);
        } else if (productPlanData[0]?.Service_Charge_Value_type === "fixed") {
          serviceChargeRate = parseFloat(
            productPlanData[0]?.Service_Charge_Value,
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
            "No matching product plan found for the given interest method and parameters",
          ),
        );
      }
      serviceChargeType =
        productPlanData[0]?.Service_Charge_Value_type === "inactive"
          ? "inactive"
          : productPlanData[0]?.Service_Charge_Value_type || "unknown";
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
        [productPlanData[0].idProduct_Plan],
      );
      // Defensive assignment and logging
      if (Array.isArray(stagesData) && stagesData.length > 0) {
        productPlanStagesData = stagesData;
        console.log(
          "\x1b[42m\x1b[30m Product Plan Stages Data Found \x1b[0m",
          JSON.stringify(productPlanStagesData[0], null, 2),
        );
      } else {
        productPlanStagesData = [{}];
        console.warn(
          "\x1b[41m\x1b[37m No Product Plan Stages Data Found for idProduct_Plan:",
          productPlanData[0].idProduct_Plan,
          "\x1b[0m",
        );
      }
    }

    // get is_Ticket_Approve_After_Create setting from company table
    const [companySettings] = await pool2.query(
      "SELECT is_Ticket_Approve_After_Create FROM company WHERE idCompany = ?",
      [req.companyId],
    );

    let status = 0;

    if (companySettings.length > 0) {
      if (companySettings[0].is_Ticket_Approve_After_Create === 1) {
        status = -1; // approved before loan disbursement
      }
    }

    // Insert into pawning_ticket table
    const [result] = await pool.query(
      "INSERT INTO pawning_ticket (Ticket_No,SEQ_No,Date_Time,Customer_idCustomer,Period_Type,Period,Maturity_Date,Gross_Weight,Assessed_Value,Net_Weight,Payble_Value,Pawning_Advance_Amount,Interest_Rate,Service_charge_Amount,Late_charge_Presentage,Interest_apply_on,User_idUser,Branch_idBranch,Pawning_Product_idPawning_Product,Total_Amount,Service_Charge_Type,Service_Charge_Rate,Early_Settlement_Charge_Balance,Additiona_Charges_Balance,Service_Charge_Balance,Late_Charge_Balance,Interest_Amount_Balance,Balance_Amount,Interest_Rate_Duration,stage1StartDate,stage1EndDate,stage2StartDate,stage2EndDate,stage3StartDate,stage3EndDate,stage4StartDate,stage4EndDate,stage1Interest,stage2Interest,stage3Interest,stage4Interest,Status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
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
        status, // initial status (can be 0 or -1 based on company settings)
      ],
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
            [imageUrl, ticketId],
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
      /* Log the article data for debugging
      console.log("Inserting article:", {
        type: article.type,
        category: article.category,
        condition: article.condition,
        caratage: article.caratage,
        noOfItems: article.noOfItems,
      });
      */

      // Check net weight vs gross weight before processing
      if (parseFloat(article.netWeight) > parseFloat(article.grossWeight)) {
        return next(
          errorHandler(400, "Net weight cannot be greater than Gross weight"),
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
          ).toFixed(2),
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
        ],
      );
    }

    // create initial log entry for ticket creation
    await createPawningTicketLogOnCreate(
      ticketId,
      "CREATE",
      req.userId,
      data.ticketData.pawningAdvance,
    );

    // create service charge log entry
    await markServiceChargeInTicketLog(
      ticketId,
      "SERVICE CHARGE",
      req.userId,
      serviceChargeRate, // service charge amount
    );

    // create customer log for ticket creation
    await createCustomerLogOnCreateTicket(
      "CREATE TICKET",
      `Created ticket No: ${data.ticketData.ticketNo}`,
      data.ticketData.customerId,
      req.userId,
    );

    if (status === -1) {
      // create log entry for ticket approval if ticket is auto approved after creation
      await createPawningTicketLogOnApprovalandLoanDisbursement(
        ticketId,
        ticketId, // typeId is also the ticketId here
        "APPROVE-TICKET",
        "Ticket approved, according to company settings it is approved after creation.",
        req.userId,
      );
    }

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
      "SELECT COUNT(*) AS count FROM pawning_ticket WHERE DATE(Date_Time) = CURDATE()",
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
      limit,
    );

    const [products] = await pool.query(
      "SELECT idPawning_Product, Name, Interest_Method FROM pawning_product WHERE Branch_idBranch = ? ORDER BY idPawning_Product DESC LIMIT ? OFFSET ?",
      [req.branchId, limit, offset],
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
      [productId],
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
      [productId, periodType],
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

    // Search in account center (pool2) since NIC is stored there
    const [accountCenterCustomers] = await pool2.query(
      `SELECT * FROM customer 
       WHERE Nic LIKE ? AND branch_id = ? AND isPawningUserId IS NOT NULL`,
      [formatedNIC, req.branchId],
    );

    if (!accountCenterCustomers || accountCenterCustomers.length === 0) {
      return res.status(200).json({
        success: true,
        customer: null,
      });
    }

    // Get pawning customer IDs from account center results
    const pawningCustomerIds = accountCenterCustomers
      .map((c) => c.isPawningUserId)
      .filter((id) => id !== null && id !== undefined);

    // Fetch pawning customer data
    let pawningCustomersMap = new Map();
    if (pawningCustomerIds.length > 0) {
      const placeholders = pawningCustomerIds.map(() => "?").join(",");
      const [pawningCustomers] = await pool.query(
        `SELECT * FROM customer WHERE idCustomer IN (${placeholders})`,
        pawningCustomerIds,
      );

      for (const pawningCus of pawningCustomers) {
        pawningCustomersMap.set(pawningCus.idCustomer, pawningCus);
      }
    }

    // Fetch documents for all pawning customers
    let documentsMap = new Map();
    if (pawningCustomerIds.length > 0) {
      const placeholders = pawningCustomerIds.map(() => "?").join(",");
      const [documents] = await pool.query(
        `SELECT Customer_idCustomer, Document_Name, Path 
         FROM customer_documents 
         WHERE Customer_idCustomer IN (${placeholders})`,
        pawningCustomerIds,
      );

      // Group documents by customer ID
      for (const doc of documents) {
        if (!documentsMap.has(doc.Customer_idCustomer)) {
          documentsMap.set(doc.Customer_idCustomer, []);
        }
        documentsMap.get(doc.Customer_idCustomer).push({
          Document_Name: doc.Document_Name,
          Path: doc.Path,
        });
      }
    }

    // Merge account center and pawning customer data - matching original format
    const customers = accountCenterCustomers.map((accCus) => {
      const pawningData = pawningCustomersMap.get(accCus.isPawningUserId);
      const customerDocs = documentsMap.get(accCus.isPawningUserId) || [];

      // Return in original format for frontend compatibility
      return {
        idCustomer: pawningData?.idCustomer || null,
        NIC: accCus.Nic,
        Full_name:
          accCus.First_Name && accCus.Last_Name
            ? `${accCus.First_Name} ${accCus.Last_Name}`
            : accCus.First_Name || accCus.Last_Name || null,
        Address1: accCus.Address || null,
        Address2: accCus.Address_02 || null,
        Address3: accCus.Address_03 || null,
        Mobile_No: accCus.Contact_No || null,
        Status: accCus.Status,
        Risk_Level: accCus.Customer_Risk_Level || null,
        // Blacklist fields from pawning data (conditional)
        Blacklist_Reason:
          pawningData?.Behaviour_Status === "0"
            ? pawningData?.Blacklist_Reason
            : null,
        Blacklist_Date:
          pawningData?.Behaviour_Status === "0"
            ? pawningData?.Blacklist_Date
            : null,
        documents: customerDocs,
      };
    });

    res.status(200).json({
      success: true,
      customer: customers,
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
  next,
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
          "productId, periodType, interestMethod  and caratage are all required",
        ),
      );
    }

    // Fetch all product items for the product and period type
    const [productItems] = await pool.query(
      "SELECT idProduct_Plan, Amount_For_22_Caratage, Minimum_Period, Maximum_Period, Minimum_Amount, Maximum_Amount,Week_Precentage_Amount_22_Caratage,Month1_Precentage_Amount_22_Caratage,Month3_Precentage_Amount_22_Caratage,Month6_Precentage_Amount_22_Caratage,Month9_Precentage_Amount_22_Caratage,Month12_Precentage_Amount_22_Caratage FROM product_plan WHERE Pawning_Product_idPawning_Product = ? ",
      [productId],
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
            productItems[0].Week_Precentage_Amount_22_Caratage,
          );
        }

        if (Number(period) > 7 && Number(period) <= 30) {
          caratAmountPrecentage = Number(
            productItems[0].Month1_Precentage_Amount_22_Caratage,
          );
        }

        if (Number(period) > 30 && Number(period) <= 90) {
          caratAmountPrecentage = Number(
            productItems[0].Month3_Precentage_Amount_22_Caratage,
          );
        }

        if (Number(period) > 90 && Number(period) <= 180) {
          caratAmountPrecentage = Number(
            productItems[0].Month6_Precentage_Amount_22_Caratage,
          );
        }
        if (Number(period) > 180 && Number(period) <= 270) {
          caratAmountPrecentage = Number(
            productItems[0].Month9_Precentage_Amount_22_Caratage,
          );
        }

        if (Number(period) > 270 && Number(period) <= 365) {
          caratAmountPrecentage = Number(
            productItems[0].Month12_Precentage_Amount_22_Caratage,
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
            productItems[0].Week_Precentage_Amount_22_Caratage,
          );
        }

        if (Number(period) > 1 && Number(period) <= 4) {
          caratAmountPrecentage = Number(
            productItems[0].Month1_Precentage_Amount_22_Caratage,
          );
        }

        if (Number(period) > 4 && Number(period) <= 13) {
          caratAmountPrecentage = Number(
            productItems[0].Month3_Precentage_Amount_22_Caratage,
          );
        }

        if (Number(period) > 13 && Number(period) <= 26) {
          caratAmountPrecentage = Number(
            productItems[0].Month6_Precentage_Amount_22_Caratage,
          );
        }

        if (Number(period) > 26 && Number(period) <= 39) {
          caratAmountPrecentage = Number(
            productItems[0].Month9_Precentage_Amount_22_Caratage,
          );
        }

        if (Number(period) > 39 && Number(period) <= 52) {
          caratAmountPrecentage = Number(
            productItems[0].Month12_Precentage_Amount_22_Caratage,
          );
        }

        if (Number(period) > 52) {
          caratAmountPrecentage = 100; // assign 100% if more than a year
        }
      }

      if (periodType === "months") {
        if (Number(period) === 1) {
          caratAmountPrecentage = Number(
            productItems[0].Month1_Precentage_Amount_22_Caratage,
          );
        }

        if (Number(period) > 1 && Number(period) <= 3) {
          caratAmountPrecentage = Number(
            productItems[0].Month3_Precentage_Amount_22_Caratage,
          );
        }

        if (Number(period) > 3 && Number(period) <= 6) {
          caratAmountPrecentage = Number(
            productItems[0].Month6_Precentage_Amount_22_Caratage,
          );
        }

        if (Number(period) > 6 && Number(period) <= 9) {
          caratAmountPrecentage = Number(
            productItems[0].Month9_Precentage_Amount_22_Caratage,
          );
        }

        if (Number(period) > 9 && Number(period) <= 12) {
          caratAmountPrecentage = Number(
            productItems[0].Month12_Precentage_Amount_22_Caratage,
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
            productItems[0].Month12_Precentage_Amount_22_Caratage,
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
        (baseAmount * (caratNum / 22)).toFixed(2),
      ); // amount for selected caratage

      let amount = parseFloat(
        amountForSelectedCaratage * (caratAmountPrecentage / 100),
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
    const [assessedValue] = await pool2.query(
      "SELECT Amount FROM  assessed_value WHERE Carat = ? AND Company_idCompany = ?",
      [caratage, req.companyId],
    );

    if (assessedValue.length === 0) {
      return next(
        errorHandler(404, "No assessed values found for the given caratage"),
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
          "productId, periodType, interestMethod and pawningAdvance are all required",
        ),
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
        [productId, periodType],
      );

      if (productPlans.length === 0) {
        return next(
          errorHandler(404, "No product plans found for the given criteria"),
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
        currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000,
      );
    } else if (interestMethodNum === 0) {
      [productPlans] = await pool.query(
        "SELECT * FROM product_plan WHERE Pawning_Product_idPawning_Product = ? ",
        [productId, periodType],
      );

      if (productPlans.length === 0) {
        return next(
          errorHandler(404, "No product plans found for the given criteria"),
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
        currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000,
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

    let ticketQuery = "";
    let ticketQueryParams = [];

    if (req.isHeadBranch === true) {
      ticketQuery = "SELECT * FROM pawning_ticket WHERE idPawning_Ticket = ?";
      ticketQueryParams = [ticketId];
    } else {
      ticketQuery =
        "SELECT * FROM pawning_ticket WHERE idPawning_Ticket = ? AND  Branch_idBranch = ?";
      ticketQueryParams = [ticketId, req.branchId];
    }

    [ticketData] = await pool.query(ticketQuery, ticketQueryParams);

    if (ticketData.length === 0) {
      return next(errorHandler(404, "No ticket found for the given ID"));
    }

    // get the branch name for the ticket
    const [branchData] = await pool2.query(
      "SELECT Name FROM branch WHERE idBranch = ?",
      [ticketData[0].Branch_idBranch],
    );

    ticketData[0].branchName = branchData[0]?.Name || "Unknown Branch"; // attach branch name to ticket data

    // fetch ticket images
    const [ticketImages] = await pool.query(
      "SELECT File_Path FROM ticket_artical_images WHERE Pawning_Ticket_idPawning_Ticket = ?",
      [ticketData[0].idPawning_Ticket],
    );

    // attach images to ticket data
    ticketData[0].images = ticketImages || [];

    // fetch the user name who created the ticket
    const [userData] = await pool2.query(
      "SELECT full_name FROM user WHERE idUser = ?",
      [ticketData[0].User_idUser],
    );
    ticketData[0].createdUser = userData[0]?.full_name || "Unknown User";
    delete ticketData[0].User_idUser; // remove User_idUser from ticket data

    // get the product name for the ticket
    const [productData] = await pool.query(
      "SELECT Name FROM pawning_product WHERE idPawning_Product = ?",
      [ticketData[0].Pawning_Product_idPawning_Product],
    );

    ticketData[0].productName = productData[0].Name || "Unknown Product"; // attach product name to ticket data
    delete ticketData[0].Pawning_Product_idPawning_Product; // remove product id from response

    // fetch customer data for the ticket
    // First get the accountCenterCusId from pawning DB
    const [pawningCustomer] = await pool.query(
      "SELECT idCustomer, accountCenterCusId, Behaviour_Status, Blacklist_Reason, Blacklist_Date FROM customer WHERE idCustomer = ?",
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

    // Then fetch full details from account center (pool2)
    const [accCustomer] = await pool2.query(
      `SELECT idCustomer, Nic, First_Name, Last_Name, Address, Address_02, Address_03, Contact_No, Status, Customer_Risk_Level 
       FROM customer WHERE idCustomer = ?`,
      [pawningCustomer[0].accountCenterCusId],
    );

    if (accCustomer.length > 0) {
      const accCus = accCustomer[0];
      customerData = [
        {
          idCustomer: pawningCustomer[0].idCustomer,
          NIC: accCus.Nic,
          Full_name:
            accCus.First_Name && accCus.Last_Name
              ? `${accCus.First_Name} ${accCus.Last_Name}`
              : accCus.First_Name || accCus.Last_Name || null,
          Address1: accCus.Address,
          Address2: accCus.Address_02,
          Address3: accCus.Address_03,
          Mobile_No: accCus.Contact_No,
          Status: accCus.Status,
          Risk_Level: accCus.Customer_Risk_Level,
          // Include blacklisting info which might still be relevant on pawning side or merged
          Blacklist_Reason:
            pawningCustomer[0].Behaviour_Status === "0"
              ? pawningCustomer[0].Blacklist_Reason
              : null,
          Blacklist_Date:
            pawningCustomer[0].Behaviour_Status === "0"
              ? pawningCustomer[0].Blacklist_Date
              : null,
        },
      ];
    } else {
      // Fallback if no account center record found (should ideally not happen if data is consistent)
      customerData = [
        {
          idCustomer: pawningCustomer[0].idCustomer,
          NIC: null,
          Full_name: "Unknown Customer",
          Address1: null,
          Address2: null,
          Address3: null,
          Mobile_No: null,
          Status: null,
          Risk_Level: null,
        },
      ];
    }

    // fetch ticket article items from pool (pawning_system db)
    [articleItems] = await pool.query(
      `SELECT ta.* FROM ticket_articles ta WHERE ta.Pawning_Ticket_idPawning_Ticket = ?`,
      [ticketData[0].idPawning_Ticket],
    );

    // fetch article_types and article_categories from pool2 (account_center_asipiya db) and merge
    for (let item of articleItems) {
      // Get article type name from pool2
      if (item.Article_type) {
        const [articleType] = await pool2.query(
          `SELECT Description FROM article_types WHERE idArticle_Types = ?`,
          [parseInt(item.Article_type)],
        );
        item.ArticleTypeName = articleType[0]?.Description || null;
      } else {
        item.ArticleTypeName = null;
      }

      // Get article category name from pool2
      if (item.Article_category) {
        const [articleCategory] = await pool2.query(
          `SELECT Description FROM article_categories WHERE idArticle_Categories = ?`,
          [parseInt(item.Article_category)],
        );
        item.categoryName = articleCategory[0]?.Description || null;
      } else {
        item.categoryName = null;
      }
    }

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
      [ticketData[0].idPawning_Ticket],
    );

    if (!balanceLogs || balanceLogs.length === 0) {
      return next(errorHandler(404, "No balance log found for the ticket"));
    }

    // fetch payment history for the ticket from pool (payment table)
    [paymentHistory] = await pool.query(
      "SELECT p.Date_Time, p.Type, p.Amount, p.Description, p.User FROM payment p WHERE p.Ticket_no = ? ORDER BY STR_TO_DATE(p.Date_Time, '%Y-%m-%d %H:%i:%s') DESC",
      [String(ticketData[0].Ticket_No)],
    );

    // fetch user names from pool2 for each payment
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
      delete payment.User; // remove User id from response
    }

    // fetch ticket logs for the ticket from pool
    [ticketLogs] = await pool.query(
      `SELECT tl.*
         FROM ticket_log tl
        WHERE tl.Pawning_Ticket_idPawning_Ticket = ? 
     ORDER BY tl.idTicket_Log ASC`,
      [ticketData[0].idPawning_Ticket],
    );

    // fetch user names from pool2 for each ticket log
    for (let log of ticketLogs) {
      if (log.User_idUser) {
        const [userData] = await pool2.query(
          "SELECT full_name FROM user WHERE idUser = ?",
          [log.User_idUser],
        );
        log.full_name = userData[0]?.full_name || null;
      } else {
        log.full_name = null;
      }
    }

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

    // Fetch comments without user JOIN (user is in pool2)
    const [comments] = await pool.query(
      `SELECT tc.*
         FROM ticket_comment tc
        WHERE tc.Pawning_Ticket_idPawning_Ticket = ?`,
      [ticketId],
    );

    // Fetch user names from pool2 for each comment
    for (let comment of comments) {
      if (comment.User_idUser) {
        const [userData] = await pool2.query(
          "SELECT full_name FROM user WHERE idUser = ?",
          [comment.User_idUser],
        );
        comment.Full_name = userData[0]?.full_name || null;
      } else {
        comment.Full_name = null;
      }
    }

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
      [comment, ticketId, req.userId],
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to add comment"));
    }

    // return the created comment with user name and timestamp (user is in pool2)
    const [createdComment] = await pool.query(
      `SELECT tc.*
         FROM ticket_comment tc
        WHERE tc.idTicket_Comment = ?`,
      [result.insertId],
    );

    // Fetch user name from pool2
    if (createdComment.length > 0 && createdComment[0].User_idUser) {
      const [userData] = await pool2.query(
        "SELECT full_name FROM user WHERE idUser = ?",
        [createdComment[0].User_idUser],
      );
      createdComment[0].Full_name = userData[0]?.full_name || null;
    }

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

// Helper function to get approval progress details
async function getTicketApprovalProgress(ticketId, ticketAmount, companyId) {
  try {
    // 1. Find the approval range (approval tables are in pool2)
    const [ranges] = await pool2.query(
      `SELECT idApproval_Range 
       FROM pawning_ticket_approval_range 
       WHERE companyid = ? 
         AND start_amount <= ? 
         AND end_amount >= ?
       LIMIT 1`,
      [companyId, ticketAmount, ticketAmount],
    );

    if (ranges.length === 0) {
      return null;
    }

    const rangeId = ranges[0].idApproval_Range;

    // 2. Get all levels (approval tables are in pool2)
    const [levels] = await pool2.query(
      `SELECT idApprovalRangeLevel, level_name, is_head_office_level 
       FROM pawning_ticket_approval_ranges_level 
       WHERE Approval_Range_idApproval_Range = ? 
       ORDER BY idApprovalRangeLevel ASC`,
      [rangeId],
    );

    if (levels.length === 0) {
      return null;
    }

    // 3. Get approved levels with details (approval tables are in pool2)
    const [approvedLevels] = await pool2.query(
      `SELECT pta.ApprovalRangeLevel_idApprovalRangeLevel, 
              pta.approved_by, pta.approval_date, pta.remarks
       FROM pawning_ticket_approval pta
       WHERE pta.Pawning_Ticket_idPawning_Ticket = ? 
         AND pta.approval_status = 1`,
      [ticketId],
    );

    // Fetch user names from pool2 for each approved level
    for (let approval of approvedLevels) {
      if (approval.approved_by) {
        const [userData] = await pool2.query(
          "SELECT full_name FROM user WHERE idUser = ?",
          [approval.approved_by],
        );
        approval.approver_name = userData[0]?.full_name || null;
      } else {
        approval.approver_name = null;
      }
    }

    const approvedLevelIds = approvedLevels.map(
      (al) => al.ApprovalRangeLevel_idApprovalRangeLevel,
    );

    // 4. Build progress info
    const levelProgress = [];
    let currentLevelFound = false;

    for (let i = 0; i < levels.length; i++) {
      const level = levels[i];
      const isApproved = approvedLevelIds.includes(level.idApprovalRangeLevel);
      const isCurrent = !isApproved && !currentLevelFound;

      if (isCurrent) {
        currentLevelFound = true;
      }

      // Get designations for this level (designation and approval tables are in pool2)
      const [designations] = await pool2.query(
        `SELECT d.idDesignation, d.Description as designation_name
         FROM pawning_ticket_approval_levels_designations pald
         JOIN designation d ON pald.Designation_idDesignation = d.idDesignation
         WHERE pald.ApprovalRangeLevel_idApprovalRangeLevel = ?`,
        [level.idApprovalRangeLevel],
      );

      const approvalInfo = approvedLevels.find(
        (al) =>
          al.ApprovalRangeLevel_idApprovalRangeLevel ===
          level.idApprovalRangeLevel,
      );

      levelProgress.push({
        level_name: level.level_name,
        is_head_office_level: Boolean(level.is_head_office_level),
        is_approved: isApproved,
        is_current: isCurrent,
        approved_by: isApproved ? approvalInfo?.approver_name || null : null,
        approved_date: isApproved ? approvalInfo?.approval_date || null : null,
        remarks: isApproved ? approvalInfo?.remarks || null : null,
        required_designations: designations.map((d) => d.designation_name),
      });
    }

    return {
      total_levels: levels.length,
      approved_levels: approvedLevelIds.length,
      all_approved: approvedLevelIds.length === levels.length,
      level_progress: levelProgress,
    };
  } catch (error) {
    console.error("Error in getTicketApprovalProgress:", error);
    console.error("Error details:", {
      ticketId,
      ticketAmount,
      companyId,
      errorMessage: error.message,
      errorStack: error.stack,
    });
    return null;
  }
}

// Check if user can see and approve ticket
async function checkUserCanApproveTicket(
  ticketId,
  ticketAmount,
  ticketBranchId,
  companyId,
  userDesignationId,
  isHeadBranch,
  branchId,
  userId, // ADDED: we need the actual user ID
) {
  try {
    // 1. Find the approval range that matches the ticket amount (approval tables are in pool2)
    const [ranges] = await pool2.query(
      `SELECT idApproval_Range 
       FROM pawning_ticket_approval_range 
       WHERE companyid = ? 
         AND start_amount <= ? 
         AND end_amount >= ?
       LIMIT 1`,
      [companyId, ticketAmount, ticketAmount],
    );

    if (ranges.length === 0) {
      return { canView: false, canApprove: false };
    }

    const rangeId = ranges[0].idApproval_Range;

    // 2. Get all levels for this range in order (approval tables are in pool2)
    const [levels] = await pool2.query(
      `SELECT idApprovalRangeLevel, level_name, is_head_office_level 
       FROM pawning_ticket_approval_ranges_level 
       WHERE Approval_Range_idApproval_Range = ? 
       ORDER BY idApprovalRangeLevel ASC`,
      [rangeId],
    );

    if (levels.length === 0) {
      return { canView: false, canApprove: false };
    }

    // 3. Get already approved levels for this ticket WITH USER INFO (approval tables are in pool2)
    const [approvedLevels] = await pool2.query(
      `SELECT ApprovalRangeLevel_idApprovalRangeLevel, approved_by
       FROM pawning_ticket_approval 
       WHERE Pawning_Ticket_idPawning_Ticket = ? 
         AND approval_status = 1`,
      [ticketId],
    );

    const approvedLevelIds = approvedLevels.map(
      (al) => al.ApprovalRangeLevel_idApprovalRangeLevel,
    );

    // 4. Find the CURRENT PENDING level (first level not approved yet)
    let currentPendingLevel = null;
    let currentPendingLevelIndex = -1;

    for (let i = 0; i < levels.length; i++) {
      if (!approvedLevelIds.includes(levels[i].idApprovalRangeLevel)) {
        currentPendingLevel = levels[i];
        currentPendingLevelIndex = i;
        break;
      }
    }

    // 5. Check if ALL levels are approved
    const allLevelsApproved = approvedLevelIds.length === levels.length;

    if (allLevelsApproved) {
      // Check if THIS USER actually approved ANY level (not just if they could have)
      const userApprovedAnyLevel = approvedLevels.some(
        (al) => al.approved_by === userId,
      );

      return {
        canView: userApprovedAnyLevel,
        canApprove: false,
      };
    }

    // 6. Check if THIS USER actually approved any PREVIOUS level
    // CRITICAL FIX: Check actual approvals by this user, not just designation eligibility
    const userApprovedPreviousLevel = approvedLevels.some(
      (al) => al.approved_by === userId,
    );

    // 7. Get designations authorized for the CURRENT PENDING level (approval tables are in pool2)
    const [currentLevelDesignations] = await pool2.query(
      `SELECT Designation_idDesignation 
       FROM pawning_ticket_approval_levels_designations 
       WHERE ApprovalRangeLevel_idApprovalRangeLevel = ?`,
      [currentPendingLevel.idApprovalRangeLevel],
    );

    const authorizedDesignationIds = currentLevelDesignations.map(
      (d) => d.Designation_idDesignation,
    );

    // 8. Check if user's designation is authorized for the CURRENT level
    const userIsAuthorizedForCurrentLevel =
      authorizedDesignationIds.includes(userDesignationId);

    // 9. Decision logic for VIEW access
    // User can view if they:
    // - Actually approved a previous level OR
    // - Are authorized for the current level
    const canViewBasedOnParticipation =
      userApprovedPreviousLevel || userIsAuthorizedForCurrentLevel;

    if (!canViewBasedOnParticipation) {
      return { canView: false, canApprove: false };
    }

    // 10. CRITICAL FIX: If THIS USER actually approved a previous level,
    // they can VIEW but NOT approve the current level
    if (userApprovedPreviousLevel) {
      return { canView: true, canApprove: false };
    }

    // 11. User is authorized for current level and did NOT actually approve any previous level
    // Now check head office and branch restrictions

    // Check head office level restriction
    if (!currentPendingLevel.is_head_office_level && isHeadBranch) {
      return { canView: false, canApprove: false };
    }

    if (currentPendingLevel.is_head_office_level && !isHeadBranch) {
      return { canView: false, canApprove: false };
    }

    // 12. For head office levels, check branch filter
    let canApprove = true;

    if (currentPendingLevel.is_head_office_level) {
      if (branchId && ticketBranchId !== parseInt(branchId)) {
        canApprove = false;
      }
    }

    return { canView: true, canApprove };
  } catch (error) {
    console.error("Error in checkUserCanApproveTicket:", error);
    return { canView: false, canApprove: false };
  }
}

// send pawning tickets for ticket approval
export const getPawningTicketsForApproval = async (req, res, next) => {
  try {
    const { product, date, nic, branchId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let countParams = [];
    let dataParams = [];
    let baseWhereConditions = "IFNULL(pt.Status, '0') = '0'";

    // Branch filtering with branchId filter support for head office
    if (req.isHeadBranch === true) {
      // Head office user
      if (branchId) {
        // If branchId filter is provided, show only that specific branch
        baseWhereConditions =
          "pt.Branch_idBranch = ? AND IFNULL(pt.Status, '0') = '0'";
        countParams = [parseInt(branchId)];
        dataParams = [parseInt(branchId)];
      } else {
        // No branchId filter, show all branches in the company
        // Fetch branch IDs from pool2 first (branch table is on pool2)
        const [companyBranches] = await pool2.query(
          "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
          [req.companyId],
        );

        if (companyBranches.length === 0) {
          // No branches found for this company, return empty result
          return res.status(200).json({
            success: true,
            tickets: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalItems: 0,
              itemsPerPage: limit,
              hasNextPage: false,
              hasPreviousPage: false,
            },
            approvalMode: "simple",
          });
        }

        const branchIds = companyBranches.map((b) => b.idBranch);
        const placeholders = branchIds.map(() => "?").join(",");
        baseWhereConditions = `pt.Branch_idBranch IN (${placeholders}) AND IFNULL(pt.Status, '0') = '0'`;
        countParams = [...branchIds];
        dataParams = [...branchIds];
      }
    } else {
      // Regular branch user - always show only their own branch
      baseWhereConditions =
        "pt.Branch_idBranch = ? AND IFNULL(pt.Status, '0') = '0'";
      countParams = [req.branchId];
      dataParams = [req.branchId];
    }

    // Add filter conditions
    if (product) {
      const sanitizedProduct = `%${product.replace(/[%_\\]/g, "\\$&")}%`;
      baseWhereConditions += " AND pp.Name LIKE ?";
      countParams.push(sanitizedProduct);
      dataParams.push(sanitizedProduct);
    }

    if (date) {
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
      // NIC search - first search in account center to get matching pawning customer IDs
      const sanitizedNIC = nic.replace(/[^a-zA-Z0-9]/g, "");
      const formattedNIC = formatSearchPattern(sanitizedNIC);

      const [matchingAccCustomers] = await pool2.query(
        `SELECT isPawningUserId FROM customer WHERE Nic LIKE ? AND isPawningUserId IS NOT NULL`,
        [formattedNIC],
      );

      if (matchingAccCustomers.length === 0) {
        return res.status(200).json({
          success: true,
          tickets: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
          },
          approvalMode: "simple",
        });
      }

      const pawningCusIds = matchingAccCustomers.map((c) => c.isPawningUserId);
      const cusPlaceholders = pawningCusIds.map(() => "?").join(",");
      baseWhereConditions += ` AND pt.Customer_idCustomer IN (${cusPlaceholders})`;
      countParams.push(...pawningCusIds);
      dataParams.push(...pawningCusIds);
    }

    // Check if approval ranges are configured (approval tables are in pool2)
    const [rangesCheck] = await pool2.query(
      `SELECT COUNT(*) as count FROM pawning_ticket_approval_range WHERE companyid = ?`,
      [req.companyId],
    );

    const hasApprovalRanges = rangesCheck[0].count > 0;

    // Helper function to enrich tickets with customer data from account center
    const enrichTicketsWithCustomerData = async (tickets) => {
      if (tickets.length === 0) return;

      // Get all customer IDs from tickets
      const customerIds = [
        ...new Set(
          tickets.map((t) => t.Customer_idCustomer).filter((id) => id),
        ),
      ];

      if (customerIds.length === 0) return;

      // Get accountCenterCusIds from pawning customers
      const cusPlaceholders = customerIds.map(() => "?").join(",");
      const [pawningCustomers] = await pool.query(
        `SELECT idCustomer, accountCenterCusId FROM customer WHERE idCustomer IN (${cusPlaceholders})`,
        customerIds,
      );

      const pawningToAccMap = new Map(
        pawningCustomers.map((c) => [c.idCustomer, c.accountCenterCusId]),
      );
      const accCusIds = [
        ...new Set(
          pawningCustomers.map((c) => c.accountCenterCusId).filter((id) => id),
        ),
      ];

      // Fetch customer data from account center
      let customerMap = new Map();
      if (accCusIds.length > 0) {
        const accPlaceholders = accCusIds.map(() => "?").join(",");
        const [accCustomers] = await pool2.query(
          `SELECT idCustomer, Nic FROM customer WHERE idCustomer IN (${accPlaceholders})`,
          accCusIds,
        );
        customerMap = new Map(accCustomers.map((c) => [c.idCustomer, c]));
      }

      // Add NIC to each ticket
      tickets.forEach((ticket) => {
        const accCusId = pawningToAccMap.get(ticket.Customer_idCustomer);
        const cusData = customerMap.get(accCusId);
        ticket.NIC = cusData?.Nic || null;
        delete ticket.Customer_idCustomer;
      });
    };

    // Simple approval mode
    if (!hasApprovalRanges) {
      const countQuery = `SELECT COUNT(*) AS total
                          FROM pawning_ticket pt
                   LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product 
                         WHERE ${baseWhereConditions}`;

      const paginationData = await getPaginationData(
        countQuery,
        countParams,
        page,
        limit,
      );

      let query = `SELECT pt.idPawning_Ticket, pt.Ticket_No, pt.Date_Time, pt.Maturity_Date, 
                          pt.Pawning_Advance_Amount, pt.Status, pt.Branch_idBranch,
                          pt.Customer_idCustomer, pp.Name AS ProductName
                   FROM pawning_ticket pt
            LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product
                  WHERE ${baseWhereConditions}
               ORDER BY pt.idPawning_Ticket DESC LIMIT ? OFFSET ?`;

      dataParams.push(limit, offset);
      const [tickets] = await pool.query(query, dataParams);

      console.log(
        "getPawningTicketsForApproval - Simple mode, tickets found:",
        tickets.length,
      );
      console.log("baseWhereConditions:", baseWhereConditions);

      // Enrich with customer NIC from account center
      await enrichTicketsWithCustomerData(tickets);

      // Fetch branch names from pool2 for all unique branch IDs
      if (tickets.length > 0) {
        const branchIds = [
          ...new Set(tickets.map((t) => t.Branch_idBranch).filter((id) => id)),
        ];

        if (branchIds.length > 0) {
          const placeholders = branchIds.map(() => "?").join(",");
          const [branches] = await pool2.query(
            `SELECT idBranch, Name FROM branch WHERE idBranch IN (${placeholders})`,
            branchIds,
          );

          // Create a map for quick lookup
          const branchMap = new Map(branches.map((b) => [b.idBranch, b.Name]));

          // Add branch names to tickets
          tickets.forEach((ticket) => {
            ticket.BranchName = branchMap.get(ticket.Branch_idBranch) || null;
          });
        }
      }

      return res.status(200).json({
        success: true,
        tickets: tickets || [],
        pagination: paginationData,
        approvalMode: "simple",
      });
    }

    // Multi-level approval mode
    let query = `SELECT pt.idPawning_Ticket, pt.Ticket_No, pt.Date_Time, pt.Maturity_Date, 
                        pt.Pawning_Advance_Amount, pt.Status, pt.Branch_idBranch,
                        pt.Customer_idCustomer, pp.Name AS ProductName
                 FROM pawning_ticket pt
          LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product
                WHERE ${baseWhereConditions}
             ORDER BY pt.idPawning_Ticket DESC`;

    const [allTickets] = await pool.query(query, dataParams);

    // Enrich with customer NIC from account center
    await enrichTicketsWithCustomerData(allTickets);

    // Fetch branch names from pool2 for all unique branch IDs
    if (allTickets.length > 0) {
      const branchIds = [
        ...new Set(allTickets.map((t) => t.Branch_idBranch).filter((id) => id)),
      ];

      if (branchIds.length > 0) {
        const placeholders = branchIds.map(() => "?").join(",");
        const [branches] = await pool2.query(
          `SELECT idBranch, Name FROM branch WHERE idBranch IN (${placeholders})`,
          branchIds,
        );

        // Create a map for quick lookup
        const branchMap = new Map(branches.map((b) => [b.idBranch, b.Name]));

        // Add branch names to tickets
        allTickets.forEach((ticket) => {
          ticket.BranchName = branchMap.get(ticket.Branch_idBranch) || null;
        });
      }
    }

    // Filter and enrich tickets
    const filteredTickets = [];

    for (const ticket of allTickets) {
      try {
        // PASS userId to the function
        const accessCheck = await checkUserCanApproveTicket(
          ticket.idPawning_Ticket,
          ticket.Pawning_Advance_Amount,
          ticket.Branch_idBranch,
          req.companyId,
          req.designationId,
          req.isHeadBranch,
          branchId,
          req.userId, // ADDED THIS
        );

        if (accessCheck.canView) {
          const approvalProgress = await getTicketApprovalProgress(
            ticket.idPawning_Ticket,
            ticket.Pawning_Advance_Amount,
            req.companyId,
          );

          filteredTickets.push({
            ...ticket,
            can_approve: accessCheck.canApprove,
            approval_progress: approvalProgress,
          });
        }
      } catch (error) {
        console.error(
          `Error processing ticket ${ticket.idPawning_Ticket}:`,
          error,
        );
      }
    }

    // Apply pagination
    const total = filteredTickets.length;
    const paginatedTickets = filteredTickets.slice(offset, offset + limit);

    const paginationData = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < Math.ceil(total / limit),
      hasPreviousPage: page > 1,
    };

    return res.status(200).json({
      success: true,
      tickets: paginatedTickets || [],
      pagination: paginationData,
      approvalMode: "multi-level",
    });
  } catch (error) {
    console.error("Error in getPawningTicketsForApproval:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// ticket approve
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
      const sanitizedNote = note.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      req.body.note = sanitizedNote;
    }

    const [existingTicketRow] = await pool.query(
      "SELECT Status, idPawning_Ticket, Pawning_Advance_Amount, Branch_idBranch FROM pawning_ticket WHERE idPawning_Ticket = ?",
      [ticketId],
    );

    if (existingTicketRow.length === 0) {
      return next(errorHandler(404, "No ticket found for the given ID"));
    }

    const ticket = existingTicketRow[0];

    if (req.isHeadBranch === false && ticket.Branch_idBranch !== req.branchId) {
      return next(errorHandler(403, "You don't have access to this ticket"));
    }

    if (ticket.Status !== null && ticket.Status !== "0") {
      return next(
        errorHandler(400, "Only tickets with pending status can be approved"),
      );
    }

    // Check if approval ranges are configured (approval tables are in pool2)
    const [rangesCheck] = await pool2.query(
      `SELECT COUNT(*) as count FROM pawning_ticket_approval_range WHERE companyid = ?`,
      [req.companyId],
    );

    const hasApprovalRanges = rangesCheck[0].count > 0;

    if (!hasApprovalRanges) {
      const [result] = await pool.query(
        "UPDATE pawning_ticket SET Status = '-1' WHERE idPawning_Ticket = ?",
        [ticketId],
      );

      console.log(result);

      if (result.affectedRows === 0) {
        return next(errorHandler(500, "Failed to approve the ticket"));
      }

      const [approvalResult] = await pool.query(
        "INSERT INTO ticket_has_approval (Pawning_Ticket_idPawning_Ticket, User, Date_Time, Note, Type) VALUES (?, ?, NOW(), ?, ?)",
        [ticketId, req.userId, req.body.note || null, "APPROVE"],
      );

      if (approvalResult.affectedRows === 0) {
        return next(
          errorHandler(500, "Failed to record the ticket approval action"),
        );
      }

      await createPawningTicketLogOnApprovalandLoanDisbursement(
        ticketId,
        approvalResult.insertId,
        "APPROVE-TICKET",
        req.body.note || "Ticket approved",
        req.userId,
      );

      return res.status(200).json({
        success: true,
        ticketId: ticketId,
        message: "Pawning ticket approved successfully.",
        approvalMode: "simple",
      });
    }

    // Find the approval range (approval tables are in pool2)
    const [ranges] = await pool2.query(
      `SELECT idApproval_Range 
       FROM pawning_ticket_approval_range 
       WHERE companyid = ? 
         AND start_amount <= ? 
         AND end_amount >= ?
       LIMIT 1`,
      [
        req.companyId,
        ticket.Pawning_Advance_Amount,
        ticket.Pawning_Advance_Amount,
      ],
    );

    if (ranges.length === 0) {
      return next(
        errorHandler(
          400,
          "No approval range configured for this ticket amount",
        ),
      );
    }

    const rangeId = ranges[0].idApproval_Range;

    // Get approval levels (approval tables are in pool2)
    const [levels] = await pool2.query(
      `SELECT idApprovalRangeLevel, level_name, is_head_office_level 
       FROM pawning_ticket_approval_ranges_level 
       WHERE Approval_Range_idApproval_Range = ? 
       ORDER BY idApprovalRangeLevel ASC`,
      [rangeId],
    );

    if (levels.length === 0) {
      return next(
        errorHandler(400, "No approval levels configured for this range"),
      );
    }

    // Get already approved levels (approval tables are in pool2)
    const [approvedLevels] = await pool2.query(
      `SELECT ApprovalRangeLevel_idApprovalRangeLevel 
       FROM pawning_ticket_approval 
       WHERE Pawning_Ticket_idPawning_Ticket = ? 
         AND approval_status = 1`,
      [ticketId],
    );

    const approvedLevelIds = approvedLevels.map(
      (al) => al.ApprovalRangeLevel_idApprovalRangeLevel,
    );

    let nextPendingLevel = null;
    for (const level of levels) {
      if (!approvedLevelIds.includes(level.idApprovalRangeLevel)) {
        nextPendingLevel = level;
        break;
      }
    }

    if (!nextPendingLevel) {
      return next(errorHandler(400, "All approval levels already completed"));
    }

    if (nextPendingLevel.is_head_office_level && !req.isHeadBranch) {
      return next(
        errorHandler(
          403,
          "This level requires head office approval. You don't have permission.",
        ),
      );
    }

    // Get authorized designations for this level (approval tables are in pool2)
    const [designations] = await pool2.query(
      `SELECT Designation_idDesignation 
       FROM pawning_ticket_approval_levels_designations 
       WHERE ApprovalRangeLevel_idApprovalRangeLevel = ?`,
      [nextPendingLevel.idApprovalRangeLevel],
    );

    const authorizedDesignations = designations.map(
      (d) => d.Designation_idDesignation,
    );

    if (!authorizedDesignations.includes(req.designationId)) {
      return next(
        errorHandler(
          403,
          `Your designation is not authorized to approve at level: ${nextPendingLevel.level_name}`,
        ),
      );
    }

    // Check if user already approved at this level (approval tables are in pool2)
    const [existingApproval] = await pool2.query(
      `SELECT idPawning_Ticket_Approval 
       FROM pawning_ticket_approval 
       WHERE Pawning_Ticket_idPawning_Ticket = ? 
         AND ApprovalRangeLevel_idApprovalRangeLevel = ? 
         AND approved_by = ?`,
      [ticketId, nextPendingLevel.idApprovalRangeLevel, req.userId],
    );

    if (existingApproval.length > 0) {
      return next(
        errorHandler(
          400,
          "You have already approved this ticket at this level",
        ),
      );
    }

    // Record the approval (approval tables are in pool2)
    const [approvalResult] = await pool2.query(
      `INSERT INTO pawning_ticket_approval 
       (Pawning_Ticket_idPawning_Ticket, ApprovalRangeLevel_idApprovalRangeLevel, 
        approved_by, approval_status, approval_date, remarks) 
       VALUES (?, ?, ?, 1, NOW(), ?)`,
      [
        ticketId,
        nextPendingLevel.idApprovalRangeLevel,
        req.userId,
        req.body.note || null,
      ],
    );

    if (approvalResult.affectedRows === 0) {
      return next(errorHandler(500, "Failed to record the approval"));
    }

    const allLevelsApproved = approvedLevelIds.length + 1 === levels.length;

    if (allLevelsApproved) {
      const [updateResult] = await pool.query(
        "UPDATE pawning_ticket SET Status = '-1' WHERE idPawning_Ticket = ?",
        [ticketId],
      );

      if (updateResult.affectedRows === 0) {
        return next(errorHandler(500, "Failed to update ticket status"));
      }

      const [ticketApprovalRecord] = await pool.query(
        "INSERT INTO ticket_has_approval (Pawning_Ticket_idPawning_Ticket, User, Date_Time, Note, Type) VALUES (?, ?, NOW(), ?, ?)",
        [ticketId, req.userId, req.body.note || null, "APPROVE"],
      );

      if (ticketApprovalRecord.affectedRows === 0) {
        return next(
          errorHandler(500, "Failed to record the ticket approval action"),
        );
      }

      await createPawningTicketLogOnApprovalandLoanDisbursement(
        ticketId,
        ticketApprovalRecord.insertId,
        "APPROVE-TICKET",
        "Ticket fully approved",
        req.userId,
      );
    }

    let message = `Approval recorded for level: ${nextPendingLevel.level_name}`;
    if (allLevelsApproved) {
      message = "All approval levels completed. Ticket fully approved.";
    } else {
      const remainingLevels = levels.length - (approvedLevelIds.length + 1);
      message += `. ${remainingLevels} more level(s) required.`;
    }

    res.status(200).json({
      success: true,
      ticketId: ticketId,
      message: message,
      approvalMode: "multi-level",
      levelApproved: nextPendingLevel.level_name,
      allLevelsCompleted: allLevelsApproved,
      remainingLevels: allLevelsApproved
        ? 0
        : levels.length - (approvedLevelIds.length + 1),
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

    const sanitizedNote = note.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    req.body.note = sanitizedNote;

    // Check if the ticket exists and is pending approval
    const [existingTicketRow] = await pool.query(
      "SELECT Status, idPawning_Ticket, Pawning_Advance_Amount, Branch_idBranch FROM pawning_ticket WHERE idPawning_Ticket = ?",
      [ticketId],
    );

    if (existingTicketRow.length === 0) {
      return next(errorHandler(404, "No ticket found for the given ID"));
    }

    const ticket = existingTicketRow[0];

    // Check branch access
    if (req.isHeadBranch === false && ticket.Branch_idBranch !== req.branchId) {
      return next(errorHandler(403, "You don't have access to this ticket"));
    }

    // Check if ticket is in pending status
    if (ticket.Status !== null && ticket.Status !== "0") {
      return next(
        errorHandler(400, "Only tickets with pending status can be rejected"),
      );
    }

    // Check if approval ranges are configured
    const [rangesCheck] = await pool.query(
      `SELECT COUNT(*) as count FROM pawning_ticket_approval_range WHERE companyid = ?`,
      [req.companyId],
    );

    const hasApprovalRanges = rangesCheck[0].count > 0;

    // Simple approval mode (no ranges)
    if (!hasApprovalRanges) {
      // Update the ticket status to rejected (4)
      const [result] = await pool.query(
        "UPDATE pawning_ticket SET Status = '4' WHERE idPawning_Ticket = ?",
        [ticketId],
      );

      if (result.affectedRows === 0) {
        return next(errorHandler(500, "Failed to reject the ticket"));
      }

      // Insert a record to ticket_has_approval table
      const [approvalResult] = await pool.query(
        "INSERT INTO ticket_has_approval (Pawning_Ticket_idPawning_Ticket, User, Date_Time, Note, Type) VALUES (?, ?, NOW(), ?, ?)",
        [ticketId, req.userId, req.body.note, "REJECT"],
      );

      if (approvalResult.affectedRows === 0) {
        return next(
          errorHandler(500, "Failed to record the ticket rejection action"),
        );
      }

      return res.status(200).json({
        success: true,
        ticketId: ticketId,
        message: "Pawning ticket rejected successfully.",
        approvalMode: "simple",
      });
    }

    // Multi-level approval mode (with ranges)
    // 1. Find the approval range for this ticket amount
    const [ranges] = await pool.query(
      `SELECT idApproval_Range 
       FROM pawning_ticket_approval_range 
       WHERE companyid = ? 
         AND start_amount <= ? 
         AND end_amount >= ?
       LIMIT 1`,
      [
        req.companyId,
        ticket.Pawning_Advance_Amount,
        ticket.Pawning_Advance_Amount,
      ],
    );

    if (ranges.length === 0) {
      return next(
        errorHandler(
          400,
          "No approval range configured for this ticket amount",
        ),
      );
    }

    const rangeId = ranges[0].idApproval_Range;

    // 2. Get all levels for this range
    const [levels] = await pool.query(
      `SELECT idApprovalRangeLevel, level_name, is_head_office_level 
       FROM pawning_ticket_approval_ranges_level 
       WHERE Approval_Range_idApproval_Range = ? 
       ORDER BY idApprovalRangeLevel ASC`,
      [rangeId],
    );

    if (levels.length === 0) {
      return next(
        errorHandler(400, "No approval levels configured for this range"),
      );
    }

    // 3. Get already approved levels for this ticket
    const [approvedLevels] = await pool.query(
      `SELECT ApprovalRangeLevel_idApprovalRangeLevel 
       FROM pawning_ticket_approval 
       WHERE Pawning_Ticket_idPawning_Ticket = ? 
         AND approval_status = 1`,
      [ticketId],
    );

    const approvedLevelIds = approvedLevels.map(
      (al) => al.ApprovalRangeLevel_idApprovalRangeLevel,
    );

    // 4. Find the next pending level
    let nextPendingLevel = null;
    for (const level of levels) {
      if (!approvedLevelIds.includes(level.idApprovalRangeLevel)) {
        nextPendingLevel = level;
        break;
      }
    }

    if (!nextPendingLevel) {
      return next(errorHandler(400, "All approval levels already completed"));
    }
    console.log("Next pending level for rejection:", nextPendingLevel);

    // 5. Verify user can reject at this level
    // Check if this is a head office level
    if (
      nextPendingLevel.is_head_office_level === 1 &&
      req.isHeadBranch === false
    ) {
      return next(
        errorHandler(
          403,
          "This level requires head office access. You don't have permission to reject.",
        ),
      );
    }

    // 6. Check if user's designation is authorized for this level
    const [designations] = await pool.query(
      `SELECT Designation_idDesignation 
       FROM pawning_ticket_approval_levels_designations 
       WHERE ApprovalRangeLevel_idApprovalRangeLevel = ?`,
      [nextPendingLevel.idApprovalRangeLevel],
    );

    const authorizedDesignations = designations.map(
      (d) => d.Designation_idDesignation,
    );

    if (!authorizedDesignations.includes(req.designationId)) {
      return next(
        errorHandler(
          403,
          `Your designation is not authorized to reject at level: ${nextPendingLevel.level_name}`,
        ),
      );
    }

    // 7. Record the rejection for this level
    const [rejectionResult] = await pool.query(
      `INSERT INTO pawning_ticket_approval 
       (Pawning_Ticket_idPawning_Ticket, ApprovalRangeLevel_idApprovalRangeLevel, 
        approved_by, approval_status, approval_date, remarks) 
       VALUES (?, ?, ?, 2, NOW(), ?)`, // 2 indicates rejection in pawning_ticket_approval table.
      [
        ticketId,
        nextPendingLevel.idApprovalRangeLevel,
        req.userId,
        req.body.note,
      ],
    );

    if (rejectionResult.affectedRows === 0) {
      return next(errorHandler(500, "Failed to record the rejection"));
    }

    // 8. Update ticket status to rejected (4)
    const [updateResult] = await pool.query(
      "UPDATE pawning_ticket SET Status = '4' WHERE idPawning_Ticket = ?",
      [ticketId],
    );

    if (updateResult.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update ticket status"));
    }

    // 9. Insert a record to ticket_has_approval table
    const [ticketRejectionRecord] = await pool.query(
      "INSERT INTO ticket_has_approval (Pawning_Ticket_idPawning_Ticket, User, Date_Time, Note, Type) VALUES (?, ?, NOW(), ?, ?)",
      [ticketId, req.userId, req.body.note, "REJECT"],
    );

    if (ticketRejectionRecord.affectedRows === 0) {
      return next(
        errorHandler(500, "Failed to record the ticket rejection action"),
      );
    }

    res.status(200).json({
      success: true,
      ticketId: ticketId,
      message: `Ticket rejected at level: ${nextPendingLevel.level_name}`,
      approvalMode: "multi-level",
      levelRejected: nextPendingLevel.level_name,
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
          errorHandler(400, "Invalid start_date format. Use YYYY-MM-DD"),
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
          errorHandler(400, "Invalid end_date format. Use YYYY-MM-DD"),
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
      // NIC search - first search in account center to get matching pawning customer IDs
      const sanitizedNIC = nic.replace(/[^a-zA-Z0-9]/g, "");
      const formattedNIC = formatSearchPattern(sanitizedNIC);

      const [matchingAccCustomers] = await pool2.query(
        `SELECT isPawningUserId FROM customer WHERE Nic LIKE ? AND branch_id = ? AND isPawningUserId IS NOT NULL`,
        [formattedNIC, req.branchId],
      );

      if (matchingAccCustomers.length === 0) {
        return res.status(200).json({
          success: true,
          tickets: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
        });
      }

      const pawningCusIds = matchingAccCustomers.map((c) => c.isPawningUserId);
      const cusPlaceholders = pawningCusIds.map(() => "?").join(",");
      baseWhereConditions += ` AND pt.Customer_idCustomer IN (${cusPlaceholders})`;
      countParams.push(...pawningCusIds);
      dataParams.push(...pawningCusIds);
    }

    // Build count query - no customer JOIN needed
    const countQuery = `SELECT COUNT(*) AS total
                        FROM pawning_ticket pt
                 LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product 
                       WHERE ${baseWhereConditions}`;
    const paginationData = await getPaginationData(
      countQuery,
      countParams,
      page,
      limit,
    );

    // Build main data query - customer data fetched separately from pool2
    let query = `SELECT pt.idPawning_Ticket, pt.Ticket_No, pt.Date_Time, pt.Maturity_Date, 
                        pt.Pawning_Advance_Amount, pt.Status, pt.Customer_idCustomer, 
                        c.accountCenterCusId, pp.Name AS ProductName
                  FROM pawning_ticket pt
            LEFT JOIN customer c ON pt.Customer_idCustomer = c.idCustomer
            LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product
                  WHERE ${baseWhereConditions}
               ORDER BY pt.idPawning_Ticket DESC LIMIT ? OFFSET ?`;
    dataParams.push(limit, offset);

    const [tickets] = await pool.query(query, dataParams);

    // Fetch customer details from account center
    if (tickets.length > 0) {
      const accountCenterCusIds = [
        ...new Set(tickets.map((t) => t.accountCenterCusId).filter((id) => id)),
      ];

      let customerMap = new Map();
      if (accountCenterCusIds.length > 0) {
        const cusPlaceholders = accountCenterCusIds.map(() => "?").join(",");
        const [accCustomers] = await pool2.query(
          `SELECT idCustomer, First_Name, Last_Name, Nic, Contact_No FROM customer WHERE idCustomer IN (${cusPlaceholders})`,
          accountCenterCusIds,
        );

        for (const cus of accCustomers) {
          customerMap.set(cus.idCustomer, cus);
        }
      }

      // Add customer info to tickets
      tickets.forEach((ticket) => {
        const cusData = customerMap.get(ticket.accountCenterCusId);
        ticket.Full_name = cusData
          ? cusData.First_Name && cusData.Last_Name
            ? `${cusData.First_Name} ${cusData.Last_Name}`
            : cusData.First_Name || cusData.Last_Name || null
          : null;
        ticket.NIC = cusData?.Nic || null;
        ticket.Mobile_No = cusData?.Contact_No || null;

        // Clean up internal fields
        delete ticket.Customer_idCustomer;
        delete ticket.accountCenterCusId;
      });
    }

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
  let connection2;
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
    const [fromAccount] = await pool2.query(
      "SELECT idAccounting_Accounts, Account_Type, Account_Balance, Cashier_idCashier, Branch_idBranch FROM accounting_accounts WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?",
      [fromAccountId, req.branchId],
    );

    if (fromAccount.length === 0) {
      return next(errorHandler(404, "From Account not found"));
    }

    // Check if the ticket exists and is approved
    const [existingTicketRow] = await pool.query(
      "SELECT Status,idPawning_Ticket,Pawning_Advance_Amount FROM pawning_ticket WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [ticketId, req.branchId],
    );

    if (existingTicketRow.length === 0) {
      return next(errorHandler(404, "No ticket found for the given ID"));
    }

    // Check if ticket is already active or in different status
    const currentStatus = existingTicketRow[0].Status;
    if (currentStatus !== "-1") {
      return next(
        errorHandler(400, "Only tickets with approved status can be activated"),
      );
    }

    const ticketIdToUpdate = existingTicketRow[0].idPawning_Ticket;

    // check if the disbursement amount is not more than the approved advance amount
    if (amount > parseFloat(existingTicketRow[0].Pawning_Advance_Amount)) {
      return next(
        errorHandler(
          400,
          "Disbursement amount cannot be more than the approved advance amount",
        ),
      );
    }

    // check if the account has sufficient balance
    if (amount > parseFloat(fromAccount[0].Account_Balance)) {
      return next(
        errorHandler(400, "Insufficient balance in the selected account"),
      );
    }

    // begin transaction
    connection = await pool.getConnection();
    connection2 = await pool2.getConnection();

    await connection.beginTransaction();
    await connection2.beginTransaction();

    // check if from Account is either cashier account or not
    if (fromAccount[0].Account_Type === "Cashier") {
      // check if this user is assigned to this cashier account
      if (
        fromAccount[0].Cashier_idCashier !== req.userId ||
        fromAccount[0].Branch_idBranch !== req.branchId
      ) {
        await connection.rollback();

        connection.release();
        connection2.release();
        await connection2.rollback();
        return next(
          errorHandler(
            403,
            "You are not authorized to use this cashier account",
          ),
        );
      }

      // Update the ticket status to active (1)
      const [result] = await connection.query(
        "UPDATE pawning_ticket SET Status = '1' WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
        [ticketIdToUpdate, req.branchId],
      );

      const balanceAfterDisbursement = parseFloat(
        fromAccount[0].Account_Balance - amount,
      );

      // deduct the amount from the cashier account balance
      const [updateAccountResult] = await connection2.query(
        "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ? AND Branch_idBranch = ? AND Cashier_idCashier = ?",
        [balanceAfterDisbursement, fromAccountId, req.branchId, req.userId],
      );

      if (result.affectedRows === 0 || updateAccountResult.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        return next(errorHandler(500, "Failed to activate the ticket"));
      }

      // insert a credit log to accounting accounting logs
      const [accountingLogResult] = await connection2.query(
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
        ],
      );
      // now get the Pawn Loan Receivable account that is linked to the branch
      const [pawnLoanReceivableAccount] = await connection2.query(
        "SELECT idAccounting_Accounts FROM accounting_accounts WHERE Account_Type = 'Pawn Loan Receivable' AND Branch_idBranch = ? AND Group_Of_Type = 'Assets'",
        [req.branchId],
      );
      if (pawnLoanReceivableAccount.length === 0) {
        await connection.rollback();
        connection.release();
        connection2.release();
        await connection2.rollback();
        return next(
          errorHandler(500, "Pawn Loan Receivable account not found"),
        );
      }
      // now add a debit entry to the Pawn Loan Receivable account
      const [addDebitEntryResult] = await connection2.query(
        "INSERT INTO accounting_accounts_log (Accounting_Accounts_idAccounting_Accounts, Date_Time, Type, Description, Debit, Credit, Balance, Contra_Account, User_idUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          pawnLoanReceivableAccount[0].idAccounting_Accounts,
          new Date(),
          "Ticket Loan Disbursement",
          `Loan disbursement for ticket #${ticketIdToUpdate}`,
          amount,
          0,
          balanceAfterDisbursement,
          null,
          req.userId,
        ],
      );
      if (addDebitEntryResult.affectedRows === 0) {
        await connection.rollback();
        connection.release();
        connection2.release();
        await connection2.rollback();
        return next(
          errorHandler(
            500,
            "Failed to add debit entry to Pawn Loan Receivable account",
          ),
        );
      }
    } else {
      // check if the specific branch has the permission to use non-cashier accounts for disbursements
      if (fromAccount[0].Branch_idBranch !== req.branchId) {
        await connection.rollback();
        connection.release();
        connection2.release();
        await connection2.rollback();
        return next(
          errorHandler(
            403,
            "You are not authorized to use this account from this branch",
          ),
        );
      }

      // Update the ticket status to active (1)
      const [result] = await connection.query(
        "UPDATE pawning_ticket SET Status = '1' WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
        [ticketIdToUpdate, req.branchId],
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        await connection2.rollback();
        connection.release();
        connection2.release();
        return next(errorHandler(500, "Failed to activate the ticket"));
      }

      const balanceAfterDisbursement = parseFloat(
        fromAccount[0].Account_Balance - amount,
      );
      // deduct the amount from the account balance (accounting_accounts is in pool2)
      const [updateAccountResult] = await connection2.query(
        "UPDATE accounting_accounts SET Account_Balance = ? WHERE idAccounting_Accounts = ? AND Branch_idBranch = ?",
        [balanceAfterDisbursement, fromAccountId, req.branchId],
      );

      if (updateAccountResult.affectedRows === 0) {
        await connection.rollback();
        await connection2.rollback();
        connection.release();
        connection2.release();
        return next(errorHandler(500, "Failed to update account balance"));
      }

      // insert a credit log to accounting accounting logs
      const [accountingLogResult] = await connection2.query(
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
        ],
      );
    }

    // create a log in ticket log for loan disbursement action
    await createPawningTicketLogOnApprovalandLoanDisbursement(
      existingTicketRow[0].idPawning_Ticket,
      null,
      "LOAN-DISBURSEMENT",
      "Ticket activated and loan disbursed",
      req.userId,
    );

    // Commit both transactions first, then release connections
    await connection.commit();
    await connection2.commit();
    connection.release();
    connection2.release();
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
    if (connection2) {
      await connection2.rollback();
      connection2.release();
    }
    console.error("Error in activatePawningTicket:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// send active (1) pawning tickets
export const sendActiveTickets = async (req, res, next) => {
  try {
    const { product, start_date, end_date, nic, branchId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Initialize parameters arrays
    let countParams = [];
    let dataParams = [];

    // Build base WHERE conditions for both count and data queries
    let baseWhereConditions = "pt.Status = '1'";

    // Handle branch filtering
    if (req.isHeadBranch === true && branchId) {
      // Head branch filtering by specific branch - simplified approach
      baseWhereConditions = "pt.Branch_idBranch = ? AND pt.Status = '1'";
      countParams = [branchId];
      dataParams = [branchId];
    } else if (req.isHeadBranch === true) {
      // Head branch - show all branches from company
      // Fetch branch IDs from pool2 first (branch table is on pool2)
      const [companyBranches] = await pool2.query(
        "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
        [req.companyId],
      );

      if (companyBranches.length === 0) {
        // No branches found, return empty result
        return res.status(200).json({
          success: true,
          tickets: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }

      const branchIds = companyBranches.map((b) => b.idBranch);
      const placeholders = branchIds.map(() => "?").join(",");
      baseWhereConditions = `pt.Status = '1' AND pt.Branch_idBranch IN (${placeholders})`;
      countParams = [...branchIds];
      dataParams = [...branchIds];
    } else {
      // Regular branch - only show tickets from this branch
      baseWhereConditions = "pt.Branch_idBranch = ? AND pt.Status = '1'";
      countParams = [req.branchId];
      dataParams = [req.branchId];
    }

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
          errorHandler(400, "Invalid start_date format. Use YYYY-MM-DD"),
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
          errorHandler(400, "Invalid end_date format. Use YYYY-MM-DD"),
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
      // NIC search - first search in account center to get matching pawning customer IDs
      const sanitizedNIC = nic.replace(/[^a-zA-Z0-9]/g, "");
      const formattedNIC = formatSearchPattern(sanitizedNIC);

      const [matchingAccCustomers] = await pool2.query(
        `SELECT isPawningUserId FROM customer WHERE Nic LIKE ? AND isPawningUserId IS NOT NULL`,
        [formattedNIC],
      );

      if (matchingAccCustomers.length === 0) {
        return res.status(200).json({
          success: true,
          tickets: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
        });
      }

      const pawningCusIds = matchingAccCustomers.map((c) => c.isPawningUserId);
      const cusPlaceholders = pawningCusIds.map(() => "?").join(",");
      baseWhereConditions += ` AND pt.Customer_idCustomer IN (${cusPlaceholders})`;
      countParams.push(...pawningCusIds);
      dataParams.push(...pawningCusIds);
    }

    // Build count query - no customer JOIN needed
    const countQuery = `SELECT COUNT(*) AS total
                        FROM pawning_ticket pt
                 LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product 
                       WHERE ${baseWhereConditions}`;

    const paginationData = await getPaginationData(
      countQuery,
      countParams,
      page,
      limit,
    );

    // Build main data query - customer data fetched separately from pool2
    let query = `SELECT pt.idPawning_Ticket, pt.Ticket_No, pt.Date_Time, pt.Maturity_Date, 
                        pt.Pawning_Advance_Amount, pt.Status, pt.Branch_idBranch, 
                        pt.Customer_idCustomer, c.accountCenterCusId, pp.Name AS ProductName
                 FROM pawning_ticket pt
            LEFT JOIN customer c ON pt.Customer_idCustomer = c.idCustomer
            LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product
                 WHERE ${baseWhereConditions}
            ORDER BY pt.idPawning_Ticket DESC LIMIT ? OFFSET ?`;

    dataParams.push(limit, offset);

    const [tickets] = await pool.query(query, dataParams);

    // Fetch customer details from account center and branch names from pool2
    if (tickets.length > 0) {
      const accountCenterCusIds = [
        ...new Set(tickets.map((t) => t.accountCenterCusId).filter((id) => id)),
      ];
      const branchIds = [
        ...new Set(tickets.map((t) => t.Branch_idBranch).filter((id) => id)),
      ];

      // Fetch customer data from account center
      let customerMap = new Map();
      if (accountCenterCusIds.length > 0) {
        const cusPlaceholders = accountCenterCusIds.map(() => "?").join(",");
        const [accCustomers] = await pool2.query(
          `SELECT idCustomer, First_Name, Last_Name, Nic, Contact_No FROM customer WHERE idCustomer IN (${cusPlaceholders})`,
          accountCenterCusIds,
        );
        for (const cus of accCustomers) {
          customerMap.set(cus.idCustomer, cus);
        }
      }

      // Fetch branch names
      let branchMap = new Map();
      if (branchIds.length > 0) {
        const placeholders = branchIds.map(() => "?").join(",");
        const [branches] = await pool2.query(
          `SELECT idBranch, Name FROM branch WHERE idBranch IN (${placeholders})`,
          branchIds,
        );
        branchMap = new Map(branches.map((b) => [b.idBranch, b.Name]));
      }

      // Add customer and branch info to tickets
      tickets.forEach((ticket) => {
        const cusData = customerMap.get(ticket.accountCenterCusId);
        ticket.Full_name = cusData
          ? cusData.First_Name && cusData.Last_Name
            ? `${cusData.First_Name} ${cusData.Last_Name}`
            : cusData.First_Name || cusData.Last_Name || null
          : null;
        ticket.NIC = cusData?.Nic || null;
        ticket.Mobile_No = cusData?.Contact_No || null;
        ticket.BranchName = branchMap.get(ticket.Branch_idBranch) || null;

        // Clean up internal fields
        delete ticket.Branch_idBranch;
        delete ticket.Customer_idCustomer;
        delete ticket.accountCenterCusId;
      });
    }

    return res.status(200).json({
      success: true,
      tickets: tickets || [],
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error in sendActiveTickets:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// send settled (2) pawning tickets
export const sendSettledTickets = async (req, res, next) => {
  try {
    const { product, start_date, end_date, nic, branchId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Initialize parameters arrays
    let countParams = [];
    let dataParams = [];

    // Build base WHERE conditions for both count and data queries
    let baseWhereConditions = "pt.Status = '2'";

    // Handle branch filtering
    if (req.isHeadBranch === true && branchId) {
      // Head branch filtering by specific branch
      baseWhereConditions = "pt.Branch_idBranch = ? AND pt.Status = '2'";
      countParams = [branchId];
      dataParams = [branchId];
    } else if (req.isHeadBranch === true) {
      // Head branch - show all branches from company
      // Fetch branch IDs from pool2 first (branch table is on pool2)
      const [companyBranches] = await pool2.query(
        "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
        [req.companyId],
      );

      if (companyBranches.length === 0) {
        // No branches found, return empty result
        return res.status(200).json({
          success: true,
          tickets: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }

      const branchIds = companyBranches.map((b) => b.idBranch);
      const placeholders = branchIds.map(() => "?").join(",");
      baseWhereConditions = `pt.Status = '2' AND pt.Branch_idBranch IN (${placeholders})`;
      countParams = [...branchIds];
      dataParams = [...branchIds];
    } else {
      // Regular branch - only show tickets from this branch
      baseWhereConditions = "pt.Branch_idBranch = ? AND pt.Status = '2'";
      countParams = [req.branchId];
      dataParams = [req.branchId];
    }

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
          errorHandler(400, "Invalid start_date format. Use YYYY-MM-DD"),
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
          errorHandler(400, "Invalid end_date format. Use YYYY-MM-DD"),
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
      // NIC search - first search in account center to get matching pawning customer IDs
      const sanitizedNIC = nic.replace(/[^a-zA-Z0-9]/g, "");
      const formattedNIC = formatSearchPattern(sanitizedNIC);

      const [matchingAccCustomers] = await pool2.query(
        `SELECT isPawningUserId FROM customer WHERE Nic LIKE ? AND isPawningUserId IS NOT NULL`,
        [formattedNIC],
      );

      if (matchingAccCustomers.length === 0) {
        return res.status(200).json({
          success: true,
          tickets: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
        });
      }

      const pawningCusIds = matchingAccCustomers.map((c) => c.isPawningUserId);
      const cusPlaceholders = pawningCusIds.map(() => "?").join(",");
      baseWhereConditions += ` AND pt.Customer_idCustomer IN (${cusPlaceholders})`;
      countParams.push(...pawningCusIds);
      dataParams.push(...pawningCusIds);
    }

    // Build count query - no customer JOIN needed
    const countQuery = `SELECT COUNT(*) AS total
                        FROM pawning_ticket pt
                 LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product 
                       WHERE ${baseWhereConditions}`;

    const paginationData = await getPaginationData(
      countQuery,
      countParams,
      page,
      limit,
    );

    // Build main data query - customer data fetched separately from pool2
    let query = `SELECT pt.idPawning_Ticket, pt.Ticket_No, pt.Date_Time, pt.Maturity_Date, 
                        pt.Pawning_Advance_Amount, pt.Status, pt.Branch_idBranch, 
                        pt.Customer_idCustomer, c.accountCenterCusId, pp.Name AS ProductName
                 FROM pawning_ticket pt
            LEFT JOIN customer c ON pt.Customer_idCustomer = c.idCustomer
            LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product
                 WHERE ${baseWhereConditions}
            ORDER BY pt.idPawning_Ticket DESC LIMIT ? OFFSET ?`;

    dataParams.push(limit, offset);

    const [tickets] = await pool.query(query, dataParams);

    // Fetch customer details from account center and branch names from pool2
    if (tickets.length > 0) {
      const accountCenterCusIds = [
        ...new Set(tickets.map((t) => t.accountCenterCusId).filter((id) => id)),
      ];
      const branchIds = [
        ...new Set(tickets.map((t) => t.Branch_idBranch).filter((id) => id)),
      ];

      // Fetch customer data from account center
      let customerMap = new Map();
      if (accountCenterCusIds.length > 0) {
        const cusPlaceholders = accountCenterCusIds.map(() => "?").join(",");
        const [accCustomers] = await pool2.query(
          `SELECT idCustomer, First_Name, Last_Name, Nic, Contact_No FROM customer WHERE idCustomer IN (${cusPlaceholders})`,
          accountCenterCusIds,
        );
        for (const cus of accCustomers) {
          customerMap.set(cus.idCustomer, cus);
        }
      }

      // Fetch branch names
      let branchMap = new Map();
      if (branchIds.length > 0) {
        const placeholders = branchIds.map(() => "?").join(",");
        const [branches] = await pool2.query(
          `SELECT idBranch, Name FROM branch WHERE idBranch IN (${placeholders})`,
          branchIds,
        );
        branchMap = new Map(branches.map((b) => [b.idBranch, b.Name]));
      }

      // Add customer and branch info to tickets
      tickets.forEach((ticket) => {
        const cusData = customerMap.get(ticket.accountCenterCusId);
        ticket.Full_name = cusData
          ? cusData.First_Name && cusData.Last_Name
            ? `${cusData.First_Name} ${cusData.Last_Name}`
            : cusData.First_Name || cusData.Last_Name || null
          : null;
        ticket.NIC = cusData?.Nic || null;
        ticket.Mobile_No = cusData?.Contact_No || null;
        ticket.BranchName = branchMap.get(ticket.Branch_idBranch) || null;

        // Clean up internal fields
        delete ticket.Branch_idBranch;
        delete ticket.Customer_idCustomer;
        delete ticket.accountCenterCusId;
      });
    }

    return res.status(200).json({
      success: true,
      tickets: tickets || [],
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error in sendSettledTickets:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// send ticket which status '1' or '-1' for ticket print after ticket approve or ticket renewal (-1 after ticket approve and after renewal ticket goes to 1 which is active state)
export const sendTicketsForPrinting = async (req, res, next) => {
  try {
    const { product, start_date, end_date, nic, print_status, branchId } =
      req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Initialize parameters arrays
    let countParams = [];
    let dataParams = [];

    // Build base WHERE conditions for both count and data queries
    let baseWhereConditions = "(pt.Status = '1' OR pt.Status = '-1')";

    // Handle branch filtering
    if (req.isHeadBranch === true && branchId) {
      // Head branch filtering by specific branch - need to verify branch belongs to company
      // Fetch company branches from pool2 to verify
      const [companyBranches] = await pool2.query(
        "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
        [req.companyId],
      );

      const companyBranchIds = companyBranches.map((b) => b.idBranch);

      // Verify that the requested branchId belongs to this company
      if (!companyBranchIds.includes(parseInt(branchId))) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this branch",
        });
      }

      baseWhereConditions =
        "pt.Branch_idBranch = ? AND (pt.Status = '1' OR pt.Status = '-1')";
      countParams = [branchId];
      dataParams = [branchId];
    } else if (req.isHeadBranch === true) {
      // Head branch - show all branches from company
      // Fetch branch IDs from pool2 first (branch table is on pool2)
      const [companyBranches] = await pool2.query(
        "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
        [req.companyId],
      );

      if (companyBranches.length === 0) {
        // No branches found, return empty result
        return res.status(200).json({
          success: true,
          tickets: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        });
      }

      const branchIds = companyBranches.map((b) => b.idBranch);
      const placeholders = branchIds.map(() => "?").join(",");
      baseWhereConditions = `pt.Branch_idBranch IN (${placeholders}) AND (pt.Status = '1' OR pt.Status = '-1')`;
      countParams = [...branchIds];
      dataParams = [...branchIds];
    } else {
      // Regular branch - only show tickets from this branch
      baseWhereConditions =
        "pt.Branch_idBranch = ? AND (pt.Status = '1' OR pt.Status = '-1')";
      countParams = [req.branchId];
      dataParams = [req.branchId];
    }

    // Add print status filter
    if (print_status) {
      if (print_status === "0") {
        baseWhereConditions += " AND pt.Print_Status = '0'";
      } else if (print_status === "1") {
        baseWhereConditions += " AND pt.Print_Status = '1'";
      }
    }

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
          errorHandler(400, "Invalid start_date format. Use YYYY-MM-DD"),
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
          errorHandler(400, "Invalid end_date format. Use YYYY-MM-DD"),
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
      // NIC search needs to be handled separately - first search in account center
      // then get matching pawning customer IDs
      const sanitizedNIC = nic.replace(/[^a-zA-Z0-9]/g, "");
      const formattedNIC = formatSearchPattern(sanitizedNIC);

      // Search for matching customers in account center
      const [matchingAccCustomers] = await pool2.query(
        `SELECT isPawningUserId FROM customer WHERE Nic LIKE ? AND branch_id = ? AND isPawningUserId IS NOT NULL`,
        [formattedNIC, req.branchId],
      );

      if (matchingAccCustomers.length === 0) {
        return res.status(200).json({
          success: true,
          tickets: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
        });
      }

      const pawningCusIds = matchingAccCustomers.map((c) => c.isPawningUserId);
      const cusPlaceholders = pawningCusIds.map(() => "?").join(",");
      baseWhereConditions += ` AND pt.Customer_idCustomer IN (${cusPlaceholders})`;
      countParams.push(...pawningCusIds);
      dataParams.push(...pawningCusIds);
    }

    // Build count query - no customer JOIN needed
    const countQuery = `SELECT COUNT(*) AS total
                        FROM pawning_ticket pt
                 LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product 
                       WHERE ${baseWhereConditions}`;

    const paginationData = await getPaginationData(
      countQuery,
      countParams,
      page,
      limit,
    );

    // Determine if any search filters are applied
    const hasSearchFilters = product || start_date || end_date || nic;

    // Choose ordering based on whether search filters are applied
    const orderBy = hasSearchFilters
      ? "ORDER BY pt.idPawning_Ticket DESC"
      : "ORDER BY pt.updated_at DESC, pt.idPawning_Ticket DESC";

    // Build main data query - customer data fetched separately from pool2
    let query = `SELECT pt.idPawning_Ticket, pt.Ticket_No, pt.Date_Time, pt.Maturity_Date, 
                        pt.Pawning_Advance_Amount, pt.Status, pt.Print_Status, pt.Branch_idBranch,
                        pt.Customer_idCustomer, c.accountCenterCusId, pp.Name AS ProductName
                 FROM pawning_ticket pt
            LEFT JOIN customer c ON pt.Customer_idCustomer = c.idCustomer
            LEFT JOIN pawning_product pp ON pt.Pawning_Product_idPawning_Product = pp.idPawning_Product
                 WHERE ${baseWhereConditions}
                 ${orderBy} LIMIT ? OFFSET ?`;

    dataParams.push(limit, offset);

    const [tickets] = await pool.query(query, dataParams);

    // Fetch customer details from account center for all tickets
    if (tickets.length > 0) {
      const accountCenterCusIds = [
        ...new Set(tickets.map((t) => t.accountCenterCusId).filter((id) => id)),
      ];

      let customerMap = new Map();
      if (accountCenterCusIds.length > 0) {
        const cusPlaceholders = accountCenterCusIds.map(() => "?").join(",");
        const [accCustomers] = await pool2.query(
          `SELECT idCustomer, First_Name, Last_Name, Nic, Contact_No FROM customer WHERE idCustomer IN (${cusPlaceholders})`,
          accountCenterCusIds,
        );

        for (const cus of accCustomers) {
          customerMap.set(cus.idCustomer, cus);
        }
      }

      // Fetch branch names from pool2 for all unique branch IDs
      const branchIds = [
        ...new Set(tickets.map((t) => t.Branch_idBranch).filter((id) => id)),
      ];

      let branchMap = new Map();
      if (branchIds.length > 0) {
        const placeholders = branchIds.map(() => "?").join(",");
        const [branches] = await pool2.query(
          `SELECT idBranch, Name FROM branch WHERE idBranch IN (${placeholders})`,
          branchIds,
        );
        branchMap = new Map(branches.map((b) => [b.idBranch, b.Name]));
      }

      // Add customer and branch info to tickets
      tickets.forEach((ticket) => {
        const cusData = customerMap.get(ticket.accountCenterCusId);
        ticket.Full_name = cusData
          ? cusData.First_Name && cusData.Last_Name
            ? `${cusData.First_Name} ${cusData.Last_Name}`
            : cusData.First_Name || cusData.Last_Name || null
          : null;
        ticket.NIC = cusData?.Nic || null;
        ticket.Mobile_No = cusData?.Contact_No || null;
        ticket.BranchName = branchMap.get(ticket.Branch_idBranch) || null;

        // Clean up internal fields
        delete ticket.Branch_idBranch;
        delete ticket.Customer_idCustomer;
        delete ticket.accountCenterCusId;
      });
    }

    return res.status(200).json({
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
      [ticketId, req.branchId],
    );

    if (existingTicketRow.length === 0) {
      return next(errorHandler(404, "No ticket found for the given ID"));
    }

    // Update the Print_Status to '1'
    const [result] = await pool.query(
      "UPDATE pawning_ticket SET Print_Status = '1' WHERE idPawning_Ticket = ? AND Branch_idBranch = ?",
      [ticketId, req.branchId],
    );

    if (result.affectedRows === 0) {
      return next(
        errorHandler(500, "Failed to update the ticket print status"),
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

    const [ticketFormat] = await pool2.query(
      "SELECT * FROM pawning_ticket_format WHERE company_id = ?",
      [req.companyId],
    );

    if (ticketFormat.length === 0) {
      return next(
        errorHandler(404, "Pawning ticket number format not configured"),
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
          const [branch] = await pool2.query(
            "SELECT Branch_Code FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
            [req.branchId, req.companyId],
          );

          if (branch.length === 0) {
            return next(errorHandler(404, "Branch not found"));
          }

          ticketNo += branch[0].Branch_Code || "00";
        }

        if (part === "Branch's Customer Count") {
          const [customerCount] = await pool.query(
            "SELECT COUNT(*) AS count FROM customer WHERE Branch_idBranch = ?",
            [req.branchId],
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
            const [branches] = await pool2.query(
              "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
              [req.companyId],
            );

            if (branches.length === 0) {
              return next(
                errorHandler(404, "No branches found for the company"),
              );
            }

            // loop through each branch and count ticket's
            for (const branch of branches) {
              const [branchTicketCount] = await pool.query(
                "SELECT COUNT(*) AS count FROM pawning_ticket WHERE Branch_idBranch = ?",
                [branch.idBranch],
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
      const [branches] = await pool2.query(
        "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
        [req.companyId],
      );

      if (branches.length === 0) {
        return next(errorHandler(404, "No branches found for the company"));
      }

      // loop through each branch and count ticket's
      for (const branch of branches) {
        const [branchTicketCount] = await pool.query(
          "SELECT COUNT(*) AS count FROM pawning_ticket WHERE Branch_idBranch = ?",
          [branch.idBranch],
        );
        ticketCount += branchTicketCount[0].count;
      }

      ticketNo = ticketCount;

      if (ticketNo === 0) {
        ticketNo = 1; // first ticket
      }
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
      [req.companyId],
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

// get company branches for ticket page filters
export const getCompanyBranchesForTicketFilters = async (req, res, next) => {
  try {
    const [branches] = await pool2.query(
      "SELECT idBranch, Name, Branch_Code FROM branch WHERE Company_idCompany = ? AND Branch_Code NOT LIKE CONCAT('%', ?, '-HO') ORDER BY Name ASC",
      [req.companyId, req.companyId],
    );

    return res.status(200).json({
      success: true,
      branches: branches,
    });
  } catch (error) {
    console.error("Error in getCompanyBranchesForTicketFilters:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
