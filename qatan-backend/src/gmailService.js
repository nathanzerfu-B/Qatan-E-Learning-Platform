// src/utils/gmailService.js
import { google } from "googleapis";

/**
 * Build and return a Google OAuth2 client
 */
export function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google OAuth environment variables (GOOGLE_CLIENT_ID/SECRET/OAUTH_REDIRECT)");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate Google OAuth2 consent URL for Gmail send scope
 */
export function getAuthUrl(state) {
  const oauth2Client = getOAuthClient();

  const scopes = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.metadata"
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state, // caller should pass a JWT or other CSRF-safe state
  });

  return url;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code) {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens; // contains access_token, refresh_token (on first consent), expiry_date, id_token, etc.
}

/**
 * Send an email as the user using Gmail API (From: user's Gmail)
 * refreshToken: user's stored refresh token
 * fromEmail: the user's Gmail address (optional, for header clarity)
 * to, subject, text, html: message content
 */
export async function sendAsUser({ refreshToken, fromEmail, to, subject, text, html }) {
  if (!refreshToken) {
    throw new Error("Missing Gmail refresh token");
  }
  if (!to || !subject || (!text && !html)) {
    throw new Error("Missing required email fields for Gmail send");
  }

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // Build RFC-822 message
  const boundary = "__qatan_boundary__";
  const headers = [
    `From: ${fromEmail || "me"}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    html
      ? `Content-Type: multipart/alternative; boundary="${boundary}"`
      : `Content-Type: text/plain; charset="UTF-8"`,
  ];

  let messageBody = "";
  if (html) {
    messageBody = [
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      text || "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "",
      html,
      `--${boundary}--`,
      "",
    ].join("\r\n");
  } else {
    messageBody = text || "";
  }

  const rawMessage = `${headers.join("\r\n")}\r\n\r\n${messageBody}`;

  const encodedMessage = Buffer.from(rawMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
  });

  return res.data;
}
