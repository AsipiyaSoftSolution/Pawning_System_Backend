import express from "express";
import {
  login,
  logout,
  checkAuth,
  forgetPassword,
  resetPassword,
  verifyMobileOtpForPasswordReset,
} from "../controllers/auth.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  otpLimiter,
  passwordResetLimiter,
  generalSlowDown,
} from "../middlewares/rateLimit.middleware.js";
const route = express.Router();

// Apply a small slowdown globally on auth routes (optional)
route.use(generalSlowDown);

route.post("/login", login);
route.post("/logout", logout);
route.get("/check-auth", protectedRoute, checkAuth); // Protected route to check authentication and return user info if local storage is cleared

// Limit password reset initiation attempts per IP
route.post("/forget-password", passwordResetLimiter, forgetPassword);

// Very strict limiter for OTP verification to prevent brute-force / guessing
route.post(
  "/verify-mobile-otp-for-password-reset",
  otpLimiter,
  verifyMobileOtpForPasswordReset
); // New route for verifying OTP when resetting password using mobile

// reset password route
route.post("/reset-password/:token/:userId", resetPassword);
export default route;
