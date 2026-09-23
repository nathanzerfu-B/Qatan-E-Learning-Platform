// src/utils/contactEmailService.js
import nodemailer from "nodemailer";
import { sendAsUser } from "./gmailService.js";

/**
 * Fallback contact notification using a site-owned verified sender.
 * Ensures replies go directly to the user via Reply-To.
 */
export const sendContactNotification = async ({ name, email, message, userId, to }) => {
  const recipient = to || process.env.CONTACT_INBOX || "qatanlearning@gmail.com";
  const verifiedFrom =
    process.env.CONTACT_SENDER ||
    process.env.INSTRUCTOR_EMAIL_USER ||
    process.env.VERIFICATION_EMAIL_USER;

  if (!verifiedFrom) {
    throw new Error("No verified sender configured. Set CONTACT_SENDER or INSTRUCTOR_EMAIL_USER or VERIFICATION_EMAIL_USER.");
  }

  // Build a transport using the instructor account if available, else verification account.
  const transportUser = process.env.INSTRUCTOR_EMAIL_USER || process.env.VERIFICATION_EMAIL_USER;
  const transportPass = transportUser === process.env.INSTRUCTOR_EMAIL_USER
    ? process.env.INSTRUCTOR_EMAIL_PASS
    : process.env.VERIFICATION_EMAIL_PASS;

  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: transportUser,
      pass: transportPass,
    },
  });

  const mailOptions = {
    from: verifiedFrom,
    to: recipient,
    subject: "New Contact Message - Qatan",
    text: `New Contact Message Received

From: ${name ? name : "(Anonymous)"}
Email: ${email || "(not provided)"}

${message}
`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <h2>New Contact Message Received</h2>
        <p><strong>From:</strong> ${name ? name : "(Anonymous)"}</p>
        <p><strong>Email:</strong> ${email || "(not provided)"}</p>
        <hr />
        <p style="white-space: pre-wrap;">${message}</p>
        <hr />
        <p style="color:#666;">This notification was sent automatically by the Qatan platform.</p>
      </div>
    `,
  };

  // Ensure replies go directly to the sender's email (while sending from a verified account)
  if (email) {
    mailOptions.replyTo = `${name ? name : "Guest"} <${email}>`;
  }

  await transport.sendMail(mailOptions);
};

/**
 * Send contact message via the user's Gmail account using OAuth refresh token.
 * This actually sends From: user@gmail.com via Gmail API.
 */
export const sendContactViaGmail = async ({ refreshToken, fromEmail, name, email, message, userId, to }) => {
  const recipient = to || process.env.CONTACT_INBOX || "qatanlearning@gmail.com";

  const subject = "New Contact Message - Qatan";
  const text = `New Contact Message Received

From: ${name ? name : "(Anonymous)"}
Email: ${email || "(not provided)"}

${message}
`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <h2>New Contact Message Received</h2>
      <p><strong>From:</strong> ${name ? name : "(Anonymous)"}</p>
      <p><strong>Email:</strong> ${email || "(not provided)"}</p>
      <hr />
      <p style="white-space: pre-wrap;">${message}</p>
      <hr />
      <p style="color:#666;">This notification was sent automatically by the Qatan platform.</p>
    </div>
  `;

  // Use Gmail API to send as the user
  await sendAsUser({
    refreshToken,
    fromEmail,
    to: recipient,
    subject,
    text,
    html,
  });
};
