import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";

// Get dashboard card visibility settings
export const getDashboardCardVisibility = async (req, res, next) => {
  try {
    const { userId, companyId } = req;
    const { branchId } = req.params;

 
    // Get card visibility settings for the user, branch, and company
    const [visibilityData] = await pool.query(
      `SELECT card_id, card_type, is_visible 
       FROM dashboard_card_visibility 
       WHERE user_id = ? AND branch_id = ? AND company_id = ?`,
      [userId, branchIdNum, companyId]
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
    const { userId, companyId } = req;
    const { branchId } = req.params;
    const { card_id, card_type, is_visible } = req.body;

    // Validate required fields
    if (!card_id || !card_type || is_visible === undefined) {
      return next(errorHandler(400, "card_id, card_type, and is_visible are required"));
    }

    // Validate card_type
    const validCardTypes = ['summary', 'table', 'chart'];
    if (!validCardTypes.includes(card_type)) {
      return next(errorHandler(400, "card_type must be one of: summary, table, chart"));
    }

    
    // Check if the branch exists
    const [branchExists] = await pool.query(
      "SELECT idBranch FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
      [branchIdNum, companyId]
    );

    if (!branchExists[0]) {
      return next(errorHandler(404, "Branch not found"));
    }

    // Insert or update the card visibility setting
    const [result] = await pool.query(
      `INSERT INTO dashboard_card_visibility 
       (user_id, branch_id, company_id, card_id, card_type, is_visible, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE 
       is_visible = VALUES(is_visible), 
       updated_at = NOW()`,
      [userId, branchIdNum, companyId, card_id, card_type, is_visible]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update card visibility"));
    }

    console.log("Dashboard card visibility updated successfully");
    res.status(200).json({
      message: "Dashboard card visibility updated successfully",
       card_id,
       card_type,
       is_visible  
    });
  } catch (error) {
    console.error("Error updating dashboard card visibility:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};



// Reset all dashboard card visibility settings for a user in a branch
export const resetDashboardCardVisibility = async (req, res, next) => {
  try {
    const { userId, companyId } = req;
    const { branchId } = req.params;

    // Delete all card visibility settings for the user in this branch
    const [result] = await pool.query(
      `DELETE FROM dashboard_card_visibility 
       WHERE user_id = ? AND branch_id = ? AND company_id = ?`,
      [userId, branchIdNum, companyId]
    );

    console.log("Dashboard card visibility reset successfully");
    res.status(200).json({
      message: "Dashboard card visibility reset successfully",
    });
  } catch (error) {
    console.error("Error resetting dashboard card visibility:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

