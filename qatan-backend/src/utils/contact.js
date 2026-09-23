/* src/routes/contact.js */
import express from "express";
import {
  sendMessage,
  getGmailAuthUrl,
  gmailOAuthCallback,
} from "../controllers/contactController.js";

const router = express.Router();

// POST /api/contact/send
router.post("/send", sendMessage);

// Gmail OAuth endpoints
// GET /api/contact/gmail/auth-url -> returns { authUrl }
router.get("/gmail/auth-url", getGmailAuthUrl);

// GET /api/contact/gmail/callback -> Google redirects here after consent
router.get("/gmail/callback", gmailOAuthCallback);

export default router;
