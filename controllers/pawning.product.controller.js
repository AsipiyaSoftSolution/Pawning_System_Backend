import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";

export const createPawningProduct = async (req, res, next) => {
  try {
    const {
      // Data from Pawning Product table
      Name,
      Service_Charge,
      Service_Charge_Create_As,
      Service_Charge_Value_type,
      Service_Charge_Value,
      Early_Settlement_Charge,
      Early_Settlement_Charge_Create_As,
      Early_Settlement_Charge_Value_type,
      Late_Charge_Status,
      Early_Settlement_Charge_Value,
      Late_Charge_Create_As,
      Late_Charge,
      Interest_Method,

      // Data from Product Plan table
      Period_Type,
      Minimum_Period,
      Maximum_Period,
      Minimum_Amount,
      Maximum_Amount,
      Interest_type,
      Interest,
      Interest_Calculate_After,
      Service_Charge_Value_type_for_product_plan,
      Service_Charge_Value_for_product_plan,
      Early_Settlement_Charge_Value_type_for_product_plan,
      Early_Settlement_Charge_Value_for_product_plan,
      Late_Charge_for_product_plan,
      Amount_For_22_Caratage,
    } = req.body;

    if (!req.branchId) {
      return next(errorHandler(400, "Branch ID is required"));
    }

    if (!Service_Charge || !Early_Settlement_Charge || !Late_Charge_Status) {
      return next(
        errorHandler(
          400,
          "Service Charge, Early Settlement Charge and Late Charge Status are required to create a pawning product"
        )
      );
    }

    if (Service_Charge === "active") {
      if (Service_Charge_Create_As === "charge-for-product") {
        if (!Service_Charge_Value_type || !Service_Charge_Value) {
          return next(
            errorHandler(
              400,
              "Service Charge Value Type and Value are required when Service Charge is active and Service Charge Create As is charge-for-product"
            )
          );
        }
      } else if (Service_Charge_Create_As === "charge-for-product-item") {
        if (
          !Service_Charge_Value_type_for_product_plan ||
          !Service_Charge_Value_for_product_plan
        ) {
          return next(
            errorHandler(
              400,
              "Service Charge Value Type and Value for product plan are required when Service Charge is active and Service Charge Create As is charge-for-product-item"
            )
          );
        }
      }
    }

    if (Early_Settlement_Charge === "active") {
      if (
        Early_Settlement_Charge_Create_As === "charge-for-product" ||
        Early_Settlement_Charge_Create_As === "charge-for-settlement-amount"
      ) {
        if (
          !Early_Settlement_Charge_Value_type ||
          !Early_Settlement_Charge_Value
        ) {
          return next(
            errorHandler(
              400,
              "Early Settlement Charge Value Type and Value are required when Early Settlement Charge is active and Early Settlement Charge Create As is charge-for-product"
            )
          );
        }
      } else if (
        Early_Settlement_Charge_Create_As === "charge-for-product-item"
      ) {
        if (
          !Early_Settlement_Charge_Value_type_for_product_plan ||
          !Early_Settlement_Charge_Value_for_product_plan
        ) {
          return next(
            errorHandler(
              400,
              "Early Settlement Charge Value Type and Value for product plan are required when Early Settlement Charge is active and Early Settlement Charge Create As is charge-for-product-item"
            )
          );
        }
      }
    }

    if (Late_Charge_Status === "active") {
      if (Late_Charge_Create_As === "charge-for-product") {
        if (!Late_Charge) {
          return next(
            errorHandler(
              400,
              "Late Charge is required when Late Charge Status is active and Late Charge Create As is charge-for-product"
            )
          );
        }
      } else if (Late_Charge_Create_As === "charge-for-product-item") {
        if (!Late_Charge_for_product_plan) {
          return next(
            errorHandler(
              400,
              "Late Charge for product item is required when Late Charge Status is active and Late Charge Create As is charge-for-product-item"
            )
          );
        }
      }
    }

    // Insert data into Pawning Product table
    const productQuery = `
      INSERT INTO pawning_product (
        Name, Service_Charge, Service_Charge_Create_As, Service_Charge_Value_type,
        Service_Charge_Value, Early_Settlement_Charge, Early_Settlement_Charge_Create_As,
        Early_Settlement_Charge_Value_type,Early_Settlement_Charge_Value, Late_Charge_Status, 
        Late_Charge_Create_As, Late_Charge, Interest_Method, Branch_idBranch, Last_Updated_User, Last_Updated_Time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [pawningProductResult] = await pool.query(productQuery, [
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
      req.branchId,
      req.userId,
      new Date(),
    ]);

    if (pawningProductResult.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create pawning product"));
    }

    // Insert data into Product Plan table
    const productPlanQuery = `
      INSERT INTO product_plan (
        Pawning_Product_idPawning_Product, Period_Type, Minimum_Period, Maximum_Period,
        Minimum_Amount, Maximum_Amount, Interest_type, Interest, Interest_Calculate_After,
        Service_Charge_Value_type, Service_Charge_Value, Early_Settlement_Charge_Value_type,
        Early_Settlement_Charge_Value, Late_Charge, Amount_For_22_Caratage, Last_Updated_User, Last_Updated_Time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [productPlanResult] = await pool.query(productPlanQuery, [
      pawningProductResult.insertId,
      Period_Type,
      Minimum_Period,
      Maximum_Period,
      Minimum_Amount,
      Maximum_Amount,
      Interest_type,
      Interest,
      Interest_Calculate_After,
      Service_Charge_Value_type_for_product_plan || null,
      Service_Charge_Value_for_product_plan || 0,
      Early_Settlement_Charge_Value_type_for_product_plan || null,
      Early_Settlement_Charge_Value_for_product_plan || 0,
      Late_Charge_for_product_plan || 0,
      Amount_For_22_Caratage || 0,
      req.userId,
      new Date(),
    ]);

    if (productPlanResult.affectedRows === 0) {
      return next(
        errorHandler(500, "Product created but failed to create product plan")
      );
    }

    res.status(201).json({
      success: true,
      message: "Pawning product created successfully",
      productId: pawningProductResult.insertId,
    });
  } catch (error) {
    console.error("Error creating pawning product:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

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

    if (!req.branchId) {
      return next(errorHandler(400, "Branch ID is required"));
    }

    const paginationData = await getPaginationData(
      "SELECT COUNT(*) AS total FROM pawning_product WHERE Branch_idBranch = ?",
      [req.branchId],
      page,
      limit
    );

    let pawningProducts;
    // Get data from Pawning Product table
    const [dataFromPawningProductTable] = await pool.query(
      `SELECT idPawning_Product,Name FROM pawning_product WHERE Branch_idBranch = ? LIMIT ? OFFSET ?`,
      [req.branchId, limit, offset]
    );

    if (dataFromPawningProductTable.length === 0) {
      return next(
        errorHandler(404, "No pawning products found for this branch")
      );
    }

    // Map the data to the desired format
    pawningProducts = dataFromPawningProductTable.map((product) => ({
      id: product.idPawning_Product,
      name: product.Name,
    }));

    for (const product of pawningProducts) {
      // Get product plan for each pawning product
      const [productPlan] = await pool.query(
        `SELECT Interest_type,Interest_Calculate_After,Interest FROM product_plan WHERE Pawning_Product_idPawning_Product = ?`,
        [product.id]
      );
      product.interestType =
        productPlan.length > 0 ? productPlan[0].Interest_type : null;
      product.interestCalculateAfter =
        productPlan.length > 0 ? productPlan[0].Interest_Calculate_After : null;
      product.interest =
        productPlan.length > 0 ? productPlan[0].Interest : null;
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
