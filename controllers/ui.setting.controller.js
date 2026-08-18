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

    const hasSavedVisibility = rows.some(
      (row) => row.is_visible !== null && row.is_visible !== undefined,
    );
    const anyVisible = rows.some((row) => Number(row.is_visible) === 1);
    // Head office with no cards turned on would otherwise render an empty board.
    const defaultVisible =
      !hasSavedVisibility || (req.isHeadBranch && !anyVisible);

    const uiComponentsWithData = rows.map((row) => {
      const base = {
        id: row.id,
        name: row.name,
        category: row.category,
      };

      base.visibility = defaultVisible ? 1 : Number(row.is_visible) || 0;
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

    let cardName = null;
    try {
      const [cardRows] = await pool.query(
        "SELECT card_name FROM dashboard_cards WHERE card_id = ?",
        [card_id],
      );
      cardName = cardRows[0]?.card_name || null;
    } catch {
      /* ignore */
    }

    const turnedOn = Number(is_visible) === 1;
    req.activityLogAction = cardName
      ? turnedOn
        ? `Turned on dashboard card “${cardName}”`
        : `Turned off dashboard card “${cardName}”`
      : turnedOn
        ? "Turned on a dashboard card"
        : "Turned off a dashboard card";
    req.activityLogMetadata = {
      cardId: Number(card_id),
      cardName,
      isVisible: Number(is_visible),
    };

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

    let cardName = null;
    try {
      const [cardRows] = await pool.query(
        "SELECT card_name FROM dashboard_cards WHERE card_id = ?",
        [card_id],
      );
      cardName = cardRows[0]?.card_name || null;
    } catch {
      /* ignore */
    }

    req.activityLogAction = cardName
      ? `Updated colors for dashboard card “${cardName}”`
      : "Updated dashboard card colors";
    req.activityLogMetadata = {
      cardId: Number(card_id),
      cardName,
      bgColor: bg_color,
      fontColor: font_color,
    };

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
        "INSERT INTO user_card_visibility (card_id, branch_id, company_id, bg_color, font_color) VALUES (?, ?, ?, ?, ?)",
        [card_id, req.branchId, req.companyId, bg_color, font_color]
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
