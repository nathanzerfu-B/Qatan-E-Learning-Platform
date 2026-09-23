// src/controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/emailService.js";
import { validateInstructorPasskey } from "../utils/emailMonitor.js";
import { validateEmailDeliverability } from "../utils/emailVerificationService.js";
import { validatePasswordStrength } from "../middleware/securityMiddleware.js";

const prisma = new PrismaClient();

// Register user (with instructor passkey validation)
export const registerUser = async (req, res) => {
  try {
    let { name, email, password, role, passKey } = req.body;

    // Normalize inputs
    role = role?.toLowerCase();
    email = email?.toLowerCase();

    console.log("🧠 Incoming registration:", { name, email, role, passKey });

    // Basic validation
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    // Password complexity check
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    // ✅ Instructor passkey validation
    if (role === "instructor") {
      if (!passKey) {
        return res.status(400).json({
          success: false,
          message: "Passkey is required for instructors",
        });
      }

      console.log("🔍 Checking instructor application...");
      try {
        const application = await validateInstructorPasskey(email, passKey);
        if (!application) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid passkey or your instructor application is not approved yet.",
          });
        }
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Passkey validation failed",
        });
      }
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.isVerified) {
        return res
          .status(400)
          .json({ success: false, message: "Email already registered and verified. Please log in." });
      }

      // If user registered earlier but has not verified yet:
      // Allow them to update their details and re-send the code instead of getting locked out
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          password: hashedPassword,
          role,
          status: role === "instructor" ? "pending" : "active",
          verificationCode,
          verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
          verificationCodeAttempts: 0,
        },
      });

      try {
        await sendVerificationEmail(email, verificationCode);
        console.log("📧 Re-sent verification email to unverified user:", email);
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError);
      }

      return res.status(200).json({
        success: true,
        message: "Verification code sent to your email. Please check your inbox.",
        user: {
          id: existing.id,
          name,
          email,
          role,
          status: role === "instructor" ? "pending" : "active",
        },
      });
    }

    // Email existence/validity check before sending any verification code
    const verification = await validateEmailDeliverability(email);
    if (!verification?.valid) {
      const baseMsg = "Email address appears invalid or the mailbox does not exist. Please use a valid email.";
      const reason = process.env.NODE_ENV !== "production" && verification?.reason ? ` Reason: ${verification.reason}` : "";
      return res.status(400).json({ success: false, message: baseMsg + reason });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        status: role === "instructor" ? "pending" : "active",
        verificationCode,
        verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000), // 10 min expiry
        verificationCodeAttempts: 0,
        isVerified: false,
      },
    });

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode);
      console.log("📧 Verification email sent to:", email);
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
    }

    console.log("✅ New user created:", newUser.email);

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully. Please check your email to verify your account.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed",
    });
  }
};

// Login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        profilePicture: user.profilePicture,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error("🔥 Login error:", error);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
};

// Verify email code
export const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.verificationCode) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification code" });
    }

    if (user.isVerified) {
      return res
        .status(200)
        .json({ success: true, message: "Email already verified" });
    }

    if (
      user.verificationCodeExpires &&
      new Date() > user.verificationCodeExpires
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Code expired, please resend." });
    }

    if (user.verificationCodeAttempts >= 3) {
      return res.status(400).json({
        success: false,
        message: "Maximum attempts reached, please resend.",
      });
    }

    if (user.verificationCode !== code) {
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationCodeAttempts: user.verificationCodeAttempts + 1 },
      });
      return res
        .status(400)
        .json({ success: false, message: "Incorrect code." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
        verificationCodeAttempts: 0,
        emailVerifiedAt: new Date(),
      },
    });

    console.log("✅ Email verified for:", user.email);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("❌ Email verification error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Email verification failed" });
  }
};

// Resend verification code
export const resendCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res
        .status(200)
        .json({ success: true, message: "Email already verified" });
    }

    const now = new Date();
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: newCode,
        verificationCodeExpires: new Date(now.getTime() + 10 * 60 * 1000), // 10 min expiry
        verificationCodeAttempts: 0,
      },
    });

    try {
      await sendVerificationEmail(email, newCode);
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
      return res
        .status(500)
        .json({ success: false, message: "Failed to send email" });
    }

    console.log("✅ New verification code sent to:", user.email);

    return res.status(200).json({
      success: true,
      message: "Verification code resent successfully",
    });
  } catch (error) {
    console.error("❌ Resend code error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to resend code" });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, a password reset code has been sent.",
      });
    }

    // Delete any existing reset codes for this email
    await prisma.passwordReset.deleteMany({
      where: { email },
    });

    // Generate 6-digit OTP code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create new reset code (expires in 10 minutes)
    await prisma.passwordReset.create({
      data: {
        email,
        code: resetCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetCode);
      console.log("📧 Password reset OTP email sent to:", user.email);
    } catch (emailError) {
      console.error("❌ Password reset email sending failed:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send password reset email",
      });
    }

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset code has been sent.",
    });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process password reset request",
    });
  }
};

// Verify reset code
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and reset code are required",
      });
    }

    // Find the reset code
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        email,
        code,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    console.log("✅ Reset code verified for:", email);

    return res.status(200).json({
      success: true,
      message: "Code verified",
    });
  } catch (error) {
    console.error("❌ Verify reset code error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify reset code",
    });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, code, and new password are required",
      });
    }

    // Password complexity check
    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    // Find and validate the reset code
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        email,
        code,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset code",
      });
    }

    // Find the user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the reset code
    await prisma.passwordReset.delete({
      where: { id: resetRecord.id },
    });

    console.log("✅ Password reset successful for:", user.email);

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};
