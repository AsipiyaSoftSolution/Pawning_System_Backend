import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import bcrypt from "bcryptjs";
import { jwtToken, generatePasswordResetToken } from "../utils/helper.js";
import {
  sendPasswordResetEmail,
  sendPasswordResetSuccessEmail,
} from "../utils/mailConfig.js";
import hutchSms, { setLogSMSCallback } from "../utils/hutchSms.js";

// This function retrieves user information without the password when giving user id
// It also retrieves the user's designation, company, branches, and company documents
const userWithoutPassword = async (userId) => {
  try {
    let user;
    [user] = await pool.query("SELECT * FROM user WHERE idUser = ?", [userId]);

    if (!user[0]) {
      throw new Error("User not found");
    }

    // get the desgination
    const [desgination] = await pool.query(
      "SELECT Description, idDesignation from designation WHERE idDesignation = ?",
      [user[0].Designation_idDesignation]
    );

    // get the designation privileges
    const [designationPrivileges] = await pool.query(
      "SELECT User_Privilages_idUser_Privilages FROM designation_has_user_privilages WHERE Designation_idDesignation = ? AND Status = '1'",
      [user[0].Designation_idDesignation]
    );

    let privileges = [];
    for (const privilege of designationPrivileges) {
      const [privilegeRows] = await pool.query(
        "SELECT idUser_privilages, Description FROM user_privilages WHERE idUser_privilages = ?",
        [privilege.User_Privilages_idUser_Privilages]
      );
      if (privilegeRows.length > 0) {
        privileges.push(privilegeRows[0]);
      }
    }

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
      const [branchRows] = await pool.query(
        "SELECT idBranch, Name FROM branch WHERE idBranch = ?",
        [branch.Branch_idBranch]
      );
      if (branchRows.length > 0) {
        userBranches.push(branchRows[0]);
      }
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

    // Check if user got a cashier account and if yes send cashier account id
    const [cashierAccount] = await pool.query(
      "SELECT idAccounting_Accounts,Cashier_idCashier FROM accounting_accounts WHERE Cashier_idCashier = ?",
      [user[0].idUser]
    );

    user = {
      ...user[0],
      designation: desgination[0]?.Description,
      privileges: privileges,
      company: company[0],
      branches: userBranches,
      companyDocuments: companyDocuments,
      branchIds: branchIds.map((branch) => branch.Branch_idBranch),
      isCashier: cashierAccount.length > 0,
      cashierAccountId:
        cashierAccount.length > 0
          ? cashierAccount[0].idAccounting_Accounts
          : null,
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

export const forgetPassword = async (req, res, next) => {
  try {
    const { email, mobile } = req.body;
    if (!email && !mobile) {
      return next(errorHandler(400, "Email or Contact Number is required"));
    }

    if (email) {
      const [existingUser] = await pool.query(
        "SELECT idUser,full_name FROM user WHERE Email = ?",
        [email]
      );

      if (!existingUser[0]) {
        return next(errorHandler(404, "User with this email does not exist"));
      }

      // Generate a password reset token
      const token = generatePasswordResetToken();
      const tokenExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour from now

      // Store the token and its expiry in the database
      await pool.query(
        "UPDATE user SET Reset_Password_Token = ?,Reset_Password_Token_Expires_At = ? WHERE idUser = ?",
        [token, tokenExpiry, existingUser[0].idUser]
      );
      // reset url
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}/${existingUser[0].idUser}`;

      // Send the password reset email
      const emailSent = await sendPasswordResetEmail(
        email,
        resetUrl,
        existingUser[0].full_name
      );

      if (!emailSent) {
        console.error("Failed to send password reset email to:", email);
        return next(
          errorHandler(
            500,
            "Failed to send password reset email. Please try again."
          )
        );
      }
    } else if (mobile) {
      const [existingUser] = await pool.query(
        "SELECT idUser,full_name,Company_idCompany FROM user WHERE Contact_no = ?",
        [mobile]
      );

      if (!existingUser[0]) {
        return next(
          errorHandler(404, "User with this contact number does not exist")
        );
      }

      // generate 6 integer code
      const token = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenExpiry = new Date(Date.now() + 3600000); // Token valid for 1 hour from now

      // Store the token and its expiry in the database
      await pool.query(
        "UPDATE user SET Reset_Password_Mobile_Otp = ?, Reset_Password_Mobile_Otp_Expires_At = ? WHERE idUser = ?",
        [token, tokenExpiry, existingUser[0].idUser]
      );

      // send the otp via sms
      try {
        let normalizedNumber = mobile.trim();

        // Remove non-digit characters
        normalizedNumber = normalizedNumber.replace(/[^0-9]/g, "");

        // Normalize to 947 format
        if (normalizedNumber.startsWith("0")) {
          normalizedNumber = "94" + normalizedNumber.slice(1);
        } else if (!normalizedNumber.startsWith("94")) {
          normalizedNumber = "94" + normalizedNumber;
        }

        // get the company sms mask
        const [companyRows] = await pool.query(
          "SELECT SMS_Mask FROM company WHERE idCompany = ?",
          [existingUser[0].Company_idCompany]
        );

        // Create company object - the mask will be validated in sendViaHutch
        const company = {
          mask: companyRows[0]?.SMS_Mask || process.env.HUTCH_DEFAULT_MASK,
        };

        const message = `Your password reset OTP is ${token}`;

        // Call hutchSms.sendViaHutch
        const sendResult = await hutchSms.sendViaHutch(
          company,
          existingUser[0].idUser,
          { full_name: existingUser[0].full_name },
          message,
          "reset_password",
          [normalizedNumber]
        );

        if (!(sendResult && sendResult.success)) {
          console.error("Failed to send OTP SMS. Details:", sendResult);
        }
      } catch (smsErr) {
        console.error("Error sending OTP SMS:", smsErr);
      }
    }
    res.status(200).json({
      success: true,
      message:
        "If the provided contact exists, a password reset link or OTP has been sent.",
    });
  } catch (error) {
    console.error("Forget password error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, userId } = req.params;
    const { newPassword } = req.body;

    if (!token || !userId) {
      return next(errorHandler(400, "Invalid or missing token/userId"));
    }

    if (!newPassword) {
      return next(errorHandler(400, "New password is required"));
    }
    // check if the password is strong enough
    if (newPassword.length < 8) {
      return next(
        errorHandler(400, "Password must be at least 8 characters long")
      );
    }
    if (!/[A-Z]/.test(newPassword)) {
      return next(
        errorHandler(400, "Password must contain at least one uppercase letter")
      );
    }

    if (!/[a-z]/.test(newPassword)) {
      return next(
        errorHandler(400, "Password must contain at least one lowercase letter")
      );
    }
    if (!/[0-9]/.test(newPassword)) {
      return next(
        errorHandler(400, "Password must contain at least one number")
      );
    }
    if (!/[!@#$%^&*]/.test(newPassword)) {
      return next(
        errorHandler(
          400,
          "Password must contain at least one special character"
        )
      );
    }

    // find there is a user with the token and userId and the token is not expired
    const [user] = await pool.query(
      "SELECT idUser,Email,full_name,Reset_Password_Token,Reset_Password_Token_Expires_At FROM user WHERE idUser = ? ",
      [userId]
    );

    if (!user[0] || user[0].Reset_Password_Token !== token) {
      return next(errorHandler(400, "Invalid token"));
    }

    // check if the token is expired
    if (new Date() > new Date(user[0].Reset_Password_Token_Expires_At)) {
      return next(errorHandler(400, "Token has expired"));
    }

    // hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update the password in the database and remove the token
    const [result] = await pool.query(
      "UPDATE user SET Password = ?, Reset_Password_Token = NULL, Reset_Password_Token_Expires_At = NULL WHERE idUser = ?",
      [hashedPassword, userId]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update password"));
    }

    // Send password reset success email
    const emailSent = await sendPasswordResetSuccessEmail(
      user[0].Email,
      user[0].full_name
    );

    if (!emailSent) {
      console.error(
        "Failed to send password reset success email to:",
        user[0].Email
      );
      // Don't fail the password reset if email fails, just log it
    }

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
