// src/controllers/supportController.js
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Create transporter for Gmail
const createTransporter = () => {
  const transportUser =
    process.env.INSTRUCTOR_EMAIL_USER || process.env.VERIFICATION_EMAIL_USER;

  const transportPass =
    transportUser === process.env.INSTRUCTOR_EMAIL_USER
      ? process.env.INSTRUCTOR_EMAIL_PASS
      : process.env.VERIFICATION_EMAIL_PASS;

  if (!transportUser || !transportPass) {
    throw new Error(
      "Email credentials not configured. Set INSTRUCTOR_EMAIL_USER/PASS or VERIFICATION_EMAIL_USER/PASS."
    );
  }

  // FIXED: correct Nodemailer function
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: transportUser,
      pass: transportPass,
    },
  });
};

export const sendSupportMessage = async (req, res) => {
  try {
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token" });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    const { subject, message } = req.body;

    if (!subject || !subject.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Subject is required" });
    }

    if (!message || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from:
        process.env.INSTRUCTOR_EMAIL_USER ||
        process.env.VERIFICATION_EMAIL_USER,
      to: "qatanlearning@gmail.com",
      subject: `Student Support: ${subject.trim()}`,
      text: `
Student Support Request

From: ${user.name} (${user.email})

Subject: ${subject.trim()}

Message:
${message.trim()}

User ID: ${user.id}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
          <h2>Student Support Request</h2>
          <p><strong>From:</strong> ${user.name} (${user.email})</p>
          <p><strong>Subject:</strong> ${subject.trim()}</p>
          <hr />
          <p style="white-space: pre-wrap;"><strong>Message:</strong><br>${message.trim()}</p>
          <hr />
          <p style="color:#666;">User ID: ${user.id}</p>
          <p style="color:#666;">This support request was sent automatically by the Qatan platform.</p>
        </div>
      `,
      replyTo: `${user.name} <${user.email}>`,
    };

    await transporter.sendMail(mailOptions);

    console.log(
      `Support message sent from user ${user.id} (${user.email}): ${subject.trim()}`
    );

    return res.status(200).json({
      success: true,
      message: "Your support message has been sent successfully!",
    });
  } catch (error) {
    console.error("sendSupportMessage error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send support message. Please try again later.",
    });
  }
};
