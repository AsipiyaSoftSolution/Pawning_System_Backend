import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";

export const createPawningProduct = async (req, res, next) => {
  try {
    // Validate required fields for main product
    const productFields = [
      "Name",
      "Service_Charge",
      "Service_Charge_Create_As",
      "Service_Charge_Value_type",
      "Service_Charge_Value",
      "Early_Settlement_Charge",
      "Early_Settlement_Charge_Create_As",
      "Early_Settlement_Charge_Value_type",
      "Late_Charge_Status",
      "Early_Settlement_Charge_Value",
      "Early_Settlement_Charge_Type",
      "Late_Charge_Create_As",
      "Late_Charge",
      "Interest_Method",
    ];

    const missingProductFields = productFields.filter(
      (field) => !req.body[field]
    );
    if (missingProductFields.length > 0) {
      return next(
        errorHandler(
          400,
          `Missing required product fields: ${missingProductFields.join(", ")}`
        )
      );
    }

    // Validate required fields for product plan
    const planFields = [
      "Period_Type",
      "Minimum_Period",
      "Maximum_Period",
      "Minimum_Amount",
      "Maximum_Amount",
      "Interest_type",
      "Interest",
      "Interest_Calculate_After",
      "Amount_For_22_Caratage",
    ];

    const missingPlanFields = planFields.filter((field) => !req.body[field]);
    if (missingPlanFields.length > 0) {
      return next(
        errorHandler(
          400,
          `Missing required plan fields: ${missingPlanFields.join(", ")}`
        )
      );
    }

    // Check if branch ID is provided
    if (!req.branchId) {
      return next(errorHandler(400, "Branch ID is required"));
    }

    // Insert main product
    const productValues = productFields.map((field) => req.body[field]);
    productValues.push(req.branchId);
    productValues.push(req.userId);
    productValues.push(new Date());

    const [productResult] = await pool.query(
      `INSERT INTO pawning_products (
        Name, Service_Charge, Service_Charge_Create_As, Service_Charge_Value_type, 
        Service_Charge_Value, Early_Settlement_Charge, Early_Settlement_Charge_Create_As, 
        Early_Settlement_Charge_Value_type, Late_Charge_Status, Early_Settlement_Charge_Value, 
        Early_Settlement_Charge_Type, Late_Charge_Create_As, Late_Charge, Interest_Method, 
        Branch_Id, Last_Updated_User, Last_Updated_Time
      ) VALUES (${productFields.map(() => "?").join(", ")}, ?, ?, ?)`,
      productValues
    );

    if (productResult.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create pawning product"));
    }

    const productId = productResult.insertId;

    // Insert product plan
    const planFieldsList = [
      "Period_Type",
      "Minimum_Period",
      "Maximum_Period",
      "Minimum_Amount",
      "Maximum_Amount",
      "Interest_type",
      "Interest",
      "Interest_Calculate_After",
      "Service_Charge_Value_type",
      "Service_Charge_Value",
      "Early_Settlement_Charge",
      "Late_Charge",
      "Amount_For_22_Caratage",
    ];

    const planValues = planFieldsList.map((field) => req.body[field]);
    planValues.push(req.userId);
    planValues.push(new Date());
    planValues.push(productId);

    const [planResult] = await pool.query(
      `INSERT INTO product_plan (
        Period_Type, Minimum_Period, Maximum_Period, Minimum_Amount, 
        Maximum_Amount, Interest_type, Interest, Interest_Calculate_After,
        Service_Charge_Value_type, Service_Charge_Value, 
        Early_Settlement_Charge, Late_Charge, Amount_For_22_Caratage,
        Last_Updated_User, Last_Updated_Time, Pawning_Product_idPawning_Product
      ) VALUES (${planFieldsList.map(() => "?").join(", ")}, ?, ?, ?)`,
      planValues
    );

    if (planResult.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create product plan"));
    }

    res.status(201).json({
      success: true,
      message: "Pawning product created successfully",
    });
  } catch (error) {
    console.error("Error creating pawning product:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

export const getPawningProductById = async (req, res, next) => {
  try {
    const productId = req.params.id;
    if (!productId) {
      return next(errorHandler(400, "Product ID is required"));
    }
    if (!req.branchId) {
      return next(errorHandler(400, "Branch ID is required"));
    }

    // Get data from Pawning Product table
    let pawningProduct;

    const [productTable] = await pool.query(
      `SELECT * FROM pawning_products WHERE idPawning_Product = ? AND Branch_Id = ?`,
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
