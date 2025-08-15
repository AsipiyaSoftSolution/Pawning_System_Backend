import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import bcrypt from "bcryptjs";
import { jwtToken } from "../utils/helper.js";

// This function retrieves user information without the password when giving user id
// It also retrieves the user's designation, company, branches, and company documents
const userWithoutPassword = async (userId) => {
  try {
    let user;
    [user] = await pool.query("SELECT * FROM user WHERE idUser = ?", [userId]);

    if (!user[0]) {
      throw new Error("User not found");
    }

    const [desgination] = await pool.query(
      "SELECT Description from designation WHERE idDesignation = ?",
      [user[0].Designation_idDesignation]
    );

    const [company] = await pool.query(
      "SELECT * FROM company WHERE idCompany = ?",
      [user[0].Company_idCompany]
    );

    const [branchIds] = await pool.query(
      "SELECT Branch_idBranch FROM user_has_branch WHERE User_idUser = ?",
      [user[0].idUser]
    );

    let userBranches = [];

    for (const branch of branchIds) {
      [userBranches] = await pool.query(
        "SELECT idBranch, Name FROM branch WHERE idBranch = ?",
        [branch.Branch_idBranch]
      );
    }

    const [documetTypes] = await pool.query(
      "SELECT * FROM company_documents WHERE Company_idCompany = ?",
      [user[0].Company_idCompany]
    );

    // Extract the document types from the documetTypes array
    const companyDocuments = documetTypes.map((doc) => ({
      idDocument: doc.idDocument,
      Document_Type: doc.Document_Type,
    }));

    user = {
      ...user[0],
      designation: desgination[0]?.Description,
      company: company[0],
      branches: userBranches,
      companyDocuments: companyDocuments,
      branchIds: branchIds.map((branch) => branch.Branch_idBranch),
    };

    const { Password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  } catch (error) {
    console.error("Error in userWithoutPassword:", error);
    throw new Error("Error retrieving user information");
  }
};

export const login = async (req, res, next) => {
  try {
    console.log("Login request received:", req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return next(errorHandler(400, "Email and password are required"));
    }

    const [existingUser] = await pool.query(
      "SELECT idUser,Password FROM user WHERE Email = ?",
      [email]
    );
    if (!existingUser[0]) {
      return next(errorHandler(401, "Invalid credentials"));
    }

    // Check if the password is correct
    const validPassword = await bcrypt.compare(
      password,
      existingUser[0].Password
    );
    if (!validPassword) {
      return next(errorHandler(401, "Invalid credentials"));
    }

    const user = await userWithoutPassword(existingUser[0].idUser);

    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    // Generate tokens
    const { accessToken, refreshToken } = jwtToken(
      user.idUser,
      user.Email,
      user.Company_idCompany,
      user.Designation_idDesignation,
      user.branchIds,
      user.companyDocuments
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

export const checkAuth = async (req, res, next) => {
  try {
    const user = await userWithoutPassword(req.userId);
    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    res.status(200).json({
      message: "User is authenticated",
      user,
    });
  } catch (error) {
    console.error("Check auth error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
