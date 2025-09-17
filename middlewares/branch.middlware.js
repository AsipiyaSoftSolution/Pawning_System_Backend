import { pool } from "../utils/db.js";
import { errorHandler } from "../utils/errorHandler.js";

export const checkUserBranchAccess = async (req, res, next) => {
  try {
    const branches = req.branches || [];
    const branchId =
      req.params.branchId || req.params.id || req.params.branch_id;
    //  console.log("Branches:", branches);
    //  console.log("Request Params:", req.params);
    // console.log("Extracted Branch ID:", branchId);

    // check if the branchId is in the request
    if (!branchId) {
      return next(errorHandler(400, "Branch ID is required"));
    }

    const branchIdNum = parseInt(branchId);

    if (branches.includes(branchIdNum)) {
      req.branchId = branchIdNum; // Attach branchId to request
      next(); // Proceed to the next middleware
    } else {
      return next(errorHandler(403, "Access denied to this branch"));
    }
  } catch (error) {
    console.error("Error in checkUserBranchAccess middleware:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};
