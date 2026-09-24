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



// ✅ Auth Routes (register, login)
app.use("/api/auth", authRoutes);
app.use("/api/auth/discord", discordAuthRoutes);

// ✅ Quiz Routes
app.use("/api/quizzes", quizRoutes);

// ✅ Course Routes
app.use("/api/courses", courseRoutes);

// 🛡️ Centralized 404 & Safe Error Handling Middlewares
import { errorHandler, notFoundHandler, setupProcessErrorHandlers } from "./middleware/errorHandler.js";
setupProcessErrorHandlers();
app.use(notFoundHandler);
app.use(errorHandler);

// 🚀 Start Server (ALWAYS at the very bottom)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

