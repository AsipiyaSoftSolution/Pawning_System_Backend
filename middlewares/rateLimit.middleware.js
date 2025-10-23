import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

// Strict limiter for OTP verification endpoints to prevent brute force
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // limit each IP to 6 requests per windowMs
  message: {
    status: 429,
    message:
      "Too many OTP requests from this IP, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Slightly more permissive limiter for forget-password endpoint
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    status: 429,
    message:
      "Too many password reset requests from this IP, please try again after an hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Slow down repeated requests to make automated abuse less effective
export const generalSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 30, // allow 30 requests, then begin adding delay
  delayMs: 500, // begin adding 500ms per request above the limit
});

export default { otpLimiter, passwordResetLimiter, generalSlowDown };
