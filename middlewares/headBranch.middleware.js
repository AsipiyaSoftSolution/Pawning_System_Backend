import { pool } from "../utils/db.js";
import { errorHandler } from "../utils/errorHandler.js";

export const checkUserSelectedHeadBranch = async (req, res, next) => {
  try {
    const [branch] = await pool.query(
      "SELECT Branch_Code FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
      [req.branchId, req.companyId]
    );

    if (branch.length === 0) {
      return next(errorHandler(404, "Branch not found"));
    }

    // Normalize and compare branch code to the expected head branch code (e.g. "1-HO")
    if (String(branch[0].Branch_Code).trim() === `${req.companyId}-HO`) {
      req.isHeadBranch = true;
    } else {
      req.isHeadBranch = false;
    }
    next();
  } catch (error) {
    console.error("Error in checkUserSelectedHeadBranch middleware:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};
