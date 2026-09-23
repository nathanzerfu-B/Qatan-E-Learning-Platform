// utils/emailMonitor.js
import imaps from "imap-simple";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import {
  sendInstructorApprovalEmail,
  sendInstructorRejectionEmail,
} from "./emailService.js";

const prisma = new PrismaClient();

const config = {
  imap: {
    user: process.env.INSTRUCTOR_EMAIL_USER,
    password: process.env.INSTRUCTOR_EMAIL_PASS,
    host: "imap.gmail.com",
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 3000,
  },
};

// Extract name & email from email body (fallback)
const extractApplicantInfo = (body) => {
  const nameMatch = body.match(/(?:name|Name|NAME)[\s:]+([^\n\r]+)/);
  const emailMatch = body.match(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
  );

  const name = nameMatch ? nameMatch[1].trim() : "Unknown";
  const email = emailMatch ? emailMatch[1].trim() : null;

  return { name, email };
};

// Process incoming application
export const processInstructorApplication = async (name, email) => {
  try {
    const existing = await prisma.instructorApplication.findFirst({
      where: { email },
    });
    if (existing)
      return console.log(`⚠️ Application for ${email} already exists`);

    const application = await prisma.instructorApplication.create({
      data: { name, email, status: "pending" },
    });

    console.log(`✅ New instructor application created: ${name} (${email})`);
    return application;
  } catch (err) {
    console.error("❌ Error processing application:", err);
  }
};

// Approve application
export const approveInstructorApplication = async (id) => {
  try {
    const rawPasskey = Math.random().toString(36).substring(2, 10).toUpperCase();
    const hashedPasskey = await bcrypt.hash(rawPasskey, 10);

    const application = await prisma.instructorApplication.update({
      where: { id },
      data: { status: "approved", passkey: hashedPasskey, processedAt: new Date() },
    });

    await sendInstructorApprovalEmail(
      application.email,
      application.name,
      rawPasskey
    );
    console.log(`✅ Instructor approved: ${application.name} (${application.email})`);
    return application;
  } catch (err) {
    console.error("❌ Error approving application:", err);
    throw err;
  }
};

// Reject application
export const rejectInstructorApplication = async (id) => {
  try {
    const application = await prisma.instructorApplication.update({
      where: { id },
      data: { status: "rejected", processedAt: new Date() },
    });

    await sendInstructorRejectionEmail(application.email, application.name);
    console.log(`🚫 Instructor rejected: ${application.name} (${application.email})`);
    return application;
  } catch (err) {
    console.error("❌ Error rejecting application:", err);
    throw err;
  }
};

// Get all pending applications
export const getPendingInstructorApplications = async () => {
  try {
    return await prisma.instructorApplication.findMany({
      where: { status: "pending" },
      orderBy: { appliedAt: "desc" },
    });
  } catch (err) {
    console.error("❌ Error fetching pending applications:", err);
    throw err;
  }
};

// Monitor emails
export const monitorEmails = async () => {
  try {
    console.log("📡 Connecting to Gmail IMAP...");
    const connection = await imaps.connect(config);
    await connection.openBox("INBOX");

    const searchCriteria = ["UNSEEN"];
    const fetchOptions = { bodies: ["HEADER", "TEXT"], markSeen: true };
    const messages = await connection.search(searchCriteria, fetchOptions);

    for (const message of messages) {
      const header = message.parts.find((p) => p.which === "HEADER");
      const text = message.parts.find((p) => p.which === "TEXT");
      if (!header || !text) continue;

      const subject = header.body.subject?.[0] || "";
      const body = text.body;

      // 🧠 NEW — Extract sender info from "From" header
      const fromHeader = header.body.from?.[0] || "";
      let senderName = "Unknown";
      let senderEmail = null;

      // Match both "Name <email>" and "<email>" formats
      const match = fromHeader.match(/(.*)<(.*)>/);
      if (match) {
        senderName = match[1].trim().replace(/["']/g, "") || "Unknown";
        senderEmail = match[2].trim();
      } else if (fromHeader.includes("@")) {
        senderEmail = fromHeader.trim();
      }

      // ✅ Fallback: extract name/email from body if needed
      if (!senderName || senderName === "Unknown" || !senderEmail) {
        const extracted = extractApplicantInfo(body);
        senderName =
          extracted.name !== "Unknown" ? extracted.name : senderName;
        senderEmail = extracted.email || senderEmail;
      }

      // ✅ If still no name, infer from email username
      if (senderName === "Unknown" && senderEmail) {
        senderName = senderEmail.split("@")[0].replace(/[._]/g, " ");
      }

      // ✅ Only process if we have an email and relevant subject/body
      if (
        (subject.toLowerCase().includes("instructor") ||
          subject.toLowerCase().includes("application") ||
          body.toLowerCase().includes("instructor")) &&
        senderEmail
      ) {
        await processInstructorApplication(senderName, senderEmail);
      }
    }

    console.log("📨 Inbox scan complete");
    connection.end();
  } catch (err) {
    console.error("❌ Error monitoring emails:", err);
  }
};

// Validate instructor passkey
export const validateInstructorPasskey = async (email, passkey) => {
  try {
    const trimmedEmail = email.trim();
    const trimmedPasskey = passkey.trim();

    console.log("🔍 Validating passkey for email:", trimmedEmail, "passkey:", trimmedPasskey);

    // Get all approved applications with matching email (case-insensitive)
    const applications = await prisma.instructorApplication.findMany({
      where: {
        email: {
          equals: trimmedEmail,
          mode: 'insensitive'
        },
        status: 'approved'
      }
    });

    // Check each application to see if the passkey matches using bcrypt
    for (const application of applications) {
      const isValidPasskey = await bcrypt.compare(trimmedPasskey, application.passkey);
      if (isValidPasskey) {
        console.log("🔍 Found valid application:", { id: application.id, email: application.email, status: application.status });
        return application;
      }
    }

    console.log("🔍 No valid application found");
    throw new Error("Invalid passkey or your instructor application is not approved yet.");
  } catch (err) {
    console.error("❌ Error validating passkey:", err);
    throw err;
  }
};

// Start monitoring with interval
export const startEmailMonitoring = () => {
  console.log("🚀 Starting email monitoring for instructor applications...");
  monitorEmails(); // initial check
  setInterval(monitorEmails, 3 * 60 * 1000); // every 2 minutes
};
