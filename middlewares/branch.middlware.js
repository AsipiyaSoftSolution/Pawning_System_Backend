import { pool2 } from "../utils/db.js";
import { errorHandler } from "../utils/errorHandler.js";

/**
 * Allow the request when the route branch is in the JWT branch list, OR when
 * user_has_branch still grants access in Account Center. The JWT list can lag
 * behind the DB (branch access added after login, check-auth returning the
 * same token), which previously caused "Access denied to this branch" while
 * the UI correctly showed the branch.
 */
export const checkUserBranchAccess = async (req, res, next) => {
  try {
    const branches = req.branches || [];
    const branchId =
      req.params.branchId || req.params.id || req.params.branch_id;

    if (!branchId) {
      return next(errorHandler(400, "Branch ID is required"));
    }

    const branchIdNum = parseInt(branchId, 10);
    if (!Number.isFinite(branchIdNum)) {
      return next(errorHandler(400, "Invalid branch ID"));
    }

    const normalizedBranches = (branches || [])
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id));

    if (normalizedBranches.includes(branchIdNum)) {
      req.branchId = branchIdNum;
      return next();
    }

    // JWT missed it — confirm live assignment before denying.
    if (req.userId) {
      const [rows] = await pool2.query(
        "SELECT 1 FROM user_has_branch WHERE User_idUser = ? AND Branch_idBranch = ? LIMIT 1",
        [req.userId, branchIdNum],
      );
      if (rows.length > 0) {
        req.branchId = branchIdNum;
        return next();
      }
    }

    return next(errorHandler(403, "Access denied to this branch"));
  } catch (error) {
    console.error("Error in checkUserBranchAccess middleware:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};
