import { pool } from "../utils/db.js";
import { errorHandler } from "../utils/errorHandler.js";
 


// Simple update card visibility function
export const updateCardVisibilitySimple = async (req, res, next) => {
  try {
    const { userId, branchId, cardId, isVisible } = req.body;

    // Validate required fields
    if (!userId || !branchId || !cardId || isVisible === undefined) {
      return next(errorHandler(400, "User ID, Branch ID, Card ID and isVisible are required"));
    }

    // Update card visibility
    const [result] = await pool.execute(
      `UPDATE card_visibility 
       SET is_visible = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = ? AND branch_id = ? AND card_id = ?`,
      [isVisible, userId, branchId, cardId]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(404, "Card visibility record not found"));
    }

    res.status(200).json({
      success: true,
      message: "Card visibility updated successfully",
      data: {
        userId,
        branchId, 
        cardId,
        isVisible: isVisible ? 1 : 0
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};
