import { pool } from "../utils/db.js";
import { errorHandler } from "../utils/errorHandler.js";

// GET settings
export const getCardSettings = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM dashboard_settings");
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

// SAVE/UPDATE settings
export const saveCardSettings = async (req, res, next) => {
  try {
    const settings = req.body; // [{ card_id, visible, bg_color, font_color, card_type }, ...]

    if (!Array.isArray(settings)) {
      return next(errorHandler(400, "Invalid data format"));
    }

    for (const s of settings) {
      await pool.query(
        `INSERT INTO dashboard_settings (card_id, visible, bg_color, font_color, card_type)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE visible = VALUES(visible), bg_color = VALUES(bg_color), font_color = VALUES(font_color), card_type = VALUES(card_type)`,
        [s.card_id, s.visible, s.bg_color, s.font_color, s.card_type]
      );
    }

    res.json({ message: "Settings saved successfully" });
  } catch (err) {
    next(err);
  }
};
