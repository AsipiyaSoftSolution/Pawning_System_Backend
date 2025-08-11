import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import bcrypt from "bcryptjs";
import { jwtToken } from "../utils/helper.js";

export const login = async (req, res, next) => {
  try {
    console.log("Login request received:", req.body);
    const { email, password } = req.body;
    let user;

    if (!email || !password) {
      return next(errorHandler(400, "Email and password are required"));
    }

    [user] = await pool.query("SELECT * FROM user WHERE Email = ?", [email]);

    if (!user[0]) {
      return next(errorHandler(404, "User not found"));
    }

    console.log("User found:", user[0]); // Debug log
    console.log("Password from DB:", user[0].Password); // Debug log

    const validPassword = await bcrypt.compare(password, user[0].Password);

    if (!validPassword) {
      return next(errorHandler(401, "Invalid credentials"));
    }
    const [desgination] = await pool.query(
      "SELECT Description from designation WHERE idDesignation = ?",
      [user[0].Designation_idDesignation]
    );

    const [company] = await pool.query(
      "SELECT * FROM company WHERE idCompany = ?",
      [user[0].Company_idCompany]
    );

    user = {
      ...user[0],
      designation: desgination[0]?.Description,
      company: company[0],
    };
    // Generate tokens
    const { accessToken, refreshToken } = jwtToken(
      user.idUser,
      user.Email,
      user.Company_idCompany,
      user.Designation_idDesignation
    );

    // Set cookies and send response
    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .status(200)
      .json({
        message: "User logged in successfully",
        user,
      });
  } catch (error) {
    console.error("Login error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
//changes on 
export const logout = async (req, res) => {
  try {
    console.log("Logout request received");

    // Clear cookies
    res
      .clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(200)
      .json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
