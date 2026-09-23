// src/server_no_discord.js

// 🧩 Imports
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.js";
import discordAuthRoutes from "./routes/discordAuth.js";
import quizRoutes from "./routes/quiz.js";
import courseRoutes from "./routes/courses.js";

// 🧱 Load environment variables
dotenv.config();

// 🧠 Initialize express and prisma
const app = express();
const prisma = new PrismaClient();

// 🌐 Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// ✅ Root Route (to test backend)
app.get("/", (req, res) => {
  res.send("Qatan E-Learning API is running ✅");
});

// ✅ Database Test Route
app.get("/api/test-db", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// ✅ Add User route (for testing DB insert)
app.post("/api/add-user", async (req, res) => {
  try {
    const bcrypt = (await import("bcrypt")).default;
    const hashedPassword = await bcrypt.hash("123456", 10);
    const user = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
        role: "student",
      },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Update Passwords route (for fixing existing plain text passwords)
app.post("/api/update-passwords", async (req, res) => {
  try {
    const bcrypt = (await import("bcrypt")).default;
    const hashedPassword = await bcrypt.hash("123456", 10);
    const users = await prisma.user.findMany();
    const updates = users.map(user =>
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      })
    );
    await Promise.all(updates);
    res.json({ success: true, message: "All passwords updated to hashed '123456'" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Reset Auto-Increment Counters route (for fixing ID gaps after deletions)
app.post("/api/reset-sequences", async (req, res) => {
  try {
    // Reset sequences for all tables to ensure IDs are consecutive
    await prisma.$executeRaw`SELECT setval('User_id_seq', (SELECT COALESCE(MAX(id), 0) FROM "User") + 1);`;
    await prisma.$executeRaw`SELECT setval('Course_id_seq', (SELECT COALESCE(MAX(id), 0) FROM "Course") + 1);`;
    await prisma.$executeRaw`SELECT setval('Enrollment_id_seq', (SELECT COALESCE(MAX(id), 0) FROM "Enrollment") + 1);`;
    await prisma.$executeRaw`SELECT setval('Quiz_id_seq', (SELECT COALESCE(MAX(id), 0) FROM "Quiz") + 1);`;

    res.json({ success: true, message: "Auto-increment sequences reset successfully" });
  } catch (error) {
    console.error("Error resetting sequences:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Auth Routes (register, login)
app.use("/api/auth", authRoutes);
app.use("/api/auth/discord", discordAuthRoutes);

// ✅ Quiz Routes
app.use("/api/quizzes", quizRoutes);

// ✅ Course Routes
app.use("/api/courses", courseRoutes);

// 🚀 Start Server (ALWAYS at the very bottom)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
