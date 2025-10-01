import nodemailer from "nodemailer";
import dotenv from "dotenv";
import {
  passwordResetEmailTemplate,
  passwordResetSuccessEmailTemplate,
  welcomeEmailTemplate,
} from "./emailTemplates.js";

dotenv.config();

/**
 * Email Configuration for asipbook.com mail server
 * Using SMTP with SSL/TLS settings
 */

const mailConfig = {
  host: process.env.EMAIL_HOST,
  port: 465, // SMTP SSL port
  secure: true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // Additional options for better reliability
  tls: {
    rejectUnauthorized: false, // Use with caution - only if you trust the server
  },
};

// Create reusable transporter
export const transporter = nodemailer.createTransport(mailConfig);

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Password reset token
 * @param {string} userName - User's full name
 * @returns {Promise<boolean>} - Success status
 */
export const sendPasswordResetEmail = async (email, resetUrl, userName) => {
  try {
    const mailOptions = {
      from: {
        name: "Asipiya Pawning System",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "Password Reset Request - Asipiya Pawning System",
      html: passwordResetEmailTemplate(userName, resetUrl),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✓ Password reset email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("✗ Failed to send password reset email:", error.message);
    return false;
  }
};

/**
 * Send welcome email to new users
 * @param {string} email - Recipient email address
 * @param {string} userName - User's full name
 * @returns {Promise<boolean>} - Success status
 */
export const sendWelcomeEmail = async (email, userName) => {
  try {
    const loginLink = `${
      process.env.CLIENT_URL || "https://pawning.asipbook.com"
    }/`;

    const mailOptions = {
      from: {
        name: "Asipiya Pawning System",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "Welcome to Asipiya Pawning System",
      html: welcomeEmailTemplate(userName, loginLink),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✓ Welcome email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("✗ Failed to send welcome email:", error.message);
    return false;
  }
};

/**
 * Send password reset success email
 * @param {string} email - Recipient email address
 * @param {string} userName - User's full name
 * @returns {Promise<boolean>} - Success status
 */
export const sendPasswordResetSuccessEmail = async (email, userName) => {
  try {
    const loginLink = `${
      process.env.CLIENT_URL || "https://pawning.asipbook.com"
    }`;

    const mailOptions = {
      from: {
        name: "Asipiya Pawning System",
        address: process.env.EMAIL_USER,
      },
      to: email,
      subject: "Password Reset Successful - Asipiya Pawning System",
      html: passwordResetSuccessEmailTemplate(userName, loginLink),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      "✓ Password reset success email sent successfully:",
      info.messageId
    );
    return true;
  } catch (error) {
    console.error(
      "✗ Failed to send password reset success email:",
      error.message
    );
    return false;
  }
};

/**
 * Verify connection configuration
 */
export const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log("✓ Mail server connection verified successfully");
    return true;
  } catch (error) {
    console.error("✗ Mail server connection failed:", error.message);
    return false;
  }
};
