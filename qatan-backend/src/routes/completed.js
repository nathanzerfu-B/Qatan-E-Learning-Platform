import express from "express";
import { checkAndMarkCourseCompletion } from "../controllers/completedController.js";

const router = express.Router();

/**
 * POST /api/completed/check
 * Body: { courseId: number }
 * Auth: JWT student token required
 */
router.post("/check", checkAndMarkCourseCompletion);

export default router;
