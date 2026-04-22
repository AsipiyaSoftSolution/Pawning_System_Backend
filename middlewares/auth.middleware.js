import jwt from "jsonwebtoken";
import { pool2 } from "../utils/db.js";
import { errorHandler } from "../utils/errorHandler.js";
import dotenv from "dotenv";

dotenv.config();

export const protectedRoute = async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken || req.headers?.authorization?.split(" ")[1];
    if (!accessToken) return next(errorHandler(401, "Unauthorized access"));

    // Attach token for downstream use (e.g. ACC Center API calls when token is in header)
    req.accessToken = accessToken;

    // Verify the token
    try {
      // console.log(`[protectedRoute] Verifying token for path: ${req.path}`);
      //console.log(`[protectedRoute] Token: ${accessToken}`);

      const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
      // console.log(`[protectedRoute] Decoded Token:`, decoded);

      const [user] = await pool2.query(
        "SELECT idUser FROM user WHERE idUser = ? and Email = ? and Company_idCompany = ? and Designation_idDesignation = ?",
        [decoded.id, decoded.email, decoded.company_id, decoded.designation_id],
      );
      if (!user[0]) {
        console.warn(
          `[protectedRoute] User not found matching token criteria: id=${decoded.id}, email=${decoded.email}`,
        );
        return next(errorHandler(401, "Unauthorized access"));
      }
      // Attach user information to the request object
      req.userId = user[0].idUser;
      req.email = decoded.email;
      req.companyId = decoded.company_id;
      req.designationId = decoded.designation_id;
      req.branches = decoded.branches || [];
      req.company_documents = decoded.company_documents || [];

      //console.info(`Decoded token: ${JSON.stringify(decoded)}`);

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        console.warn(`[protectedRoute] Token expired for path: ${req.path}`);
        return next(
          errorHandler(
            401,
            "Unauthorized access. Your session has expired. Please log in again.",
          ),
        );
      } else if (error.name === "JsonWebTokenError") {
        console.warn(`[protectedRoute] Invalid token for path: ${req.path}`);
        return next(
          errorHandler(
            401,
            "Unauthorized access. Invalid authentication token.",
          ),
        );
      } else {
        console.error("[protectedRoute] Error verifying token:", error);
        return next(errorHandler(401, "Unauthorized access"));
      }
    }
  } catch (error) {
    console.error("Error in protectedRoute middleware:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};
