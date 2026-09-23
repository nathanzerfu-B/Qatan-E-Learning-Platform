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

const router = express.Router();

// Register route
router.post("/register", registerUser);

// Login route
router.post("/login", loginUser);

// Verify code route
router.post("/verify-code", verifyCode);

// Resend code route
router.post("/resend-code", resendCode);

// Forgot password route
router.post("/forgot-password", forgotPassword);

// Verify reset code route
router.post("/verify-reset-code", verifyResetCode);

// Reset password route
router.post("/reset-password", resetPassword);

export default router;
