import { pool, pool2 } from "../utils/db.js";
import { errorHandler } from "../utils/errorHandler.js";

export const checkUserSelectedHeadBranch = async (req, res, next) => {
  try {
    const [branch] = await pool2.query(
      "SELECT Branch_Code, Branch_Type FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
      [req.branchId, req.companyId],
    );

    if (branch.length === 0) {
      return next(errorHandler(404, "Branch not found"));
    }

    const code = String(branch[0].Branch_Code || "").trim();
    const isHeadByCode =
      code === `${req.companyId}-HO` ||
      code.toUpperCase().endsWith("-HO") ||
      code.toUpperCase() === "HO";
    const isHeadByType = Number(branch[0].Branch_Type) === 1;

    req.isHeadBranch = isHeadByCode || isHeadByType;
    next();
  } catch (error) {
    console.error("Error in checkUserSelectedHeadBranch middleware:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};

/** Must be used after checkUserSelectedHeadBranch. Returns 403 if current branch is not head office. */
export const requireHeadBranch = (req, res, next) => {
  if (req.isHeadBranch) {
    next();
  } else {
    return next(errorHandler(403, "This action is only available when head office branch is selected"));
  }
};
