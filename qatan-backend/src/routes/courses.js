import express from "express";
import { getCourses, createCourse, updateCourse, deleteCourse, uploadCourseThumbnail, uploadCourseVideo, getPendingCourses, approveCourse, rejectCourse, getPopularCourses } from "../controllers/courseController.js";
import { uploadThumbnail, uploadVideo } from "../utils/cloudinary.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/courses - Get all courses (public)
router.get("/", getCourses);

// GET /api/courses/popular - Get popular courses by enrollment count (public)
router.get("/popular", getPopularCourses);

// GET /api/courses/:id - Get single course by ID (public)
router.get("/:id", getCourses);

// POST /api/courses - Create a new course (Instructor or Admin only)
router.post("/", authMiddleware, requireRole("admin", "instructor"), createCourse);

// PUT /api/courses/:id - Update a course (Instructor or Admin only)
router.put("/:id", authMiddleware, requireRole("admin", "instructor"), updateCourse);

// DELETE /api/courses/:id - Delete a course (Instructor or Admin only)
router.delete("/:id", authMiddleware, requireRole("admin", "instructor"), deleteCourse);

// POST /api/courses/upload-thumbnail - Upload course thumbnail (Instructor or Admin only)
router.post("/upload-thumbnail", authMiddleware, requireRole("admin", "instructor"), uploadThumbnail.single('thumbnail'), uploadCourseThumbnail);

// POST /api/courses/upload-video - Upload course video (Instructor or Admin only)
router.post("/upload-video", authMiddleware, requireRole("admin", "instructor"), uploadVideo.single('video'), uploadCourseVideo);

// GET /api/courses/admin/pending - Get pending courses for admin approval (Admin only)
router.get("/admin/pending", authMiddleware, requireRole("admin"), getPendingCourses);

// POST /api/courses/admin/approve/:courseId - Approve a course (Admin only)
router.post("/admin/approve/:courseId", authMiddleware, requireRole("admin"), approveCourse);

// POST /api/courses/admin/reject/:courseId - Reject a course (Admin only)
router.post("/admin/reject/:courseId", authMiddleware, requireRole("admin"), rejectCourse);

export default router;

