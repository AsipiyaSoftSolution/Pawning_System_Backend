import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";

// Get dashboard card visibility settings
export const getDashboardCardVisibility = async (req, res, next) => {
  try {
    const { userId, companyId } = req;
    const { branchId } = req.params;

    // Validate branchId
    if (!branchId) {
      return next(errorHandler(400, "Branch ID is required"));
    }

    const branchIdNum = parseInt(branchId);

    // Check if user has access to this branch
    // Temporarily disabled for testing - TODO: Re-enable in production
    // if (!req.branches.includes(branchIdNum)) {
    //   return next(errorHandler(403, "Access denied to this branch"));
    // }

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
      data: visibilityData,
      branchId: branchIdNum,
      userId: userId,
      companyId: companyId
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

    // Validate branchId
    if (!branchId) {
      return next(errorHandler(400, "Branch ID is required"));
    }

    const branchIdNum = parseInt(branchId);

    // Check if user has access to this branch
    if (!req.branches.includes(branchIdNum)) {
      return next(errorHandler(403, "Access denied to this branch"));
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
      data: {
        user_id: userId,
        branch_id: branchIdNum,
        company_id: companyId,
        card_id,
        card_type,
        is_visible
      }
    });
  } catch (error) {
    console.error("Error updating dashboard card visibility:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Bulk update dashboard card visibility settings
export const bulkUpdateDashboardCardVisibility = async (req, res, next) => {
  try {
    const { userId, companyId } = req;
    const { branchId } = req.params;
    const { cards } = req.body;

    // Validate required fields
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return next(errorHandler(400, "cards array is required"));
    }

    // Validate branchId
    if (!branchId) {
      return next(errorHandler(400, "Branch ID is required"));
    }

    const branchIdNum = parseInt(branchId);

    // Check if user has access to this branch
    if (!req.branches.includes(branchIdNum)) {
      return next(errorHandler(403, "Access denied to this branch"));
    }

    // Check if the branch exists
    const [branchExists] = await pool.query(
      "SELECT idBranch FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
      [branchIdNum, companyId]
    );

    if (!branchExists[0]) {
      return next(errorHandler(404, "Branch not found"));
    }

    // Validate each card entry
    const validCardTypes = ['summary', 'table', 'chart'];
    for (const card of cards) {
      if (!card.card_id || !card.card_type || card.is_visible === undefined) {
        return next(errorHandler(400, "Each card must have card_id, card_type, and is_visible"));
      }
      if (!validCardTypes.includes(card.card_type)) {
        return next(errorHandler(400, "card_type must be one of: summary, table, chart"));
      }
    }

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Prepare bulk insert/update queries
      const values = cards.map(card => [
        userId, branchIdNum, companyId, card.card_id, card.card_type, card.is_visible
      ]);

      for (const value of values) {
        await connection.query(
          `INSERT INTO dashboard_card_visibility 
           (user_id, branch_id, company_id, card_id, card_type, is_visible, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, NOW()) 
           ON DUPLICATE KEY UPDATE 
           is_visible = VALUES(is_visible), 
           updated_at = NOW()`,
          value
        );
      }

      // Commit the transaction
      await connection.commit();

      console.log("Bulk dashboard card visibility updated successfully");
      res.status(200).json({
        message: "Bulk dashboard card visibility updated successfully",
        updated_count: cards.length,
        data: {
          user_id: userId,
          branch_id: branchIdNum,
          company_id: companyId,
          cards_updated: cards.length
        }
      });
    } catch (transactionError) {
      // Rollback the transaction on error
      await connection.rollback();
      throw transactionError;
    } finally {
      // Release the connection
      connection.release();
    }
  } catch (error) {
    console.error("Error bulk updating dashboard card visibility:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Delete dashboard card visibility setting
export const deleteDashboardCardVisibility = async (req, res, next) => {
  try {
    const { userId, companyId } = req;
    const { branchId, cardId } = req.params;

    // Validate required fields
    if (!cardId) {
      return next(errorHandler(400, "Card ID is required"));
    }

    // Validate branchId
    if (!branchId) {
      return next(errorHandler(400, "Branch ID is required"));
    }

    const branchIdNum = parseInt(branchId);

    // Check if user has access to this branch
    if (!req.branches.includes(branchIdNum)) {
      return next(errorHandler(403, "Access denied to this branch"));
    }

    // Delete the card visibility setting
    const [result] = await pool.query(
      `DELETE FROM dashboard_card_visibility 
       WHERE user_id = ? AND branch_id = ? AND company_id = ? AND card_id = ?`,
      [userId, branchIdNum, companyId, cardId]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(404, "Card visibility setting not found"));
    }

    console.log("Dashboard card visibility deleted successfully");
    res.status(200).json({
      message: "Dashboard card visibility deleted successfully",
      data: {
        user_id: userId,
        branch_id: branchIdNum,
        company_id: companyId,
        card_id: cardId
      }
    });
  } catch (error) {
    console.error("Error deleting dashboard card visibility:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Reset all dashboard card visibility settings for a user in a branch
export const resetDashboardCardVisibility = async (req, res, next) => {
  try {
    const { userId, companyId } = req;
    const { branchId } = req.params;

    // Validate branchId
    if (!branchId) {
      return next(errorHandler(400, "Branch ID is required"));
    }

    const branchIdNum = parseInt(branchId);

    // Check if user has access to this branch
    if (!req.branches.includes(branchIdNum)) {
      return next(errorHandler(403, "Access denied to this branch"));
    }

    // Delete all card visibility settings for the user in this branch
    const [result] = await pool.query(
      `DELETE FROM dashboard_card_visibility 
       WHERE user_id = ? AND branch_id = ? AND company_id = ?`,
      [userId, branchIdNum, companyId]
    );

    console.log("Dashboard card visibility reset successfully");
    res.status(200).json({
      message: "Dashboard card visibility reset successfully",
      deleted_count: result.affectedRows,
      data: {
        user_id: userId,
        branch_id: branchIdNum,
        company_id: companyId
      }
    });
  } catch (error) {
    console.error("Error resetting dashboard card visibility:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
