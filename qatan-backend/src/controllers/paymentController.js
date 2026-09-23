import axios from "axios";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ------------------- INIT PAYMENT -------------------
export const initPayment = async (req, res) => {
  try {
    console.log("📌 Init payment request received");

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Missing Authorization header" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) return res.status(401).json({ message: "Invalid JWT token" });

    const userId = parseInt(decoded.id);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const { courseId } = req.body;
    if (!courseId) return res.status(400).json({ message: "courseId is required" });

    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
      include: { instructor: { select: { name: true } } }
    });

    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course.status !== 'published') return res.status(400).json({ message: "Course is not available for purchase" });

    // FREE COURSE → Auto enroll
    if (!course.price || course.price <= 0) {
      const existing = await prisma.enrollment.findFirst({ where: { studentId: userId, courseId: parseInt(courseId) } });
      if (existing) return res.json({ message: "Already enrolled", status: "success" });

      await prisma.enrollment.create({
        data: { studentId: userId, courseId: parseInt(courseId), status: "active" },
      });

      return res.json({ message: "Enrolled (Free Course)", status: "success" });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({ where: { studentId: userId, courseId: parseInt(courseId) } });
    if (existingEnrollment) return res.status(400).json({ message: "Already enrolled in this course" });

    // PAID COURSE → Chapa Payment
    const tx_ref = `qatan-${userId}-${courseId}-${Date.now()}`;

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: { userId, courseId: parseInt(courseId), amount: course.price, tx_ref, status: 'pending' }
    });

    const cleanTitle = course.title.replace(/[^a-zA-Z0-9\s\-_.]/g, '').substring(0, 12);
    const paymentTitle = `Buy ${cleanTitle}`;

    const chapaBody = {
      amount: String(course.price),
      currency: "ETB",
      email: user.email,
      first_name: user.name.split(' ')[0] || user.name,
      last_name: user.name.split(' ').slice(1).join(' ') || 'Student',
      tx_ref,
      callback_url: `${process.env.BACKEND_URL}/api/payments/verify/${tx_ref}`,
      return_url: `${FRONTEND_URL}/payment-success?tx_ref=${tx_ref}`,
      customization: { title: paymentTitle, description: `Course payment for ${course.title}` }
    };

    console.log("📤 Sending to Chapa:", chapaBody);
    const chapaRes = await axios.post("https://api.chapa.co/v1/transaction/initialize", chapaBody, {
      headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}`, "Content-Type": "application/json" }
    });

    console.log("📥 Chapa Response:", chapaRes.data);

    if (chapaRes.data.status === 'success') {
      return res.json({ success: true, checkout_url: chapaRes.data.data.checkout_url, tx_ref });
    } else {
      await prisma.transaction.update({ where: { id: transaction.id }, data: { status: 'failed' } });
      return res.status(500).json({ message: "Failed to initialize payment", details: chapaRes.data });
    }

  } catch (err) {
    console.error("❌ Payment Init ERROR:", err);
    console.error("Error response:", err.response?.data);
    return res.status(500).json({ message: "Payment initialization failed", error: err.message });
  }
};

// ------------------- VERIFY PAYMENT -------------------
export const verifyPayment = async (req, res) => {
  try {
    const tx_ref = req.params.tx_ref || req.body.tx_ref;
    if (!tx_ref) return res.status(400).json({ error: "Transaction reference is required" });

    const transaction = await prisma.transaction.findUnique({ where: { tx_ref }, include: { user: true, course: true } });
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });

    if (transaction.status === 'completed') return res.json({ success: true, message: "Payment already verified" });

    // Call Chapa API to verify payment
    const chapaResponse = await axios.get(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
      headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` }
    });

    console.log("Chapa verification response:", chapaResponse.data);

    const chapaStatus = chapaResponse.data.data?.status;

    if (chapaResponse.data.status === 'success' && chapaStatus === 'success') {
      await prisma.transaction.update({ where: { id: transaction.id }, data: { status: 'completed' } });

      // Create enrollment
      const enrollment = await prisma.enrollment.create({
        data: { studentId: transaction.userId, courseId: transaction.courseId, status: 'active', paymentRef: tx_ref },
        include: { course: true, student: { select: { id: true, name: true, email: true } } }
      });

      return res.json({ success: true, message: "Payment verified and enrollment created", enrollment });
    } else {
      await prisma.transaction.update({ where: { id: transaction.id }, data: { status: 'failed' } });
      return res.status(400).json({ error: "Payment verification failed", chapa: chapaResponse.data });
    }

  } catch (error) {
    console.error("❌ Payment Verify ERROR:", error);
    return res.status(500).json({ error: "Failed to verify payment" });
  }
};


