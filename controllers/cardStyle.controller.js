import { pool } from "../utils/db.js";
import { errorHandler } from "../utils/errorHandler.js";

// Get all card styles for a user
export const getUserCardStyles = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const [rows] = await pool.query(
      'SELECT * FROM user_card_styles WHERE user_id = ?',
      [userId]
    );
    
    // Convert array to object with card_id as key
    const styles = rows.reduce((acc, style) => {
      acc[style.card_id] = {
        bgColor: style.bg_color,
        fontColor: style.font_color,
        cardType: style.card_type
      };
      return acc;
    }, {});
    
    res.status(200).json(styles);
  } catch (err) {
    next(err);
  }
};

// Update a card style
export const updateCardStyle = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const cardId = req.params.cardId;
    const { bgColor, fontColor, cardType } = req.body;
    
    // Use INSERT ... ON DUPLICATE KEY UPDATE for upsert operation
    const [result] = await pool.query(
      `INSERT INTO user_card_styles 
       (user_id, card_id, bg_color, font_color, card_type) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       bg_color = VALUES(bg_color), 
       font_color = VALUES(font_color)`,
      [userId, cardId, bgColor, fontColor, cardType]
    );
    
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

// Reset all card styles for a user
export const resetUserCardStyles = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    await pool.query(
      'DELETE FROM user_card_styles WHERE user_id = ?',
      [userId]
    );
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};