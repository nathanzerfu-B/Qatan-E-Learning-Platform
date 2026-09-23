// src/routes/auth.js
import express from "express";
import {
  registerUser,
  loginUser,
  verifyCode,
  resendCode,
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../controllers/authController.js";
import {
  authLimiter,
  passwordResetLimiter,
} from "../middleware/securityMiddleware.js";

const router = express.Router();

// Register route (Rate-limited to prevent automated bot signups)
router.post("/register", authLimiter, registerUser);

// Login route (Rate-limited against brute-force attacks)
router.post("/login", authLimiter, loginUser);

// Verify email code route
router.post("/verify-code", authLimiter, verifyCode);

// Resend verification code route (Rate-limited to prevent email inbox flood)
router.post("/resend-code", passwordResetLimiter, resendCode);

// Forgot password route (Rate-limited to prevent OTP spam)
router.post("/forgot-password", passwordResetLimiter, forgotPassword);

// Verify reset code route (Rate-limited against OTP brute-forcing)
router.post("/verify-reset-code", passwordResetLimiter, verifyResetCode);

// Reset password route (Rate-limited)
router.post("/reset-password", passwordResetLimiter, resetPassword);

export default router;
