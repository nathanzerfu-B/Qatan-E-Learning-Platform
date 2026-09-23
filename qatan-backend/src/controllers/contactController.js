
// src/controllers/contactController.js
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { getAuthUrl, exchangeCodeForTokens, getOAuthClient } from "../utils/gmailService.js";
import { google } from "googleapis";
import { sendContactNotification, sendContactViaGmail } from "../utils/contactEmailService.js";

const prisma = new PrismaClient();

const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  // Simple RFC compliant-enough regex for basic validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/**
 * POST /api/contact/send
 * - Logged-in + useGmail=true: send via user's Gmail (if authorized) else return requiresAuth + authUrl
 * - Logged-in + useGmail=false: fallback sender + replyTo
 * - Logged-out: fallback sender + replyTo
 */
export const sendMessage = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const hasBearer = authHeader.startsWith("Bearer ");
    const token = hasBearer ? authHeader.split(" ")[1] : null;
    const useGmail = !!req.body?.useGmail;

    let user = null;

    // If token provided, try to verify and load user
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded?.id) {
          user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, name: true, email: true, gmailEmail: true, gmailRefreshToken: true },
          });
        }
      } catch (err) {
        // Token invalid/expired -> treat as logged-out/guest
        user = null;
      }
    }

    let name, email, message, userId;

    // Logged-in flow: trust DB user data, ignore any frontend-provided name/email
    if (user) {
      ({ message } = req.body || {});
      if (!message || !String(message).trim()) {
        return res.status(400).json({ success: false, message: "Message is required" });
      }
      userId = user.id;
      name = user.name;
      email = user.email;
    } else {
      // Logged-out flow: accept name/email/message from request body; userId = null
      ({ name, email, message } = req.body || {});
      if (!name || !String(name).trim()) {
        return res.status(400).json({ success: false, message: "Name is required" });
      }
      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ success: false, message: "A valid email is required" });
      }
      if (!message || !String(message).trim()) {
        return res.status(400).json({ success: false, message: "Message is required" });
      }
      userId = null;
      name = String(name).trim();
      email = String(email).trim().toLowerCase();
    }

    // Persist the contact message
    const saved = await prisma.contactMessage.create({
      data: {
        userId,
        name,
        email,
        message: String(message).trim(),
      },
    });

    // Routing of email sending
    if (user && useGmail) {
      // If the user wants to send via Gmail
      if (user.gmailRefreshToken) {
        // Try to send via Gmail API as the user
        try {
          await sendContactViaGmail({
            refreshToken: user.gmailRefreshToken,
            fromEmail: user.gmailEmail || user.email,
            name,
            email,
            message: String(message).trim(),
            userId,
            to: process.env.CONTACT_INBOX || "qatanlearning@gmail.com",
          });
          return res.status(201).json({
            success: true,
            message: "Your message has been sent successfully via your Gmail account!",
            id: saved.id,
            createdAt: saved.createdAt,
            via: "gmail",
          });
        } catch (gmailErr) {
          // If Gmail send fails (token revoked/expired), instruct re-auth
          console.error("Gmail send failed, requiring re-auth:", gmailErr?.message || gmailErr);
          const authUrl = getAuthUrl(token); // use current token as state
          return res.status(200).json({
            success: false,
            requiresAuth: true,
            authUrl,
            message: "Gmail authorization required. Please authorize and resend.",
          });
        }
      } else {
        // No refresh token: request Gmail consent
        const authUrl = getAuthUrl(token); // use current token as state
        return res.status(200).json({
          success: false,
          requiresAuth: true,
          authUrl,
          message: "Gmail authorization required. Please authorize and resend.",
        });
      }
    }

    // Default fallback notification email (site-owned sender with Reply-To)
    try {
      await sendContactNotification({
        name,
        email,
        message: String(message).trim(),
        userId,
        to: process.env.CONTACT_INBOX || "qatanlearning@gmail.com",
      });
    } catch (notifyErr) {
      // Log but do not fail the request if email fails
      console.error("Contact notification email failed:", notifyErr);
    }

    return res.status(201).json({
      success: true,
      message: "Your message has been sent successfully!",
      id: saved.id,
      createdAt: saved.createdAt,
      via: "fallback",
    });
  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

/**
 * GET /api/contact/gmail/auth-url
 * Returns Google OAuth consent URL for the logged-in user.
 */
export const getGmailAuthUrl = async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const hasBearer = authHeader.startsWith("Bearer ");
    const token = hasBearer ? authHeader.split(" ")[1] : null;
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    // Verify token to ensure it's not tampered
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    const url = getAuthUrl(token); // use token as state
    return res.status(200).json({ success: true, authUrl: url });
  } catch (err) {
    console.error("getGmailAuthUrl error:", err);
    return res.status(500).json({ success: false, message: "Failed to generate auth URL" });
  }
};

/**
 * GET /api/contact/gmail/callback?code=...&state=...
 * Handles Google OAuth callback, stores refresh token and Gmail address for the user,
 * and redirects back to FRONTEND_URL/about?gmailLinked=1
 */
export const gmailOAuthCallback = async (req, res) => {
  try {
    const code = req.query.code;
    const stateToken = req.query.state;

    if (!code || !stateToken) {
      return res.status(400).send("Missing code or state");
    }

    // Validate and decode state token (the original JWT)
    let decoded;
    try {
      decoded = jwt.verify(stateToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).send("Invalid state");
    }

    const userId = decoded?.id;
    if (!userId) return res.status(400).send("Invalid user");

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(tokens);

    // Fetch the user's Gmail address
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    let gmailEmail = null;
    try {
      const profile = await gmail.users.getProfile({ userId: "me" });
      gmailEmail = profile?.data?.emailAddress || null;
    } catch (e) {
      console.error("gmailOAuthCallback: unable to fetch profile, proceeding without gmailEmail:", e?.message || e);
    }

    // Persist refresh token and email (refresh_token only present on first consent)
    const updateData = {};
    if (gmailEmail) updateData.gmailEmail = gmailEmail;
    if (tokens.refresh_token) updateData.gmailRefreshToken = tokens.refresh_token;

    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    // Redirect back to frontend
    const redirectBase = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.redirect(`${redirectBase}/about?gmailLinked=1`);
  } catch (err) {
    console.error("gmailOAuthCallback error:", err);
    return res.status(500).send("Failed to complete Gmail authorization");
  }
};
