// src/server.js

// 🧩 Imports
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { startEmailMonitoring, approveInstructorApplication, rejectInstructorApplication, getPendingInstructorApplications } from "./utils/emailMonitor.js";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.js";
import discordAuthRoutes from "./routes/discordAuth.js";
import instructorApplicationsRoutes from "./routes/instructorApplications.js";
import cloudinary from "./utils/cloudinary.js";
import { generalApiLimiter, securityHeaders, permissionsPolicy } from "./middleware/securityMiddleware.js";
import { errorHandler, notFoundHandler, setupProcessErrorHandlers } from "./middleware/errorHandler.js";

// 🧱 Load environment variables
dotenv.config();

// 🛡️ Global Process Error Safety Nets
setupProcessErrorHandlers();

// 🧠 Initialize express and prisma
const app = express();
const prisma = new PrismaClient();

// 🛡️ HTTP Security Headers via Helmet & Permissions-Policy
app.use(securityHeaders);
app.use(permissionsPolicy);

// 🌐 Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// 🛡️ General API Rate Limiting
app.use("/api", generalApiLimiter);

// ✅ Root Route (to test backend health)
app.get("/", (req, res) => {
  res.send("Qatan E-Learning API is running ✅");
});

// ✅ Auth Routes (register, login, password reset - with dedicated rate limiting)
app.use("/api/auth", authRoutes);
app.use("/api/auth/discord", discordAuthRoutes);

// 📬 Instructor Application Routes
app.use("/api/instructor-applications", instructorApplicationsRoutes);

// ✅ Course Routes
import courseRoutes from "./routes/courses.js";
app.use("/api/courses", courseRoutes);

// 👥 User Routes (Admin)
import userRoutes from "./routes/users.js";
app.use("/api/users", userRoutes);

// 📚 Module Routes
import moduleRoutes from "./routes/modules.js";
app.use("/api/modules", moduleRoutes);

// 📖 Lesson Routes
import lessonRoutes from "./routes/lessons.js";
app.use("/api/lessons", lessonRoutes);

// 📊 Progress Routes
import progressRoutes from "./routes/progress.js";
app.use("/api/progress", progressRoutes);

// ✅ Quiz Routes
import quizRoutes from "./routes/quiz.js";
app.use("/api/quizzes", quizRoutes);

// ✅ Enrollment Routes
import enrollmentRoutes from "./routes/enrollments.js";
app.use("/api/enrollments", enrollmentRoutes);

// 💳 Payment Routes
import paymentRoutes from "./routes/payments.routes.js";
app.use("/api/payments", paymentRoutes);

// 📊 Report Routes
import reportRoutes from "./routes/reportRoutes.js";
app.use("/api/reports", reportRoutes);

// ⚙️ settings Route 
import adminSettingsRoutes from "./routes/adminSettings.js";
app.use("/api/admin", adminSettingsRoutes);

// 👨‍🎓 student routes
import studentRoutes from "./routes/studentRoutes.js";
app.use("/api/students", studentRoutes);

// 📊 Analytics Routes
import analyticsRoutes from "./routes/analytics.js";
app.use("/api/analytics", analyticsRoutes);

// 👨‍🏫 Instructor Routes
import instructorRoutes from "./routes/instructors.js";
app.use("/api/instructors", instructorRoutes);

// 📬 Contact Routes
import contactRoutes from "./routes/contact.js";
app.use("/api/contact", contactRoutes);

// 📬 Support Routes
import supportRoutes from "./routes/support.js";
import completedRoutes from "./routes/completed.js";

app.use("/api/support", supportRoutes);
app.use("/api/completed", completedRoutes);

// 📬 Start IMAP Email Monitoring
startEmailMonitoring();

// Import sweepAndMarkCourseCompletions for background job
import { sweepAndMarkCourseCompletions } from "./controllers/progressController.js";

// Run background job on server start to mark completed courses for past actions
(async () => {
  try {
    console.log("Running initial course completions sweep...");
    await sweepAndMarkCourseCompletions();
    console.log("Initial course completions sweep completed.");

    // Set interval for periodic course completion checking every 3 minutes
    setInterval(async () => {
      try {
        console.log("Running periodic course completions sweep...");
        await sweepAndMarkCourseCompletions();
        console.log("Periodic course completions sweep completed.");
      } catch (error) {
        console.error("Error during periodic course completions sweep:", error);
      }
    }, 3 * 60 * 1000); // 3 minutes interval

  } catch (error) {
    console.error("Error during initial course completions sweep:", error);
  }
})();

// 🛡️ Centralized 404 & Safe Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

// 🚀 Start Server (ALWAYS at the very bottom)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
