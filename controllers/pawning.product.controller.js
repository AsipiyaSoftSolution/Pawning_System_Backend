import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";

// Function to get user  data by userId and companyId to display last updated user info when fetching pawning product details
const returnUserData = async (userId, companyId) => {
  try {
    if (!userId || !companyId) return null;
    const [user] = await pool.query(
      "SELECT idUser,Full_name,Email FROM user WHERE idUser = ? AND Company_idCompany = ?",
      [userId, companyId]
    );
    if (user.length === 0) return null;
    return user[0];
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw new Error("Failed to fetch user data", error);
  }
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
        Early_Settlement_Charge,
        Early_Settlement_Charge_Create_As,
        Early_Settlement_Charge_Value_type,
        Early_Settlement_Charge_Value,
        Late_Charge_Status,
        Late_Charge_Create_As,
        Late_Charge,
        Interest_Method,
        Last_Updated_User,
        Last_Updated_Time
      FROM pawning_product 
      WHERE idPawning_Product = ?`,
      [idPawning_Product]
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
      [idPawning_Product]
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
        Last_Updated_Time
      FROM product_plan 
      WHERE Pawning_Product_idPawning_Product = ?`,
      [idPawning_Product]
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
      },

      // Early settlement data
      earlysettlementsData: {
        newEarlySettlement: {
          status:
            product.Early_Settlement_Charge === "1" ? "Active" : "Inactive",
          chargeType: product.Early_Settlement_Charge_Create_As,
          valueType: product.Early_Settlement_Charge_Value_type,
          value: product.Early_Settlement_Charge_Value,
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
      productItems: productPlanRows.map((plan) => ({
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
        earlySettlementChargeValueType: plan.Early_Settlement_Charge_Value_type,
        earlySettlementChargeValue: plan.Early_Settlement_Charge_Value,
        lateChargePerDay: plan.Late_Charge,
        amount22Carat: plan.Amount_For_22_Caratage,
        lastUpdatedUser: plan.Last_Updated_User,
        lastUpdatedTime: plan.Last_Updated_Time,
      })),

      lastUpdatedUser: await returnUserData(
        product.Last_Updated_User,
        req.companyId
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
    console.log("params of get pawning products", req.query);
    console.log("page", page, "limit", limit, "offset", offset);

    const paginationData = await getPaginationData(
      "SELECT COUNT(*) AS total FROM pawning_product WHERE Branch_idBranch = ?",
      [req.branchId],
      page,
      limit
    );

    let pawningProducts;
    [pawningProducts] = await pool.query(
      `SELECT idPawning_Product,Name,Interest_Method,Service_Charge,Early_Settlement_Charge,Late_Charge_Status FROM pawning_product WHERE Branch_idBranch = ? LIMIT ? OFFSET ?`,
      [req.branchId, limit, offset]
    );
    console.log("fetched pawning products:", pawningProducts);

    // find number of active tickets for each product
    for (let product of pawningProducts) {
      const [activeTickets] = await pool.query(
        `SELECT COUNT(*) AS activeCount FROM pawning_ticket WHERE Pawning_Product_idPawning_Product = ? AND Status != '2'`,
        [product.idPawning_Product]
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
export const createPawningProduct = async (req, res, next) => {
  try {
    const { data } = req.body;
    if (!data) {
      return next(errorHandler(400, "Product data is required"));
    }

    // Ready the data of service charge for pawning product table
    const serviceCharge = data.serviceCharge?.status === "Active" ? 1 : 0;
    const serviceChargeCreateAs = data.serviceCharge?.chargeType || "inactive";
    const serviceChargeValueType = data.serviceCharge?.valueType || "inactive";
    const serviceChargeValue = data.serviceCharge?.value || 0;

    // Ready the data of early settlement for pawning product table and early settlement charges table
    const earlySettlementCharge =
      data.earlysettlementsData?.newEarlySettlement?.status === "Active"
        ? 1
        : 0;
    const earlySettlementChargeCreateAs =
      data.earlysettlementsData?.newEarlySettlement?.chargeType || "inactive";
    let earlySettlementChargeValueType = null;
    let earlySettlementChargeValue = null;

    // Handle different early settlement charge types
    if (earlySettlementChargeCreateAs === "Charge For Product") {
      earlySettlementChargeValueType =
        data.earlysettlementsData?.newEarlySettlement?.valueType || "inactive";
      earlySettlementChargeValue =
        data.earlysettlementsData?.newEarlySettlement?.value || "inactive";
    }

    // Ready the late charge data for pawning product table
    const lateCharge = data.lateCharge.status === "Active" ? 1 : 0;
    const lateChargeCreateAs = data.lateCharge.chargeType || "inactive";
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

    const interestMethod = data.interestMethod || null;
    // Insert into product plan table
    const productPlans = data.productItems;

    if (!productPlans || productPlans.length === 0) {
      return next(errorHandler(400, "At least one product item is required"));
    }

    for (const plan of productPlans) {
      const amount22CaratValue =
        interestMethod === "Interest For Pawning Amount"
          ? data.amount22
          : plan.amount22Carat;
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
          plan.serviceChargeValueType || serviceChargeValueType || "inactive",
          plan.serviceChargeValue || serviceChargeValue || 0,
          plan.earlySettlementChargeValueType ||
            earlySettlementChargeValueType ||
            "inactive",
          plan.earlySettlementChargeValue || earlySettlementChargeValue || 0,
          plan.lateChargePerDay || lateChargePresentage || 0,
          amount22CaratValue,
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

// Update/Edit a pawning product by ID
export const updatePawningProductById = async (req, res, next) => {
  try {
    const idPawning_Product = req.params.productId || req.params.id;
    const { data } = req.body;

    if (!idPawning_Product) {
      return next(errorHandler(400, "Product ID is required"));
    }

    if (!data) {
      return next(errorHandler(400, "Product data is required"));
    }

    // Check if product exists and belongs to the branch
    const [existingProduct] = await pool.query(
      "SELECT * FROM pawning_product WHERE idPawning_Product = ? AND Branch_idBranch = ?",
      [idPawning_Product, req.branchId]
    );

    if (existingProduct.length === 0) {
      return next(
        errorHandler(404, "Pawning product not found or access denied")
      );
    }

    // Ready the data of service charge for pawning product table
    const serviceCharge = data.serviceCharge?.status === "Active" ? 1 : 0;
    const serviceChargeCreateAs = data.serviceCharge?.chargeType || null;
    const serviceChargeValueType = data.serviceCharge?.valueType || null;
    const serviceChargeValue = data.serviceCharge?.value || 0;

    // Ready the data of early settlement for pawning product table
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
    const lateCharge = data.lateCharge?.status === "Active" ? 1 : 0;
    const lateChargeCreateAs = data.lateCharge?.chargeType || null;
    const lateChargePresentage = data.lateCharge?.percentage || 0;

    // Update the main pawning product table
    const [updateResult] = await pool.query(
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
        Last_Updated_Time = ?
      WHERE idPawning_Product = ?`,
      [
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
        idPawning_Product,
      ]
    );

    if (updateResult.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update pawning product"));
    }

    // Delete existing early settlement charges
    await pool.query(
      "DELETE FROM early_settlement_charges WHERE Pawning_Product_idPawning_Product = ?",
      [idPawning_Product]
    );

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

      // Insert new early settlement charges
      const insertPromises = settlementsArray.map(async (settlement) => {
        const fromAmount = settlement.lessThan || 0;
        const toAmount = settlement.endAmount || 0;
        const valueType = settlement.valueType || null;
        const value = settlement.value || null;

        const [earlySettlementResult] = await pool.query(
          "INSERT INTO early_settlement_charges (From_Amount,To_Amount,Value_Type,Amount,Pawning_Product_idPawning_Product) VALUES (?,?,?,?,?)",
          [fromAmount, toAmount, valueType, value, idPawning_Product]
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

    // Delete existing product plans
    await pool.query(
      "DELETE FROM product_plan WHERE Pawning_Product_idPawning_Product = ?",
      [idPawning_Product]
    );

    // Insert updated product plans
    const productPlans = data.productItems;

    if (!productPlans || productPlans.length === 0) {
      return next(errorHandler(400, "At least one product item is required"));
    }

    for (const plan of productPlans) {
      const [productPlanResult] = await pool.query(
        "INSERT INTO product_plan (Period_Type,Minimum_Period,Maximum_Period,Minimum_Amount,Maximum_Amount,Interest_type,Interest,Interest_Calculate_After,Service_Charge_Value_type,Service_Charge_Value,Early_Settlement_Charge_Value_type,Early_Settlement_Charge_Value,Late_Charge,Amount_For_22_Caratage,Last_Updated_User,Last_Updated_Time,Pawning_Product_idPawning_Product) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
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
          idPawning_Product,
        ]
      );

      if (productPlanResult.affectedRows === 0) {
        return next(errorHandler(500, "Failed to create product plan"));
      }
    }

    const [updatedProductData] = await pool.query(
      "SELECT idPawning_Product,Name,Service_Charge,Early_Settlement_Charge,Late_Charge_Status,Interest_Method FROM pawning_product WHERE idPawning_Product = ?",
      [idPawning_Product]
    );

    // Return success response
    res.status(200).json({
      success: true,
      message: "Pawning product updated successfully",
      product: updatedProductData[0],
    });
  } catch (error) {
    console.error("Error updating pawning product:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
