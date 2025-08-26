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

// Create a new pawning product for a specific branch
export const createPawningProduct = async (req, res, next) => {
  try {
  } catch (error) {}
};
