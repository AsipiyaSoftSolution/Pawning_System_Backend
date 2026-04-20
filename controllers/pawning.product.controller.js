import { errorHandler } from "../utils/errorHandler.js";
import { pool, pool2 } from "../utils/db.js";
import { getPaginationData, getCompanyBranches } from "../utils/helper.js";

// Function to get user  data by userId and companyId to display last updated user info when fetching pawning product details
const returnUserData = async (userId, companyId) => {
  try {
    if (!userId || !companyId) return null;
    const [user] = await pool2.query(
      "SELECT idUser,Full_name,Email FROM user WHERE idUser = ? AND Company_idCompany = ?",
      [userId, companyId],
    );
    if (user.length === 0) return null;
    return user[0];
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new Error("Failed to fetch user data", error);
  }
};

const extractEarlySettlementStagePayload = (source = {}) => {
  const toNullableInt = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const parsed = parseInt(String(value), 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const toNullableFloat = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const parsed = parseFloat(String(value));
    return Number.isNaN(parsed) ? null : parsed;
  };

  const toNullableEndDay = (value) => {
    if (value === undefined || value === null || value === "") return null;
    if (String(value).toLowerCase() === "to maturity date") {
      return "to maturity date";
    }
    return toNullableInt(value);
  };

  const toNullableString = (value) => {
    if (value === undefined || value === null || value === "") return null;
    return String(value);
  };

  return {
    stage1StartDay: toNullableInt(source.earlySettlementStage1StartDay),
    stage1EndDay: toNullableEndDay(source.earlySettlementStage1EndDay),
    stage1Value: toNullableFloat(source.earlySettlementStage1Value),
    stage1ValueType: toNullableString(source.earlySettlementStage1ValueType),
    stage2StartDay: toNullableInt(source.earlySettlementStage2StartDay),
    stage2EndDay: toNullableEndDay(source.earlySettlementStage2EndDay),
    stage2Value: toNullableFloat(source.earlySettlementStage2Value),
    stage2ValueType: toNullableString(source.earlySettlementStage2ValueType),
    stage3StartDay: toNullableInt(source.earlySettlementStage3StartDay),
    stage3EndDay: toNullableEndDay(source.earlySettlementStage3EndDay),
    stage3Value: toNullableFloat(source.earlySettlementStage3Value),
    stage3ValueType: toNullableString(source.earlySettlementStage3ValueType),
    stage4StartDay: toNullableInt(source.earlySettlementStage4StartDay),
    stage4EndDay: toNullableEndDay(source.earlySettlementStage4EndDay),
    stage4Value: toNullableFloat(source.earlySettlementStage4Value),
    stage4ValueType: toNullableString(source.earlySettlementStage4ValueType),
    effectType: toNullableString(source.earlySettlementEffectType),
  };
};

// Get a specific pawning product's all data by ID
export const getPawningProductById = async (req, res, next) => {
  try {
    const idPawning_Product = req.params.productId || req.params.id;
    console.log("Fetching pawning product with ID:", idPawning_Product);

    if (!idPawning_Product) {
      return next(errorHandler(400, "Product ID is required"));
    }

    // Get main pawning product data
    const [productRows] = await pool.query(
      `SELECT 
        idPawning_Product,
        Branch_idBranch,
        Name,
        Service_Charge,
        Service_Charge_Create_As,
        Service_Charge_Value_type,
        Service_Charge_Value,
        Early_Settlement_Charge_Create_As,
        Late_Charge_Status,
        Late_Charge_Create_As,
        Late_Charge,
        Interest_Method,
        Last_Updated_User,
        Last_Updated_Time,
        lateChargeStage1,
        lateChargeStage2,
        lateChargeStage3,
        lateChargeStage4,
        lateChargeStage1StartDate,
        lateChargeStage1EndDate,
        lateChargeStage2StartDate,
        lateChargeStage2EndDate,
        lateChargeStage3StartDate,
        lateChargeStage3EndDate,
        lateChargeStage4StartDate,
        lateChargeStage4EndDate,
        numberOfLateChargeStages,
        early_settlement_stage1_start_day,
        early_settlement_stage1_end_day,
        early_settlement_stage1_value,
        early_settlement_stage1_value_type,
        early_settlement_stage2_start_day,
        early_settlement_stage2_end_day,
        early_settlement_stage2_value,
        early_settlement_stage2_value_type,
        early_settlement_stage3_start_day,
        early_settlement_stage3_end_day,
        early_settlement_stage3_value,
        early_settlement_stage3_value_type,
        early_settlement_stage4_start_day,
        early_settlement_stage4_end_day,
        early_settlement_stage4_value,
        early_settlement_stage4_value_type,
        early_settlement_effect_type
      FROM pawning_product 
      WHERE idPawning_Product = ?`,
      [idPawning_Product],
    );

    if (productRows.length === 0) {
      return next(errorHandler(404, "Pawning product not found"));
    }

    const product = productRows[0];

    // Get early settlement charges if they exist
    const [earlySettlementRows] = await pool.query(
      `SELECT 
        idEarly_Settlement_Charges,
        From_Amount,
        To_Amount,
        Value_Type,
        Amount
      FROM early_settlement_charges 
      WHERE Pawning_Product_idPawning_Product = ?`,
      [idPawning_Product],
    );

    // Get product plans
    const [productPlanRows] = await pool.query(
      `SELECT 
        idProduct_Plan,
        Period_Type,
        Minimum_Period,
        Maximum_Period,
        Minimum_Amount,
        Maximum_Amount,
        Interest_type,
        Interest,
        Interest_Calculate_After,
        Service_Charge_Value_type,
        Service_Charge_Value,
        Early_Settlement_Charge_Value_type,
        Early_Settlement_Charge_Value,
        Late_Charge,
        Amount_For_22_Caratage,
        Last_Updated_User,
        Last_Updated_Time,
        interestApplicableMethod,
        CASE WHEN interestApplicableMethod = 'calculate for stages ' THEN stage1StartDate ELSE NULL END AS stage1StartDate,
        CASE WHEN interestApplicableMethod = 'calculate for stages ' THEN stage1EndDate ELSE NULL END AS stage1EndDate,
        CASE WHEN interestApplicableMethod = 'calculate for stages ' THEN stage2StartDate ELSE NULL END AS stage2StartDate,
        CASE WHEN interestApplicableMethod = 'calculate for stages ' THEN stage2EndDate ELSE NULL END AS stage2EndDate,
        CASE WHEN interestApplicableMethod = 'calculate for stages ' THEN stage3StartDate ELSE NULL END AS stage3StartDate,
        CASE WHEN interestApplicableMethod = 'calculate for stages ' THEN stage3EndDate ELSE NULL END AS stage3EndDate,
        CASE WHEN interestApplicableMethod = 'calculate for stages ' THEN stage4StartDate ELSE NULL END AS stage4StartDate,
        CASE WHEN interestApplicableMethod = 'calculate for stages ' THEN stage4EndDate ELSE NULL END AS stage4EndDate,
        CASE WHEN interestApplicableMethod = 'calculate for stages ' THEN stage1Interest ELSE NULL END AS stage1Interest,
        CASE WHEN interestApplicableMethod = 'calculate for stages ' THEN stage2Interest ELSE NULL END AS stage2Interest,
        CASE WHEN interestApplicableMethod = 'calculate for stages ' THEN stage3Interest ELSE NULL END AS stage3Interest,
        CASE WHEN interestApplicableMethod = 'calculate for stages ' THEN stage4Interest ELSE NULL END AS stage4Interest,
        Week_Precentage_Amount_22_Caratage,
        Month1_Precentage_Amount_22_Caratage,
        Month3_Precentage_Amount_22_Caratage,
        Month6_Precentage_Amount_22_Caratage,
        Month9_Precentage_Amount_22_Caratage,
        Month12_Precentage_Amount_22_Caratage,
        noOfStages,
        lateChargeStage1,
        lateChargeStage2,
        lateChargeStage3,
        lateChargeStage4,
        lateChargeStage1StartDate,
        lateChargeStage1EndDate,
        lateChargeStage2StartDate,
        lateChargeStage2EndDate,
        lateChargeStage3StartDate,
        lateChargeStage3EndDate,
        lateChargeStage4StartDate,
        lateChargeStage4EndDate,
        numberOfLateChargeStages,
        early_settlement_stage1_start_day,
        early_settlement_stage1_end_day,
        early_settlement_stage1_value,
        early_settlement_stage1_value_type,
        early_settlement_stage2_start_day,
        early_settlement_stage2_end_day,
        early_settlement_stage2_value,
        early_settlement_stage2_value_type,
        early_settlement_stage3_start_day,
        early_settlement_stage3_end_day,
        early_settlement_stage3_value,
        early_settlement_stage3_value_type,
        early_settlement_stage4_start_day,
        early_settlement_stage4_end_day,
        early_settlement_stage4_value,
        early_settlement_stage4_value_type,
        early_settlement_effect_type

      FROM product_plan 
      WHERE Pawning_Product_idPawning_Product = ?`,
      [idPawning_Product],
    );

    // Structure the response data similar to the input format
    const responseData = {
      idPawning_Product: product.idPawning_Product,
      branchId: product.Branch_idBranch,
      productName: product.Name,
      interestMethod: product.Interest_Method,

      // Service charge data
      serviceCharge: {
        status: product.Service_Charge === "1" ? "Active" : "Inactive",
        chargeType: product.Service_Charge_Create_As,
        valueType: product.Service_Charge_Value_type,
        value: product.Service_Charge_Value,
      },

      // Late charge data
      lateCharge: {
        status: product.Late_Charge_Status === "1" ? "Active" : "Inactive",
        chargeType: product.Late_Charge_Create_As,
        percentage: product.Late_Charge,
        // Add late charge stage fields ONLY when it is Charge For Product
        ...(product.Late_Charge_Create_As === "Charge For Product" && {
          lateChargeStage1: product.lateChargeStage1,
          lateChargeStage2: product.lateChargeStage2,
          lateChargeStage3: product.lateChargeStage3,
          lateChargeStage4: product.lateChargeStage4,
          lateChargeStage1StartDate: product.lateChargeStage1StartDate,
          lateChargeStage1EndDate: product.lateChargeStage1EndDate,
          lateChargeStage2StartDate: product.lateChargeStage2StartDate,
          lateChargeStage2EndDate: product.lateChargeStage2EndDate,
          lateChargeStage3StartDate: product.lateChargeStage3StartDate,
          lateChargeStage3EndDate: product.lateChargeStage3EndDate,
          lateChargeStage4StartDate: product.lateChargeStage4StartDate,
          lateChargeStage4EndDate: product.lateChargeStage4EndDate,
          numberOfLateChargeStages: product.numberOfLateChargeStages,
        }),
      },

      // Early settlement data
      earlysettlementsData: {
        newEarlySettlement: {
          status:
            product.Early_Settlement_Charge === "1" ? "Active" : "Inactive",
          chargeType: product.Early_Settlement_Charge_Create_As,
          valueType: product.Early_Settlement_Charge_Value_type,
          value: product.Early_Settlement_Charge_Value,
          earlySettlementStage1StartDay:
            product.early_settlement_stage1_start_day,
          earlySettlementStage1EndDay: product.early_settlement_stage1_end_day,
          earlySettlementStage1Value: product.early_settlement_stage1_value,
          earlySettlementStage1ValueType:
            product.early_settlement_stage1_value_type,
          earlySettlementStage2StartDay:
            product.early_settlement_stage2_start_day,
          earlySettlementStage2EndDay: product.early_settlement_stage2_end_day,
          earlySettlementStage2Value: product.early_settlement_stage2_value,
          earlySettlementStage2ValueType:
            product.early_settlement_stage2_value_type,
          earlySettlementStage3StartDay:
            product.early_settlement_stage3_start_day,
          earlySettlementStage3EndDay: product.early_settlement_stage3_end_day,
          earlySettlementStage3Value: product.early_settlement_stage3_value,
          earlySettlementStage3ValueType:
            product.early_settlement_stage3_value_type,
          earlySettlementStage4StartDay:
            product.early_settlement_stage4_start_day,
          earlySettlementStage4EndDay: product.early_settlement_stage4_end_day,
          earlySettlementStage4Value: product.early_settlement_stage4_value,
          earlySettlementStage4ValueType:
            product.early_settlement_stage4_value_type,
          earlySettlementEffectType: product.early_settlement_effect_type,
        },
        earlySettlements: earlySettlementRows.map((settlement) => ({
          id: settlement.idEarly_Settlement_Charges,
          lessThan: settlement.From_Amount,
          endAmount: settlement.To_Amount,
          valueType: settlement.Value_Type,
          value: settlement.Amount,
        })),
      },

      // Product items/plans
      productItems: productPlanRows.map((plan) => {
        const base = {
          id: plan.idProduct_Plan,
          periodType: plan.Period_Type,
          minPeriod: plan.Minimum_Period,
          maxPeriod: plan.Maximum_Period,
          minAmount: plan.Minimum_Amount,
          maxAmount: plan.Maximum_Amount,
          interestType: plan.Interest_type,
          interest: plan.Interest,
          interestAfter: plan.Interest_Calculate_After,
          serviceChargeValueType: plan.Service_Charge_Value_type,
          serviceChargeValue: plan.Service_Charge_Value,
          earlySettlementChargeValueType:
            plan.Early_Settlement_Charge_Value_type,
          earlySettlementChargeValue: plan.Early_Settlement_Charge_Value,
          earlySettlementStage1StartDay: plan.early_settlement_stage1_start_day,
          earlySettlementStage1EndDay: plan.early_settlement_stage1_end_day,
          earlySettlementStage1Value: plan.early_settlement_stage1_value,
          earlySettlementStage1ValueType:
            plan.early_settlement_stage1_value_type,
          earlySettlementStage2StartDay: plan.early_settlement_stage2_start_day,
          earlySettlementStage2EndDay: plan.early_settlement_stage2_end_day,
          earlySettlementStage2Value: plan.early_settlement_stage2_value,
          earlySettlementStage2ValueType:
            plan.early_settlement_stage2_value_type,
          earlySettlementStage3StartDay: plan.early_settlement_stage3_start_day,
          earlySettlementStage3EndDay: plan.early_settlement_stage3_end_day,
          earlySettlementStage3Value: plan.early_settlement_stage3_value,
          earlySettlementStage3ValueType:
            plan.early_settlement_stage3_value_type,
          earlySettlementStage4StartDay: plan.early_settlement_stage4_start_day,
          earlySettlementStage4EndDay: plan.early_settlement_stage4_end_day,
          earlySettlementStage4Value: plan.early_settlement_stage4_value,
          earlySettlementStage4ValueType:
            plan.early_settlement_stage4_value_type,
          earlySettlementEffectType: plan.early_settlement_effect_type,
          lateChargePerDay: plan.Late_Charge,
          amount22Carat: plan.Amount_For_22_Caratage,
          lastUpdatedUser: plan.Last_Updated_User,
          lastUpdatedTime: plan.Last_Updated_Time,
          interestApplicableMethod: plan.interestApplicableMethod,
          carat22Percentages: {
            oneWeek: plan.Week_Precentage_Amount_22_Caratage,
            oneMonth: plan.Month1_Precentage_Amount_22_Caratage,
            threeMonths: plan.Month3_Precentage_Amount_22_Caratage,
            sixMonths: plan.Month6_Precentage_Amount_22_Caratage,
            nineMonths: plan.Month9_Precentage_Amount_22_Caratage,
            twelveMonths: plan.Month12_Precentage_Amount_22_Caratage,
          },
          stage1StartDate: plan.stage1StartDate,
          stage1EndDate: plan.stage1EndDate,
          stage2StartDate: plan.stage2StartDate,
          stage2EndDate: plan.stage2EndDate,
          stage3StartDate: plan.stage3StartDate,
          stage3EndDate: plan.stage3EndDate,
          stage4StartDate: plan.stage4StartDate,
          stage4EndDate: plan.stage4EndDate,
          stage1Interest: plan.stage1Interest,
          stage2Interest: plan.stage2Interest,
          stage3Interest: plan.stage3Interest,
          stage4Interest: plan.stage4Interest,
          numberOfStages: plan.noOfStages,
        };

        // Add late charge stage fields ONLY when it is Charge For Product Item
        if (product.Late_Charge_Create_As === "Charge For Product Item") {
          Object.assign(base, {
            lateChargeStage1: plan.lateChargeStage1,
            lateChargeStage2: plan.lateChargeStage2,
            lateChargeStage3: plan.lateChargeStage3,
            lateChargeStage4: plan.lateChargeStage4,
            lateChargeStage1StartDate: plan.lateChargeStage1StartDate,
            lateChargeStage1EndDate: plan.lateChargeStage1EndDate,
            lateChargeStage2StartDate: plan.lateChargeStage2StartDate,
            lateChargeStage2EndDate: plan.lateChargeStage2EndDate,
            lateChargeStage3StartDate: plan.lateChargeStage3StartDate,
            lateChargeStage3EndDate: plan.lateChargeStage3EndDate,
            lateChargeStage4StartDate: plan.lateChargeStage4StartDate,
            lateChargeStage4EndDate: plan.lateChargeStage4EndDate,
            numberOfLateChargeStages: plan.numberOfLateChargeStages,
          });
        }

        // Add stage fields only when interestApplicableMethod indicates staged calculation
        if (plan.interestApplicableMethod === "calculate for stages") {
          Object.assign(base, {
            stage1StartDate: plan.stage1StartDate,
            stage1EndDate: plan.stage1EndDate,
            stage2StartDate: plan.stage2StartDate,
            stage2EndDate: plan.stage2EndDate,
            stage3StartDate: plan.stage3StartDate,
            stage3EndDate: plan.stage3EndDate,
            stage4StartDate: plan.stage4StartDate,
            stage4EndDate: plan.stage4EndDate,
            stage1Interest:
              plan.stage1Interest != null ? parseFloat(plan.stage1Interest) : 0,
            stage2Interest:
              plan.stage2Interest != null ? parseFloat(plan.stage2Interest) : 0,
            stage3Interest:
              plan.stage3Interest != null ? parseFloat(plan.stage3Interest) : 0,
            stage4Interest:
              plan.stage4Interest != null ? parseFloat(plan.stage4Interest) : 0,
          });
        }

        return base;
      }),

      lastUpdatedUser: await returnUserData(
        product.Last_Updated_User,
        req.companyId,
      ),
      lastUpdatedTime: product.Last_Updated_Time,
    };

    // Return success response
    res.status(200).json({
      success: true,
      message: "Pawning product retrieved successfully",
      pawningProduct: responseData,
    });
  } catch (error) {
    console.error("Error retrieving pawning product:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Get all pawning products for a specific branch with pagination
export const getPawningProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10
    const offset = (page - 1) * limit;
    const { branchId } = req.query;

    // Build WHERE conditions based on branch access
    let whereCondition = "";
    let queryParams = [];

    if (req.isHeadBranch) {
      if (branchId) {
        // Head branch viewing a specific branch
        whereCondition = "Branch_idBranch = ?";
        queryParams.push(branchId);
      } else {
        // Head branch viewing all company branches
        const branches = await getCompanyBranches(req.companyId);
        whereCondition = "Branch_idBranch IN (?)";
        queryParams.push(branches);
      }
    } else {
      // Regular branch - only their own data
      whereCondition = "Branch_idBranch = ?";
      queryParams.push(req.branchId);
    }

    const paginationData = await getPaginationData(
      `SELECT COUNT(*) AS total FROM pawning_product WHERE ${whereCondition}`,
      queryParams,
      page,
      limit,
    );

    let pawningProducts;
    [pawningProducts] = await pool.query(
      `SELECT idPawning_Product, Name, Interest_Method, Service_Charge,Early_Settlement_Charge_Create_As, Late_Charge_Status, Branch_idBranch FROM pawning_product WHERE ${whereCondition} LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset],
    );

    // find number of active tickets for each product
    for (let product of pawningProducts) {
      const [activeTickets] = await pool.query(
        `SELECT COUNT(*) AS activeCount FROM pawning_ticket WHERE Pawning_Product_idPawning_Product = ? AND Status != '2'`,
        [product.idPawning_Product],
      );
      product.activeTickets = activeTickets[0].activeCount || 0;
    }

    res.status(200).json({
      success: true,
      pawningProducts,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error fetching pawning products:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Delete a pawning product by ID
export const deletePawningProductById = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.params.id;
    if (!productId) {
      return next(errorHandler(400, "Product ID is required"));
    }
    if (!req.branchId) {
      return next(errorHandler(400, "Branch ID is required"));
    }

    const [existingProduct] = await pool.query(
      `SELECT * FROM pawning_product WHERE idPawning_Product = ? AND Branch_idBranch = ?`,
      [productId, req.branchId],
    );

    if (existingProduct.length === 0) {
      return next(errorHandler(404, "Pawning product not found"));
    }

    // Delete from Product Plan table first
    const [result] = await pool.query(
      `DELETE FROM product_plan WHERE Pawning_Product_idPawning_Product = ?`,
      [productId],
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to delete product plan"));
    }

    res.status(200).json({
      success: true,
      message: "Pawning product plan deleted successfully",
      productId: result.insertId,
    });
  } catch (error) {
    console.error("Error deleting pawning product:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

/**
 * Internal helper: create one pawning product for a single branch.
 * Used by createPawningProduct (single branch) and createPawningProductForBranches (head office).
 * @param {number} branchId - Branch_idBranch
 * @param {object} data - Product payload (same as create body.data)
 * @param {object} connection - The database connection for the transaction
 * @returns {Promise<number>} inserted pawning_product id
 */
async function createOnePawningProductForBranch(
  branchId,
  data,
  userId,
  connection,
) {
  const serviceCharge = data.serviceCharge?.status === "Active" ? 1 : 0;
  const serviceChargeCreateAs = data.serviceCharge?.chargeType || "inactive";
  const serviceChargeValueType = data.serviceCharge?.valueType || "inactive";
  const serviceChargeValue = data.serviceCharge?.value || 0;

  const earlySettlementCharge =
    data.earlysettlementsData?.newEarlySettlement?.status === "Active" ? 1 : 0;
  const earlySettlementChargeCreateAs =
    data.earlysettlementsData?.newEarlySettlement?.chargeType || "inactive";

  let earlySettlementChargeValueType = null;
  let earlySettlementChargeValue = null;
  if (earlySettlementChargeCreateAs === "inactive") {
    earlySettlementChargeValueType = "inactive";
    earlySettlementChargeValue = 0;
  }
  if (earlySettlementChargeCreateAs === "Charge For Product") {
    earlySettlementChargeValueType =
      data.earlysettlementsData?.newEarlySettlement?.valueType || "inactive";
    earlySettlementChargeValue =
      data.earlysettlementsData?.newEarlySettlement?.value || "inactive";
  }

  const lateCharge = data.lateCharge?.status === "Active" ? 1 : 0;
  const lateChargeCreateAs = data.lateCharge?.chargeType || "inactive";
  const lateChargePresentage = data.lateCharge?.percentage || 0;

  const [result] = await connection.query(
    "INSERT INTO pawning_product (Branch_idBranch,Name,Service_Charge,Service_Charge_Create_As,Service_Charge_Value_type,Service_Charge_Value,Early_Settlement_Charge_Create_As,Late_Charge_Status,Late_Charge_Create_As,Late_Charge,Interest_Method,Last_Updated_User,Last_Updated_Time,lateChargeStage1,lateChargeStage2,lateChargeStage3,lateChargeStage4,lateChargeStage1StartDate,lateChargeStage1EndDate,lateChargeStage2StartDate,lateChargeStage2EndDate,lateChargeStage3StartDate,lateChargeStage3EndDate,lateChargeStage4StartDate,lateChargeStage4EndDate,numberOfLateChargeStages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    [
      branchId,
      data.productName || "Unnamed Product",
      serviceCharge,
      serviceChargeCreateAs,
      serviceChargeCreateAs === "Charge For Product Item"
        ? "N/A"
        : serviceChargeValueType,
      serviceChargeCreateAs === "Charge For Product Item"
        ? "N/A"
        : serviceChargeValue,
      earlySettlementChargeCreateAs,
      lateCharge,
      lateChargeCreateAs,
      lateChargePresentage,
      data.interestMethod || null,
      userId,
      new Date(),
      data.lateCharge.lateChargeStage1 || 0,
      data.lateCharge.lateChargeStage2 || 0,
      data.lateCharge.lateChargeStage3 || 0,
      data.lateCharge.lateChargeStage4 || 0,
      data.lateCharge.lateChargeStage1StartDate ?? null,
      data.lateCharge.lateChargeStage1EndDate || null,
      data.lateCharge.lateChargeStage2StartDate || null,
      data.lateCharge.lateChargeStage2EndDate || null,
      data.lateCharge.lateChargeStage3StartDate || null,
      data.lateCharge.lateChargeStage3EndDate || null,
      data.lateCharge.lateChargeStage4StartDate || null,
      data.lateCharge.lateChargeStage4EndDate || null,
      data.lateCharge.numberOfLateChargeStages || 0,
    ],
  );

  if (result.affectedRows === 0)
    throw new Error("Failed to create pawning product");
  const productId = result.insertId;
  const productEarlyStageData = extractEarlySettlementStagePayload(
    data.earlysettlementsData?.newEarlySettlement || {},
  );

  await connection.query(
    `UPDATE pawning_product SET
      early_settlement_stage1_start_day = ?,
      early_settlement_stage1_end_day = ?,
      early_settlement_stage1_value = ?,
      early_settlement_stage1_value_type = ?,
      early_settlement_stage2_start_day = ?,
      early_settlement_stage2_end_day = ?,
      early_settlement_stage2_value = ?,
      early_settlement_stage2_value_type = ?,
      early_settlement_stage3_start_day = ?,
      early_settlement_stage3_end_day = ?,
      early_settlement_stage3_value = ?,
      early_settlement_stage3_value_type = ?,
      early_settlement_stage4_start_day = ?,
      early_settlement_stage4_end_day = ?,
      early_settlement_stage4_value = ?,
      early_settlement_stage4_value_type = ?,
      early_settlement_effect_type = ?
    WHERE idPawning_Product = ?`,
    [
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage1StartDay
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage1EndDay
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage1Value
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage1ValueType
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage2StartDay
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage2EndDay
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage2Value
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage2ValueType
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage3StartDay
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage3EndDay
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage3Value
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage3ValueType
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage4StartDay
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage4EndDay
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage4Value
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.stage4ValueType
        : null,
      earlySettlementChargeCreateAs === "Charge For Product"
        ? productEarlyStageData.effectType
        : null,
      productId,
    ],
  );

  if (earlySettlementChargeCreateAs === "Charge For Settlement Amount") {
    const earlySettlements = data.earlysettlementsData?.earlySettlements;
    if (!earlySettlements) {
      throw new Error(
        "Early settlement data is required for settlement amount charges",
      );
    }
    const settlementsArray = Array.isArray(earlySettlements)
      ? earlySettlements
      : [earlySettlements];
    for (const settlement of settlementsArray) {
      const fromAmount = settlement.lessThan || 0;
      const toAmount = settlement.endAmount || 0;
      const valueType = settlement.valueType || null;
      const value = settlement.value || null;
      await connection.query(
        "INSERT INTO early_settlement_charges (From_Amount,To_Amount,Value_Type,Amount,Pawning_Product_idPawning_Product) VALUES (?,?,?,?,?)",
        [fromAmount, toAmount, valueType, value, productId],
      );
    }
  }

  const interestMethod = data.interestMethod || null;
  const productPlans = data.productItems;
  if (!productPlans || productPlans.length === 0) {
    throw new Error("At least one product item is required");
  }

  for (const plan of productPlans) {
    const amount22CaratValue =
      interestMethod === "Interest For Pawning Amount"
        ? data.amount22
        : plan.amount22Carat;
    const [planInsertResult] = await connection.query(
      "INSERT INTO product_plan (Period_Type,Minimum_Period,Maximum_Period,Minimum_Amount,Maximum_Amount,Interest_type,Interest,Interest_Calculate_After,Service_Charge_Value_type,Service_Charge_Value,Early_Settlement_Charge_Value_type,Early_Settlement_Charge_Value,Late_Charge,Amount_For_22_Caratage,Last_Updated_User,Last_Updated_Time,Pawning_Product_idPawning_Product,stage1StartDate,stage1EndDate,stage2StartDate,stage2EndDate,stage3StartDate,stage3EndDate,stage4StartDate,stage4EndDate,stage1Interest,stage2Interest,stage3Interest,stage4Interest,interestApplicableMethod,Week_Precentage_Amount_22_Caratage,Month1_Precentage_Amount_22_Caratage,Month3_Precentage_Amount_22_Caratage,Month6_Precentage_Amount_22_Caratage,Month9_Precentage_Amount_22_Caratage,Month12_Precentage_Amount_22_Caratage,noOfStages,lateChargeStage1,lateChargeStage2,lateChargeStage3,lateChargeStage4,lateChargeStage1StartDate,lateChargeStage1EndDate,lateChargeStage2StartDate,lateChargeStage2EndDate,lateChargeStage3StartDate,lateChargeStage3EndDate,lateChargeStage4StartDate,lateChargeStage4EndDate,numberOfLateChargeStages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        plan.periodType,
        plan.minPeriod,
        plan.maxPeriod,
        plan.minAmount,
        plan.maxAmount,
        plan.interestType,
        plan.interest || 0,
        plan.interestAfter,
        plan.serviceChargeValueType || serviceChargeValueType || "inactive",
        plan.serviceChargeValue || serviceChargeValue || 0,
        plan.earlySettlementChargeValueType ||
          earlySettlementChargeValueType ||
          "inactive",
        plan.earlySettlementChargeValue || earlySettlementChargeValue || 0,
        plan.lateChargePerDay || lateChargePresentage || 0,
        amount22CaratValue,
        userId,
        new Date(),
        productId,
        plan.stage1StartDate !== null &&
        plan.stage1StartDate !== undefined &&
        plan.stage1StartTime !== ""
          ? plan.stage1StartDate
          : 0,
        (plan.stage1EndDate === null ||
          plan.stage1EndDate === "" ||
          plan.stage1EndDate === undefined) &&
        plan.stage1StartDate !== null &&
        plan.stage1StartDate !== undefined &&
        plan.stage1StartDate !== "" &&
        (plan.stage2StartDate === null ||
          plan.stage2StartDate === undefined ||
          plan.stage2StartDate === "")
          ? "To maturity date"
          : plan.stage1EndDate === "To maturity date"
            ? "To maturity date"
            : plan.stage1EndDate || null,
        plan.stage2StartDate || null,
        (plan.stage2EndDate === null ||
          plan.stage2EndDate === "" ||
          plan.stage2EndDate === undefined) &&
        plan.stage2StartDate !== null &&
        plan.stage2StartDate !== undefined &&
        plan.stage2StartDate !== "" &&
        (plan.stage3StartDate === null ||
          plan.stage3StartDate === undefined ||
          plan.stage3StartDate === "")
          ? "To maturity date"
          : plan.stage2EndDate === "To maturity date"
            ? "To maturity date"
            : plan.stage2EndDate || null,
        plan.stage3StartDate || null,
        (plan.stage3EndDate === null ||
          plan.stage3EndDate === "" ||
          plan.stage3EndDate === undefined) &&
        plan.stage3StartDate !== null &&
        plan.stage3StartDate !== undefined &&
        plan.stage3StartDate !== "" &&
        (plan.stage4StartDate === null ||
          plan.stage4StartDate === undefined ||
          plan.stage4StartDate === "")
          ? "To maturity date"
          : plan.stage3EndDate === "To maturity date"
            ? "To maturity date"
            : plan.stage3EndDate || null,
        plan.stage4StartDate || null,
        (plan.stage4EndDate === null ||
          plan.stage4EndDate === "" ||
          plan.stage4EndDate === undefined) &&
        plan.stage4StartDate !== null &&
        plan.stage4StartDate !== undefined &&
        plan.stage4StartDate !== ""
          ? "To maturity date"
          : plan.stage4EndDate === "To maturity date"
            ? "To maturity date"
            : plan.stage4EndDate || null,
        parseFloat(plan.stage1Interest) || 0,
        parseFloat(plan.stage2Interest) || 0,
        parseFloat(plan.stage3Interest) || 0,
        parseFloat(plan.stage4Interest) || 0,
        plan.interestApplicableMethod || null,
        data.percentages?.oneWeek || 0,
        data.percentages?.oneMonth || 0,
        data.percentages?.threeMonths || 0,
        data.percentages?.sixMonths || 0,
        data.percentages?.nineMonths || 0,
        data.percentages?.twelveMonths || 0,
        plan.numberOfStages || 0,
        plan.lateChargeStage1 || 0,
        plan.lateChargeStage2 || 0,
        plan.lateChargeStage3 || 0,
        plan.lateChargeStage4 || 0,
        plan.lateChargeStage1StartDate !== undefined
          ? plan.lateChargeStage1StartDate
          : null,
        plan.lateChargeStage1EndDate || null,
        plan.lateChargeStage2StartDate || null,
        plan.lateChargeStage2EndDate || null,
        plan.lateChargeStage3StartDate || null,
        plan.lateChargeStage3EndDate || null,
        plan.lateChargeStage4StartDate || null,
        plan.lateChargeStage4EndDate || null,
        plan.numberOfLateChargeStages || 0,
      ],
    );
    const productItemEarlyStageData = extractEarlySettlementStagePayload(plan);
    await connection.query(
      `UPDATE product_plan SET
        early_settlement_stage1_start_day = ?,
        early_settlement_stage1_end_day = ?,
        early_settlement_stage1_value = ?,
        early_settlement_stage1_value_type = ?,
        early_settlement_stage2_start_day = ?,
        early_settlement_stage2_end_day = ?,
        early_settlement_stage2_value = ?,
        early_settlement_stage2_value_type = ?,
        early_settlement_stage3_start_day = ?,
        early_settlement_stage3_end_day = ?,
        early_settlement_stage3_value = ?,
        early_settlement_stage3_value_type = ?,
        early_settlement_stage4_start_day = ?,
        early_settlement_stage4_end_day = ?,
        early_settlement_stage4_value = ?,
        early_settlement_stage4_value_type = ?,
        early_settlement_effect_type = ?
      WHERE idProduct_Plan = ?`,
      [
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage1StartDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage1EndDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage1Value
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage1ValueType
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage2StartDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage2EndDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage2Value
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage2ValueType
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage3StartDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage3EndDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage3Value
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage3ValueType
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage4StartDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage4EndDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage4Value
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.stage4ValueType
          : null,
        earlySettlementChargeCreateAs === "Charge For Product Item"
          ? productItemEarlyStageData.effectType
          : null,
        planInsertResult.insertId,
      ],
    );
  }

  return productId;
}

// Create a new pawning product for a specific branch
export const createPawningProduct = async (req, res, next) => {
  let connection;
  try {
    const { data } = req.body;
    if (!data) {
      return next(errorHandler(400, "Product data is required"));
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const productId = await createOnePawningProductForBranch(
      req.branchId,
      data,
      req.userId,
      connection,
    );

    await connection.commit();
    res.status(201).json({
      success: true,
      message: "Pawning product created successfully",
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }
    if (err.message === "At least one product item is required") {
      return next(errorHandler(400, err.message));
    }
    if (err.message?.includes("Early settlement")) {
      return next(errorHandler(400, err.message));
    }
    console.error("Error creating pawning product:", err);
    return next(errorHandler(500, err.message || "Internal Server Error"));
  } finally {
    if (connection) connection.release();
  }
};

/**
 * Head office only: create the same pawning product for multiple branches.
 *
 */
export const createPawningProductForBranches = async (req, res, next) => {
  let connection;
  try {
    const { data, branchIds } = req.body;
    if (!data) {
      return next(errorHandler(400, "Product data is required"));
    }
    if (!Array.isArray(branchIds) || branchIds.length === 0) {
      return next(
        errorHandler(
          400,
          "branchIds array with at least one branch is required",
        ),
      );
    }
    const userBranchIds = (req.branches || []).map((id) =>
      typeof id === "string" ? parseInt(id, 10) : id,
    );
    const headBranchId =
      typeof req.branchId === "string"
        ? parseInt(req.branchId, 10)
        : req.branchId;
    const validBranchIds = branchIds.filter((id) => {
      const num = typeof id === "string" ? parseInt(id, 10) : id;
      return (
        !Number.isNaN(num) &&
        userBranchIds.includes(num) &&
        num !== headBranchId
      );
    });
    if (validBranchIds.length === 0) {
      return next(
        errorHandler(
          400,
          "No valid branch IDs. Each must be in your branch access and not the head office branch.",
        ),
      );
    }

    const created = [];
    const errors = [];
    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const branchId of validBranchIds) {
      try {
        const productId = await createOnePawningProductForBranch(
          branchId,
          data,
          req.userId,
          connection,
        );
        created.push({ branchId, productId });
      } catch (err) {
        console.error(`Error creating product for branch ${branchId}:`, err);
        errors.push({ branchId, message: err.message || "Failed to create" });
      }
    }

    if (created.length === 0) {
      await connection.rollback();
      return next(
        errorHandler(
          500,
          "Failed to create product for any branch. " +
            (errors[0]?.message || ""),
        ),
      );
    }

    await connection.commit();
    res.status(201).json({
      success: true,
      message: `Pawning product created for ${created.length} branch(es).`,
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("Error in createPawningProductForBranches:", err);
    return next(errorHandler(500, err.message || "Internal Server Error"));
  } finally {
    if (connection) connection.release();
  }
};

// Update/Edit a pawning product by ID
export const updatePawningProductById = async (req, res, next) => {
  let connection;
  try {
    const idPawning_Product = req.params.productId || req.params.id;
    const { data } = req.body;
    // console.log(data, "data in update pawning product");

    if (!idPawning_Product) {
      return next(errorHandler(400, "Product ID is required"));
    }

    if (!data) {
      return next(errorHandler(400, "Product data is required"));
    }

    // Validate required fields
    if (!data.productName || data.productName.trim().length < 3) {
      return next(
        errorHandler(400, "Product name must be at least 3 characters"),
      );
    }

    if (!data.productItems || data.productItems.length === 0) {
      return next(errorHandler(400, "At least one product item is required"));
    }

    // Check if product exists and belongs to the branch
    const [existingProduct] = await pool.query(
      "SELECT * FROM pawning_product WHERE idPawning_Product = ? AND Branch_idBranch = ?",
      [idPawning_Product, req.branchId],
    );

    if (existingProduct.length === 0) {
      return next(
        errorHandler(404, "Pawning product not found or access denied"),
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Prepare service charge data for pawning product table
    const serviceCharge = data.serviceCharge?.status === "Active" ? 1 : 0;
    const serviceChargeCreateAs = data.serviceCharge?.chargeType || "inactive";
    const serviceChargeValueType = data.serviceCharge?.valueType || "inactive";
    const serviceChargeValue = parseFloat(data.serviceCharge?.value) || 0;

    // Prepare early settlement data for pawning product table
    const earlySettlementCharge =
      data.earlysettlementsData?.newEarlySettlement?.status === "Active"
        ? 1
        : 0;
    const earlySettlementChargeCreateAs =
      data.earlysettlementsData?.newEarlySettlement?.chargeType || "inactive";
    let earlySettlementChargeValueType = "inactive";
    let earlySettlementChargeValue = 0;

    // Handle different early settlement charge types
    if (earlySettlementChargeCreateAs === "Charge For Product") {
      earlySettlementChargeValueType =
        data.earlysettlementsData?.newEarlySettlement?.valueType || "inactive";
      earlySettlementChargeValue =
        parseFloat(data.earlysettlementsData?.newEarlySettlement?.value) ||
        "inactive";
    }

    // Prepare late charge data for pawning product table
    const lateCharge = data.lateCharge?.status === "Active" ? 1 : 0;
    const lateChargeCreateAs = data.lateCharge?.chargeType || "inactive";
    const lateChargePresentage = parseFloat(data.lateCharge?.percentage) || 0;

    // Update the main pawning product table
    const [updateResult] = await connection.query(
      `UPDATE pawning_product SET 
        Name = ?,
        Service_Charge = ?,
        Service_Charge_Create_As = ?,
        Service_Charge_Value_type = ?,
        Service_Charge_Value = ?,
        Early_Settlement_Charge = ?,
        Early_Settlement_Charge_Create_As = ?,
        Early_Settlement_Charge_Value_type = ?,
        Early_Settlement_Charge_Value = ?,
        Late_Charge_Status = ?,
        Late_Charge_Create_As = ?,
        Late_Charge = ?,
        Interest_Method = ?,
        Last_Updated_User = ?,
        Last_Updated_Time = ?,
        lateChargeStage1 = ?,
        lateChargeStage2 = ?,
        lateChargeStage3 = ?,
        lateChargeStage4 = ?,
        lateChargeStage1StartDate = ?,
        lateChargeStage1EndDate = ?,
        lateChargeStage2StartDate = ?,
        lateChargeStage2EndDate = ?,
        lateChargeStage3StartDate = ?,
        lateChargeStage3EndDate = ?,
        lateChargeStage4StartDate = ?,
        lateChargeStage4EndDate = ?,
        numberOfLateChargeStages = ?
      WHERE idPawning_Product = ?`,
      [
        data.productName,
        serviceCharge,
        serviceChargeCreateAs,
        serviceChargeCreateAs === "Charge For Product Item"
          ? "N/A"
          : serviceChargeValueType,
        serviceChargeCreateAs === "Charge For Product Item"
          ? "N/A"
          : serviceChargeValue,
        earlySettlementCharge,
        earlySettlementChargeCreateAs,
        earlySettlementChargeValueType,
        earlySettlementChargeValue,
        lateCharge,
        lateChargeCreateAs,
        lateChargePresentage,
        data.interestMethod || null,
        req.userId,
        new Date(),
        data.lateCharge.lateChargeStage1 || 0,
        data.lateCharge.lateChargeStage2 || 0,
        data.lateCharge.lateChargeStage3 || 0,
        data.lateCharge.lateChargeStage4 || 0,
        data.lateCharge.lateChargeStage1StartDate || 0,
        data.lateCharge.lateChargeStage1EndDate || null,
        data.lateCharge.lateChargeStage2StartDate || null,
        data.lateCharge.lateChargeStage2EndDate || null,
        data.lateCharge.lateChargeStage3StartDate || null,
        data.lateCharge.lateChargeStage3EndDate || null,
        data.lateCharge.lateChargeStage4StartDate || null,
        data.lateCharge.lateChargeStage4EndDate || null,
        data.lateCharge.numberOfLateChargeStages || 0,
        idPawning_Product,
      ],
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return next(errorHandler(500, "Failed to update pawning product"));
    }
    const updatedProductEarlyStageData = extractEarlySettlementStagePayload(
      data.earlysettlementsData?.newEarlySettlement || {},
    );
    await connection.query(
      `UPDATE pawning_product SET
        early_settlement_stage1_start_day = ?,
        early_settlement_stage1_end_day = ?,
        early_settlement_stage1_value = ?,
        early_settlement_stage1_value_type = ?,
        early_settlement_stage2_start_day = ?,
        early_settlement_stage2_end_day = ?,
        early_settlement_stage2_value = ?,
        early_settlement_stage2_value_type = ?,
        early_settlement_stage3_start_day = ?,
        early_settlement_stage3_end_day = ?,
        early_settlement_stage3_value = ?,
        early_settlement_stage3_value_type = ?,
        early_settlement_stage4_start_day = ?,
        early_settlement_stage4_end_day = ?,
        early_settlement_stage4_value = ?,
        early_settlement_stage4_value_type = ?,
        early_settlement_effect_type = ?
      WHERE idPawning_Product = ?`,
      [
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage1StartDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage1EndDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage1Value
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage1ValueType
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage2StartDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage2EndDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage2Value
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage2ValueType
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage3StartDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage3EndDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage3Value
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage3ValueType
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage4StartDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage4EndDay
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage4Value
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.stage4ValueType
          : null,
        earlySettlementChargeCreateAs === "Charge For Product"
          ? updatedProductEarlyStageData.effectType
          : null,
        idPawning_Product,
      ],
    );

    // Delete existing early settlement charges
    await connection.query(
      "DELETE FROM early_settlement_charges WHERE Pawning_Product_idPawning_Product = ?",
      [idPawning_Product],
    );

    // Handle early settlement charges if charge type is "Charge For Settlement Amount"
    if (earlySettlementChargeCreateAs === "Charge For Settlement Amount") {
      const earlySettlements = data.earlysettlementsData?.earlySettlements;

      if (!earlySettlements || earlySettlements.length === 0) {
        await connection.rollback();
        connection.release();
        return next(
          errorHandler(
            400,
            "Early settlement data is required for settlement amount charges",
          ),
        );
      }

      // Convert to array if it's a single object
      const settlementsArray = Array.isArray(earlySettlements)
        ? earlySettlements
        : [earlySettlements];

      // Insert new early settlement charges
      for (const settlement of settlementsArray) {
        const fromAmount = parseFloat(settlement.lessThan) || 0;
        const toAmount = parseFloat(settlement.endAmount) || 0;
        const valueType = settlement.valueType || null;
        const value = parseFloat(settlement.value) || 0;

        const [earlySettlementResult] = await connection.query(
          "INSERT INTO early_settlement_charges (From_Amount, To_Amount, Value_Type, Amount, Pawning_Product_idPawning_Product) VALUES (?, ?, ?, ?, ?)",
          [fromAmount, toAmount, valueType, value, idPawning_Product],
        );

        if (earlySettlementResult.affectedRows === 0) {
          throw new Error("Failed to create early settlement charge record");
        }
      }
    }

    // Delete existing product plans
    await connection.query(
      "DELETE FROM product_plan WHERE Pawning_Product_idPawning_Product = ?",
      [idPawning_Product],
    );

    // Insert updated product plans
    const productPlans = data.productItems;

    for (const plan of productPlans) {
      // Extract 22 carat percentages from the plan object (not from root data)
      const carat22Percentages = plan.carat22Percentages || {};

      // Get amount for 22 caratage
      const amount22CaratValue = parseFloat(plan.amount22Carat) || 0;

      // Validate stage dates if stage-based calculation is used
      if (plan.interestApplicableMethod === "Calculate for stages") {
        // Stage 1 start must be 0
        if (plan.stage1StartDate !== 0 && plan.stage1StartDate !== "0") {
          return next(errorHandler(400, "Stage 1 start date must be 0"));
        }
      }

      // Prepare stage values (convert null/undefined to null, keep numbers/strings as is)
      const prepareStageValue = (value) => {
        if (value === undefined || value === null || value === "") return null;
        return value;
      };

      const [productPlanResult] = await connection.query(
        `INSERT INTO product_plan (
          Period_Type,
          Minimum_Period,
          Maximum_Period,
          Minimum_Amount,
          Maximum_Amount,
          Interest_type,
          Interest,
          Interest_Calculate_After,
          Service_Charge_Value_type,
          Service_Charge_Value,
          Early_Settlement_Charge_Value_type,
          Early_Settlement_Charge_Value,
          Late_Charge,
          Amount_For_22_Caratage,
          Last_Updated_User,
          Last_Updated_Time,
          Pawning_Product_idPawning_Product,
          stage1StartDate,
          stage1EndDate,
          stage2StartDate,
          stage2EndDate,
          stage3StartDate,
          stage3EndDate,
          stage4StartDate,
          stage4EndDate,
          stage1Interest,
          stage2Interest,
          stage3Interest,
          stage4Interest,
          Week_Precentage_Amount_22_Caratage,
          Month1_Precentage_Amount_22_Caratage,
          Month3_Precentage_Amount_22_Caratage,
          Month6_Precentage_Amount_22_Caratage,
          Month9_Precentage_Amount_22_Caratage,
          Month12_Precentage_Amount_22_Caratage,
          noOfStages,
          InterestApplicableMethod,
          lateChargeStage1,
          lateChargeStage2,
          lateChargeStage3,
          lateChargeStage4,
          lateChargeStage1StartDate,
          lateChargeStage1EndDate,
          lateChargeStage2StartDate,
          lateChargeStage2EndDate,
          lateChargeStage3StartDate,
          lateChargeStage3EndDate,
          lateChargeStage4StartDate,
          lateChargeStage4EndDate,
          numberOfLateChargeStages
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          plan.periodType || null,
          parseInt(plan.minPeriod) || 0,
          parseInt(plan.maxPeriod) || 0,
          parseFloat(plan.minAmount) || 0,
          parseFloat(plan.maxAmount) || 0,
          plan.interestType || null,
          parseFloat(plan.interest) || 0,
          parseInt(plan.interestAfter) || 0,
          plan.serviceChargeValueType || null,
          parseFloat(plan.serviceChargeValue) || 0,
          plan.earlySettlementChargeValueType || null,
          parseFloat(plan.earlySettlementChargeValue) || 0,
          parseFloat(plan.lateChargePerDay) || 0,
          amount22CaratValue,
          req.userId,
          new Date(),
          idPawning_Product,
          // Stage dates (can be null, numeric, or string for stage4)
          prepareStageValue(plan.stage1StartDate) || 0,
          (plan.stage1EndDate === null ||
            plan.stage1EndDate === "" ||
            plan.stage1EndDate === undefined) &&
          plan.stage1StartDate !== null &&
          plan.stage1StartDate !== undefined &&
          plan.stage1StartDate !== "" &&
          (plan.stage2StartDate === null ||
            plan.stage2StartDate === undefined ||
            plan.stage2StartDate === "")
            ? "To maturity date"
            : plan.stage1EndDate === "To maturity date"
              ? "To maturity date"
              : prepareStageValue(plan.stage1EndDate),
          prepareStageValue(plan.stage2StartDate),
          (plan.stage2EndDate === null ||
            plan.stage2EndDate === "" ||
            plan.stage2EndDate === undefined) &&
          plan.stage2StartDate !== null &&
          plan.stage2StartDate !== undefined &&
          plan.stage2StartDate !== "" &&
          (plan.stage3StartDate === null ||
            plan.stage3StartDate === undefined ||
            plan.stage3StartDate === "")
            ? "To maturity date"
            : plan.stage2EndDate === "To maturity date"
              ? "To maturity date"
              : prepareStageValue(plan.stage2EndDate),
          prepareStageValue(plan.stage3StartDate),
          (plan.stage3EndDate === null ||
            plan.stage3EndDate === "" ||
            plan.stage3EndDate === undefined) &&
          plan.stage3StartDate !== null &&
          plan.stage3StartDate !== undefined &&
          plan.stage3StartDate !== "" &&
          (plan.stage4StartDate === null ||
            plan.stage4StartDate === undefined ||
            plan.stage4StartDate === "")
            ? "To maturity date"
            : plan.stage3EndDate === "To maturity date"
              ? "To maturity date"
              : prepareStageValue(plan.stage3EndDate),
          prepareStageValue(plan.stage4StartDate),
          (plan.stage4EndDate === null ||
            plan.stage4EndDate === "" ||
            plan.stage4EndDate === undefined) &&
          plan.stage4StartDate !== null &&
          plan.stage4StartDate !== undefined &&
          plan.stage4StartDate !== ""
            ? "To maturity date"
            : plan.stage4EndDate === "To maturity date"
              ? "To maturity date"
              : prepareStageValue(plan.stage4EndDate),
          // Stage interests
          parseFloat(plan.stage1Interest) || 0,
          parseFloat(plan.stage2Interest) || 0,
          parseFloat(plan.stage3Interest) || 0,
          parseFloat(plan.stage4Interest) || 0,
          // 22-carat percentages from plan.carat22Percentages
          parseFloat(carat22Percentages.oneWeek) || 0,
          parseFloat(carat22Percentages.oneMonth) || 0,
          parseFloat(carat22Percentages.threeMonths) || 0,
          parseFloat(carat22Percentages.sixMonths) || 0,
          parseFloat(carat22Percentages.nineMonths) || 0,
          parseFloat(carat22Percentages.twelveMonths) || 0,
          plan.numberOfStages || 0,
          plan.interestApplicableMethod || null,
          plan.lateChargeStage1 || data.lateCharge.lateChargeStage1 || 0,
          plan.lateChargeStage2 || data.lateCharge.lateChargeStage2 || 0,
          plan.lateChargeStage3 || data.lateCharge.lateChargeStage3 || 0,
          plan.lateChargeStage4 || data.lateCharge.lateChargeStage4 || 0,
          plan.lateChargeStage1StartDate !== undefined
            ? plan.lateChargeStage1StartDate
            : data.lateCharge.lateChargeStage1StartDate || 0,
          plan.lateChargeStage1EndDate ||
            data.lateCharge.lateChargeStage1EndDate ||
            null,
          plan.lateChargeStage2StartDate ||
            data.lateCharge.lateChargeStage2StartDate ||
            null,
          plan.lateChargeStage2EndDate ||
            data.lateCharge.lateChargeStage2EndDate ||
            null,
          plan.lateChargeStage3StartDate ||
            data.lateCharge.lateChargeStage3StartDate ||
            null,
          plan.lateChargeStage3EndDate ||
            data.lateCharge.lateChargeStage3EndDate ||
            null,
          plan.lateChargeStage4StartDate ||
            data.lateCharge.lateChargeStage4StartDate ||
            null,
          plan.lateChargeStage4EndDate ||
            data.lateCharge.lateChargeStage4EndDate ||
            null,
          plan.numberOfLateChargeStages ||
            data.lateCharge.numberOfLateChargeStages ||
            0,
        ],
      );

      if (productPlanResult.affectedRows === 0) {
        throw new Error("Failed to create product plan");
      }
      const updatedPlanEarlyStageData =
        extractEarlySettlementStagePayload(plan);
      await connection.query(
        `UPDATE product_plan SET
          early_settlement_stage1_start_day = ?,
          early_settlement_stage1_end_day = ?,
          early_settlement_stage1_value = ?,
          early_settlement_stage1_value_type = ?,
          early_settlement_stage2_start_day = ?,
          early_settlement_stage2_end_day = ?,
          early_settlement_stage2_value = ?,
          early_settlement_stage2_value_type = ?,
          early_settlement_stage3_start_day = ?,
          early_settlement_stage3_end_day = ?,
          early_settlement_stage3_value = ?,
          early_settlement_stage3_value_type = ?,
          early_settlement_stage4_start_day = ?,
          early_settlement_stage4_end_day = ?,
          early_settlement_stage4_value = ?,
          early_settlement_stage4_value_type = ?,
          early_settlement_effect_type = ?
        WHERE idProduct_Plan = ?`,
        [
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage1StartDay
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage1EndDay
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage1Value
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage1ValueType
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage2StartDay
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage2EndDay
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage2Value
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage2ValueType
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage3StartDay
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage3EndDay
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage3Value
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage3ValueType
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage4StartDay
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage4EndDay
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage4Value
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.stage4ValueType
            : null,
          earlySettlementChargeCreateAs === "Charge For Product Item"
            ? updatedPlanEarlyStageData.effectType
            : null,
          productPlanResult.insertId,
        ],
      );
    }

    // Fetch updated product data with full details
    const [updatedProductData] = await connection.query(
      `SELECT 
        idPawning_Product,
        Name,
        Service_Charge,
        Service_Charge_Create_As,
        Service_Charge_Value_type,
        Service_Charge_Value,
        Early_Settlement_Charge,
        Early_Settlement_Charge_Create_As,
        Early_Settlement_Charge_Value_type,
        Early_Settlement_Charge_Value,
        Late_Charge_Status,
        Late_Charge_Create_As,
        Late_Charge,
        Interest_Method
      FROM pawning_product 
      WHERE idPawning_Product = ?`,
      [idPawning_Product],
    );

    // Commit transaction
    await connection.commit();

    // Return success response
    res.status(200).json({
      success: true,
      message: "Pawning product updated successfully",
      product: updatedProductData[0],
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error updating pawning product:", error);
    return next(errorHandler(500, error.message || "Internal Server Error"));
  } finally {
    if (connection) connection.release();
  }
};
