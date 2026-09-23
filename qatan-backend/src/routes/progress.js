import express from "express";
import { getCourseProgress, updateLessonProgress, getLessonProgress, getAllProgress } from "../controllers/progressController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/progress/course/:courseId - Get overall course progress
router.get("/course/:courseId", getCourseProgress);

// GET /api/progress/lesson/:lessonId - Get progress for a specific lesson
router.get("/lesson/:lessonId", getLessonProgress);

// PUT /api/progress/lesson/:lessonId - Update lesson progress
router.put("/lesson/:lessonId", updateLessonProgress);

// GET /api/progress/admin/all - Get all progress records (admin only)
router.get("/admin/all", authMiddleware, getAllProgress);

export default router;
