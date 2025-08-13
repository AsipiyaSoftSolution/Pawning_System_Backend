import jwt from "jsonwebtoken";
import { pool } from "../utils/db.js";
import { errorHandler } from "../utils/errorHandler.js";
import dotenv from "dotenv";

dotenv.config();

export const protectedRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    if (!accessToken) return next(errorHandler(401, "Unauthorized access"));

    // Verify the token
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
      const [user] = await pool.query(
        "SELECT idUser FROM user WHERE idUser = ? and Email = ? and Company_idCompany = ? and Designation_idDesignation = ?",
        [decoded.id, decoded.email, decoded.company_id, decoded.designation_id]
      );
      if (!user[0]) {
        return next(errorHandler(401, "Unauthorized access"));
      }
      // Attach user information to the request object
      req.userId = user[0].idUser;
      req.email = decoded.email;
      req.companyId = decoded.company_id;
      req.designationId = decoded.designation_id;
      req.branches = decoded.branches || [];

      console.info(`Decoded token: ${JSON.stringify(decoded)}`);
      console.info(`User ID: ${req.userId}, Email: ${req.email}`);
      console.info(
        `Company ID: ${req.companyId}, Designation ID: ${req.designationId}`
      );
      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error("Error verifying token:", error);
      return next(errorHandler(401, "Unauthorized access"));
    }
  } catch (error) {
    console.error("Error in protectedRoute middleware:", error);
    return next(errorHandler(500, "Internal server error"));
  }
};
