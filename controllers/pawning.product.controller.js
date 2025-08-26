import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";

// Get a specific pawning product's all data by ID
export const getPawningProductById = async (req, res, next) => {
  try {
    const productId = req.params.productId || req.params.id;
    if (!productId) {
      return next(errorHandler(400, "Product ID is required"));
    }
    if (!req.branchId) {
      return next(errorHandler(400, "Branch ID is required"));
    }

    // Get data from Pawning Product table
    let pawningProduct;

    const [productTable] = await pool.query(
      `SELECT * FROM pawning_product WHERE idPawning_Product = ? AND Branch_idBranch = ?`,
      [productId, req.branchId]
    );

    if (productTable.length === 0) {
      return next(errorHandler(404, "Pawning product not found"));
    }

    pawningProduct = productTable[0];

    // Get data from Product Plan table

    const [productPlan] = await pool.query(
      `SELECT * FROM product_plan WHERE Pawning_Product_idPawning_Product = ?`,
      [productId]
    );

    pawningProduct = {
      ...pawningProduct,
      ProductPlan: productPlan.length > 0 ? productPlan[0] : null,
    };

    res.status(200).json({
      success: true,
      pawningProduct,
    });
  } catch (error) {
    console.error("Error fetching pawning product by ID:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Get all pawning products for a specific branch with pagination
export const getPawningProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10
    const offset = (page - 1) * limit;
    console.log("params of get pawning products", req.query);
    console.log("page", page, "limit", limit, "offset", offset);

    const paginationData = await getPaginationData(
      "SELECT COUNT(*) AS total FROM pawning_product WHERE Branch_idBranch = ?",
      [req.branchId],
      page,
      limit
    );

    const [pawningProducts] = await pool.query(
      `SELECT idPawning_Product,Name,Interest_Method FROM pawning_product WHERE Branch_idBranch = ? LIMIT ? OFFSET ?`,
      [req.branchId, limit, offset]
    );
    console.log("fetched pawning products:", pawningProducts);

    if (pawningProducts.length === 0) {
      return next(
        errorHandler(404, "No pawning products found for this branch")
      );
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
      [productId, req.branchId]
    );

    if (existingProduct.length === 0) {
      return next(errorHandler(404, "Pawning product not found"));
    }

    // Delete from Product Plan table first
    const [result] = await pool.query(
      `DELETE FROM product_plan WHERE Pawning_Product_idPawning_Product = ?`,
      [productId]
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

// Create a new pawning product for a specific branch
// Create a new pawning product for a specific branch
export const createPawningProduct = async (req, res, next) => {
  try {
    const { data } = req.body;
    if (!data) {
      return next(errorHandler(400, "Product data is required"));
    }

    // Ready the data of service charge for pawning product table
    const serviceCharge = data.serviceCharge?.status === "Active" ? 1 : 0;
    const serviceChargeCreateAs = data.serviceCharge?.chargeType || null;
    const serviceChargeValueType = data.serviceCharge?.valueType || null;
    const serviceChargeValue = data.serviceCharge?.value || 0;

    // Ready the data of early settlement for pawning product table and early settlement charges table
    const earlySettlementCharge =
      data.earlysettlementsData?.newEarlySettlement?.status === "Active"
        ? 1
        : 0;
    const earlySettlementChargeCreateAs =
      data.earlysettlementsData?.newEarlySettlement?.chargeType || null;
    let earlySettlementChargeValueType = null;
    let earlySettlementChargeValue = null;

    // Handle different early settlement charge types
    if (earlySettlementChargeCreateAs === "Charge For Product") {
      earlySettlementChargeValueType =
        data.earlysettlementsData?.newEarlySettlement?.valueType || null;
      earlySettlementChargeValue =
        data.earlysettlementsData?.newEarlySettlement?.value || null;
    }

    // Ready the late charge data for pawning product table
    const lateCharge = data.lateCharge.status === "Active" ? 1 : 0;
    const lateChargeCreateAs = data.lateCharge.chargeType || null;
    const lateChargePresentage = data.lateCharge.percentage || 0;

    // Insert into Pawning product table first
    const [result] = await pool.query(
      "INSERT INTO pawning_product (Branch_idBranch,Name,Service_Charge,Service_Charge_Create_As,Service_Charge_Value_type,Service_Charge_Value,Early_Settlement_Charge,Early_Settlement_Charge_Create_As,Early_Settlement_Charge_Value_type,Early_Settlement_Charge_Value,Late_Charge_Status,Late_Charge_Create_As,Late_Charge,Interest_Method,Last_Updated_User,Last_Updated_Time) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        req.branchId,
        data.productName || "Unnamed Product",
        serviceCharge,
        serviceChargeCreateAs,
        serviceChargeValueType,
        serviceChargeValue,
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
      ]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create pawning product"));
    }

    // Handle early settlement charges if charge type is "Charge For Settlement Amount"
    if (earlySettlementChargeCreateAs === "Charge For Settlement Amount") {
      const earlySettlements = data.earlysettlementsData?.earlySettlements;

      if (!earlySettlements) {
        return next(
          errorHandler(
            400,
            "Early settlement data is required for settlement amount charges"
          )
        );
      }

      // Convert to array if it's a single object
      const settlementsArray = Array.isArray(earlySettlements)
        ? earlySettlements
        : [earlySettlements];

      // Insert multiple early settlement charges
      const insertPromises = settlementsArray.map(async (settlement) => {
        const fromAmount = settlement.lessThan || 0;
        const toAmount = settlement.endAmount || 0;
        const valueType = settlement.valueType || null;
        const value = settlement.value || null;

        const [earlySettlementResult] = await pool.query(
          "INSERT INTO early_settlement_charges (From_Amount,To_Amount,Value_Type,Amount,Pawning_Product_idPawning_Product) VALUES (?,?,?,?,?)",
          [fromAmount, toAmount, valueType, value, result.insertId]
        );

        if (earlySettlementResult.affectedRows === 0) {
          throw new Error("Failed to create early settlement charge record");
        }

        return earlySettlementResult;
      });

      // Wait for all insertions to complete
      try {
        await Promise.all(insertPromises);
      } catch (error) {
        console.error("Error inserting early settlement charges:", error);
        return next(
          errorHandler(500, "Failed to create early settlement charges")
        );
      }
    }

    // Insert into product plan table
    const productPlans = data.productItems;

    if (!productPlans || productPlans.length === 0) {
      return next(errorHandler(400, "At least one product item is required"));
    }

    for (const plan of productPlans) {
      const [productPlanResult] = await pool.query(
        "INSERT INTO product_plan (Period_Type,Minimum_Period,Maximum_Period,Minimum_Amount,Maximum_Amount,Interest_type,Interest,Interest_Calculate_After,Service_Charge_Value_type,Service_Charge_Value,Early_Settlement_Charge_Value_type,Early_Settlement_Charge_Value,Late_Charge,Amount_For_22_Caratage,Last_Updated_User,Last_Updated_Time,Pawning_Product_idPawning_Product)  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
          plan.periodType,
          plan.minPeriod,
          plan.maxPeriod,
          plan.minAmount,
          plan.maxAmount,
          plan.interestType,
          plan.interest || 0,
          plan.interestAfter,
          plan.serviceChargeValueType,
          plan.serviceChargeValue || 0,
          plan.earlySettlementChargeValueType,
          plan.earlySettlementChargeValue || 0,
          plan.lateChargePerDay || 0,
          plan.amount22Carat,
          req.userId,
          new Date(),
          result.insertId,
        ]
      );

      if (productPlanResult.affectedRows === 0) {
        return next(errorHandler(500, "Failed to create product plan"));
      }
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: "Pawning product created successfully",
    });
  } catch (error) {
    console.error("Error creating pawning product:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
