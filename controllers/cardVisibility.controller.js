import { pool } from "../utils/db.js";
import { errorHandler } from "../utils/errorHandler.js";

// Get all card visibility settings for a user
export const getCardVisibility = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { branchId } = req.query; // Optional branch filter

    let query = `SELECT card_type, card_id, is_visible, branch_id 
                 FROM card_visibility 
                 WHERE user_id = ?`;
    let params = [userId];

    if (branchId) {
      query += ` AND branch_id = ?`;
      params.push(branchId);
    }

    query += ` ORDER BY card_type, card_id`;

    const [rows] = await pool.execute(query, params);

    // Group by card type
    const visibility = {
      table: {},
      summary: {},
      chart: {}
    };

    rows.forEach(row => {
      visibility[row.card_type][row.card_id] = {
        is_visible: row.is_visible,
        branch_id: row.branch_id
      };
    });

    res.status(200).json({
      success: true,
      data: visibility
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Update single card visibility
export const updateCardVisibility = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { cardType, cardId, isVisible, branchId = 1 } = req.body;

    // Validate card type
    if (!['table', 'summary', 'chart'].includes(cardType)) {
      return next(errorHandler(400, "Invalid card type"));
    }

    // Insert or update card visibility
    await pool.execute(
      `INSERT INTO card_visibility (user_id, branch_id, card_type, card_id, is_visible) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE is_visible = VALUES(is_visible)`,
      [userId, branchId, cardType, cardId, isVisible]
    );

    res.status(200).json({
      success: true,
      message: "Card visibility updated successfully"
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Update multiple cards visibility (for toggle all functionality)
export const updateMultipleCardVisibility = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { cardType, isVisible, cards, branchId = 1 } = req.body;

    // Validate card type
    if (!['table', 'summary', 'chart'].includes(cardType)) {
      return next(errorHandler(400, "Invalid card type"));
    }

    if (!Array.isArray(cards)) {
      return next(errorHandler(400, "Cards must be an array"));
    }

    // Begin transaction
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Update all cards of the specified type
      for (const card of cards) {
        await connection.execute(
          `INSERT INTO card_visibility (user_id, branch_id, card_type, card_id, is_visible) 
           VALUES (?, ?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE is_visible = VALUES(is_visible)`,
          [userId, branchId, cardType, card.cardId, isVisible]
        );
      }

      await connection.commit();
      res.status(200).json({
        success: true,
        message: `All ${cardType} cards visibility updated successfully`
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Reset card visibility to defaults
export const resetCardVisibility = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { cardType } = req.body;

    let query = `UPDATE card_visibility SET is_visible = TRUE WHERE user_id = ?`;
    let params = [userId];

    if (cardType && ['table', 'summary', 'chart'].includes(cardType)) {
      query += ` AND card_type = ?`;
      params.push(cardType);
    }

    await pool.execute(query, params);

    res.status(200).json({
      success: true,
      message: cardType 
        ? `${cardType} cards reset to default visibility` 
        : "All cards reset to default visibility"
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Initialize default card visibility for a new user
export const initializeCardVisibility = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { branchId = 1 } = req.body;

    // Default cards data
    const defaultCards = {
      table: [
        'due-payments', 'overdue-payments', 'recent-transactions', 'pending-approvals', 
        'completed-transactions', 'customer-feedback', 'loan-requests', 'inventory-checks', 
        'employee-performance', 'risk-assessment'
      ],
      summary: [
        'total-revenue', 'active-loans', 'customer-stats', 'inventory-summary', 
        'loan-performance', 'collection-stats', 'branch-performance', 'item-categories', 
        'employee-stats', 'risk-assessment-summary'
      ],
      chart: [
        'revenue-trends', 'loan-distribution', 'monthly-payments', 'customer-growth', 
        'loan-status', 'collection-efficiency', 'item-value-distribution', 'branch-comparison', 
        'risk-distribution', 'monthly-targets'
      ]
    };

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Insert default cards for all types
      for (const [cardType, cardIds] of Object.entries(defaultCards)) {
        for (const cardId of cardIds) {
          await connection.execute(
            `INSERT IGNORE INTO card_visibility (user_id, branch_id, card_type, card_id, is_visible) 
             VALUES (?, ?, ?, ?, TRUE)`,
            [userId, branchId, cardType, cardId]
          );
        }
      }

      await connection.commit();
      res.status(200).json({
        success: true,
        message: "Card visibility initialized successfully"
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Get card visibility statistics
export const getCardVisibilityStats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const [stats] = await pool.execute(
      `SELECT 
         card_type,
         COUNT(*) as total_cards,
         SUM(CASE WHEN is_visible = TRUE THEN 1 ELSE 0 END) as visible_cards,
         SUM(CASE WHEN is_visible = FALSE THEN 1 ELSE 0 END) as hidden_cards
       FROM card_visibility 
       WHERE user_id = ? 
       GROUP BY card_type`,
      [userId]
    );

    const [totalStats] = await pool.execute(
      `SELECT 
         COUNT(*) as total_cards,
         SUM(CASE WHEN is_visible = TRUE THEN 1 ELSE 0 END) as visible_cards,
         SUM(CASE WHEN is_visible = FALSE THEN 1 ELSE 0 END) as hidden_cards
       FROM card_visibility 
       WHERE user_id = ?`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: {
        byType: stats,
        total: totalStats[0] || { total_cards: 0, visible_cards: 0, hidden_cards: 0 }
      }
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};

// Get card visibility by branch
export const getCardVisibilityByBranch = async (req, res, next) => {
  try {
    const { userId, branchId } = req.params;

    const [rows] = await pool.execute(
      `SELECT cv.*, b.Name as branch_name 
       FROM card_visibility cv
       LEFT JOIN branch b ON cv.branch_id = b.idBranch
       WHERE cv.user_id = ? AND cv.branch_id = ?
       ORDER BY cv.card_type, cv.card_id`,
      [userId, branchId]
    );

    // Group by card type
    const visibility = {
      table: {},
      summary: {},
      chart: {}
    };

    rows.forEach(row => {
      visibility[row.card_type][row.card_id] = {
        is_visible: row.is_visible,
        branch_id: row.branch_id,
        branch_name: row.branch_name
      };
    });

    res.status(200).json({
      success: true,
      data: visibility
    });
  } catch (error) {
    next(errorHandler(500, error.message));
  }
};
