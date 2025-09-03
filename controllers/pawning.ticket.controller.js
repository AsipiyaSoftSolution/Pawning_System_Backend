import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";
import { uploadImage } from "../utils/cloudinary.js";
// Create Pawning Ticket
export const createPawningTicket = async (req, res, next) => {
  try {
    // net weight have to be equal or less than gross weight
    // pawning value have to equal or less than table value
    const { data } = req.body;
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
      "lateCharge",
      "interestApplyOn",
      "images",
      "ticketArticles",
    ];
    const requiredFieldsForTicketArticles = [
      // data for pawning ticket article table
      "articleType",
      "articleCategory",
      "articleCondition",
      "caratage",
      "noOfItems",
      "acidTestStatus",
      "grossWeight",
      "dmReading",
      "netWeight",
      "assessedValue",
      "declaredValue",
      "image",
    ];

    // Check for missing required fields in the main data object
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
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

    // check if pawning advance is less than or equal to all ticketArticles's declaredValue
    const totalDeclaredValue = data.ticketArticles.reduce(
      (sum, article) => sum + parseFloat(article.declaredValue || 0),
      0
    );
    if (parseFloat(data.pawningAdvance) > totalDeclaredValue) {
      return next(
        400,
        "Pawning advance cannot be greater than total declared value of articles"
      );
    }

    // Insert into pawning_ticket table
    const [result] = await pool.query(
      "INSERT INTO pawning_ticket (Ticket_No,SEQ_No,Date_Time,Customer_idCustomer,Period_Type,Period,Maturity_Date,Gross_Weight,Assessed_Value,Net_Weight,Payable_Value,Pawning_Advance,Interest_Rate,Service_charge_Amount,Late_charge_Presentage,Interest_apply_on,User_idUser,Branch_idBranch,Pawning_Product_idPawning_Product) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        data.ticketNo,
        data.grantSeqNo,
        data.grantDate,
        data.customerId,
        data.periodType,
        data.period,
        data.maturityDate,
        data.grossWeight,
        data.assessedValue,
        data.netWeight,
        data.payableValue,
        data.pawningAdvance,
        data.interestRate,
        data.serviceCharge,
        data.lateCharge,
        data.interestApplyOn,
        req.userId,
        ,
        req.branchId,
        data.productId,
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
            "INSERT INTO ticket_article_images (File_Path, Pawning_Ticket_idPawning_Ticket) VALUES (?,?)",
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
      // upload article image if exists
      if (article.image) {
        try {
          const secure_url = await uploadImage(article.image);
          article.image = secure_url || null;
        } catch (error) {
          throw error;
        }
      }

      if (article.netWeight > article.grossWeight) {
        return next(
          errorHandler(400, "Net weight cannot be greater than Gross weight")
        );
      }
      const [result] = await pool.query(
        "INSERT INTO ticket_articles (Article_category,Article_Condition,Caratage,No_Of_Items,Gross_Weight,Acid_Test_Status,DM_Reading,Net_Weight,Assessed_Value,Declared_Value,Pawning_Ticket_idPawning_Ticket,Image) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          article.articleCategory,
          article.articleCondition,
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

    res.status(201).json({
      success: true,
      message: "Pawning ticket created successfully",
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
      "SELECT COUNT(*) AS count FROM pawning_ticket WHERE created_at = CURDATE()"
    );

    res.status(200).json({
      success: true,
      grandSeqNo: result[0].count + 1,
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

    if (customer.length === 0) {
      return next(errorHandler(404, "Customer not found"));
    }
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
    if (Number(interestMethod) === 1) {
      // Filter by period between min and max period
      const periodNum = Number(period);
      filteredItem = productItems.find((item) => {
        const min = Number(item.Minimum_Period);
        const max = Number(item.Maximum_Period);
        return periodNum >= min && periodNum <= max;
      });
    } else if (Number(interestMethod) === 0) {
      // Filter by amount between min and max amount
      const amountNum = Number(amount);
      filteredItem = productItems.find((item) => {
        const min = Number(item.Minimum_Amount);
        const max = Number(item.Maximum_Amount);
        return amountNum >= min && amountNum <= max;
      });
    } else {
      return next(errorHandler(400, "Invalid interest method"));
    }

    if (!filteredItem) {
      return res.status(404).json({
        success: false,
        message: "No matching product plan found for the given criteria",
      });
    }

    // Calculate caratageData for carats 16 to 24
    const caratages = [16, 17, 18, 19, 20, 21, 22, 23, 24];
    const baseAmount = Number(filteredItem.Amount_For_22_Caratage);
    const caratageData = caratages.map((carat) => ({
      carat,
      amount: parseFloat((baseAmount * (carat / 22)).toFixed(2)),
    }));

    // Always return only the amount for the requested caratage
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
    });
  } catch (error) {
    console.error("Error in sendCaratageAmountForSelectedProductItem:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
