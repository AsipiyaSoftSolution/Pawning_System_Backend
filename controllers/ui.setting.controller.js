import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";

// Get dashboard card visibility settings
export const getDashboardCardVisibility = async (req, res, next) => {
  try {
    const branchIdNum = req.branchId; // Get from branch middleware
    const companyIdNum = req.companyId; // Get from auth middleware

    // Get card visibility settings for the branch and company
    const [visibilityData] = await pool.query(
      `SELECT card_id, is_visible, bg_color, font_color 
       FROM user_card_visibility 
       WHERE branch_id = ? AND company_id = ?`,
      [branchIdNum, companyIdNum]
    );

    console.log("Dashboard card visibility fetched successfully:", visibilityData);
    res.status(200).json({
      message: "Dashboard card visibility fetched successfully",
      visibilityData   
    });
  } catch (error) {
    console.error("Error fetching dashboard card visibility:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Update or create dashboard card visibility setting
export const updateDashboardCardVisibility = async (req, res, next) => {
  try {
    const branchIdNum = req.branchId; // Get from branch middleware
    const companyIdNum = req.companyId; // Get from auth middleware
    const { card_id, is_visible, bg_color = '#ffffff', font_color = '#000000' } = req.body;

    // Validate required fields
    if (!card_id || is_visible === undefined) {
      return next(errorHandler(400, "card_id and is_visible are required"));
    }

    // Check if the branch exists
    const [branchExists] = await pool.query(
      "SELECT idBranch FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
      [branchIdNum, companyIdNum]
    );

    if (!branchExists[0]) {
      return next(errorHandler(404, "Branch not found"));
    }

    // Insert or update the card visibility setting
    const [result] = await pool.query(
      `INSERT INTO user_card_visibility 
       (branch_id, company_id, card_id, is_visible, bg_color, font_color, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE 
       is_visible = VALUES(is_visible), 
       bg_color = VALUES(bg_color), 
       font_color = VALUES(font_color),
       updated_at = NOW()`,
      [branchIdNum, companyIdNum, card_id, is_visible, bg_color, font_color]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update card visibility"));
    }

    console.log("Dashboard card visibility updated successfully");
    res.status(200).json({
      message: "Dashboard card visibility updated successfully",
      card_id,
      is_visible,
      bg_color,
      font_color
    });
  } catch (error) {
    console.error("Error updating dashboard card visibility:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};




