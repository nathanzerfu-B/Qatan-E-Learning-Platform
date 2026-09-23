import express from "express";
import { getLessons, createLesson, updateLesson, deleteLesson, uploadLessonMedia } from "../controllers/lessonController.js";
import { uploadThumbnail, uploadVideo } from "../utils/cloudinary.js";

const router = express.Router();

/**
 * Lesson-specific media uploads (MUST be defined BEFORE parameterized routes)
 */

// POST /api/lessons/upload-image - Upload lesson image
router.post("/upload-image", uploadThumbnail.single('media'), uploadLessonMedia);

// POST /api/lessons/upload-video - Upload lesson video
router.post("/upload-video", uploadVideo.single('media'), uploadLessonMedia);

// Backwards-compatible generic endpoint (defaults to image behavior)
router.post("/upload-media", uploadThumbnail.single('media'), uploadLessonMedia);

// GET /api/lessons/:moduleId - Get all lessons for a module
router.get("/:moduleId", getLessons);

// POST /api/lessons/:moduleId - Create a new lesson
router.post("/:moduleId", createLesson);

// PUT /api/lessons/:lessonId - Update a lesson
router.put("/:lessonId", updateLesson);

// DELETE /api/lessons/:lessonId - Delete a lesson
router.delete("/:lessonId", deleteLesson);

export default router;
