import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";

// Send UI cards , tables and charts to frontend with their visibility status and colors
export const getDashboardUIComponents = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
        dc.card_id AS id,
        dc.card_name AS name,
        dc.card_category AS category,
        ucv.is_visible,
        ucv.bg_color,
        ucv.font_color
      FROM dashboard_cards dc
      LEFT JOIN user_card_visibility ucv
        ON dc.card_id = ucv.card_id
        AND ucv.branch_id = ?
        AND ucv.company_id = ?`,
      [req.branchId, req.companyId]
    );

    if (!rows || rows.length === 0) {
      return next(errorHandler(404, "No dashboard UI components found"));
    }

    const uiComponentsWithData = rows.map((row) => {
      const base = {
        id: row.id,
        name: row.name,
        category: row.category,
      };

      base.visibility = row.is_visible || 0;
      base.bg_color = row.bg_color || null;
      base.font_color = row.font_color || null;

      return base;
    });

    res.status(200).json({
      success: true,
      message: "Dashboard UI components fetched successfully",
      uiComponentsWithData,
    });
  } catch (error) {
    console.error("Error fetching dashboard UI components:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Update or create dashboard card visibility setting
export const updateDashboardCardVisibility = async (req, res, next) => {
  try {
    const card_id = req.params.card_id || req.params.id;
    const { is_visible } = req.body;

    if (!card_id || is_visible === undefined) {
      return next(
        errorHandler(400, "Card ID and visibility status are required")
      );
    }

    // check if the record already exists
    const [existingVisibilityRecord] = await pool.query(
      "SELECT 1 FROM user_card_visibility WHERE card_id = ? AND branch_id = ? AND company_id = ?",
      [card_id, req.branchId, req.companyId]
    );

    let result;
    if (existingVisibilityRecord.length > 0) {
      // Update existing record
      [result] = await pool.query(
        "UPDATE user_card_visibility SET is_visible = ? WHERE card_id = ? AND branch_id = ? AND company_id = ?",
        [is_visible, card_id, req.branchId, req.companyId]
      );

      if (result.affectedRows === 0) {
        return next(errorHandler(404, "Visibility record not found"));
      }
    } else {
      // Insert the record if it doesn't exist
      [result] = await pool.query(
        "INSERT INTO user_card_visibility (card_id, branch_id, company_id, is_visible) VALUES (?, ?, ?, ?)",
        [card_id, req.branchId, req.companyId, is_visible]
      );

      if (result.affectedRows === 0) {
        return next(errorHandler(500, "Failed to create visibility record"));
      }
    }

    res.status(200).json({
      success: true,
      message: "Dashboard card visibility updated successfully",
      cardVisibility: {
        card_id,
        is_visible,
      },
    });
  } catch (error) {
    console.error("Error updating dashboard card visibility:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
// Update dashboard card colors
export const updateDashboardCardColors = async (req, res, next) => {
  try {
    const card_id = req.params.card_id || req.params.id;
    const { bg_color, font_color } = req.body;

    if (!bg_color && !font_color) {
      return next(
        errorHandler(400, "Both background and font colors are required")
      );
    }

    const [existingColorRecord] = await pool.query(
      "SELECT 1 FROM user_card_visibility WHERE card_id = ? AND branch_id = ? AND company_id = ?",
      [card_id, req.branchId, req.companyId]
    );

    let result;
    if (existingColorRecord.length > 0) {
      // Update existing record
      [result] = await pool.query(
        "UPDATE user_card_visibility SET bg_color = ?, font_color = ? WHERE card_id = ? AND branch_id = ? AND company_id = ?",
        [bg_color, font_color, card_id, req.branchId, req.companyId]
      );

      if (result.affectedRows === 0) {
        return next(errorHandler(404, "Color record not found"));
      }
    }

    // Insert the record if it doesn't exist
    else {
      [result] = await pool.query(
        "INSERT INTO user_card_visibility (card_id, branch_id, company_id, bg_color, font_color, is_visible) VALUES (?, ?, ?, ?, ?, ?)",
        [card_id, req.branchId, req.companyId, bg_color, font_color, 1]
      );
    }

    res.status(200).json({
      success: true,
      message: "Dashboard card colors updated successfully",
      cardColors: {
        card_id,
        bg_color,
        font_color,
      },
    });
  } catch (error) {
    console.error("Error updating dashboard card colors:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
