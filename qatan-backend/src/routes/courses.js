import express from "express";
import { getCourses, createCourse, updateCourse, deleteCourse, uploadCourseThumbnail, uploadCourseVideo, getPendingCourses, approveCourse, rejectCourse, getPopularCourses } from "../controllers/courseController.js";
import { uploadThumbnail, uploadVideo } from "../utils/cloudinary.js";

const router = express.Router();



// GET /api/courses - Get all courses (public or admin filtered)
router.get("/", getCourses);

// GET /api/courses/popular - Get popular courses by enrollment count
router.get("/popular", getPopularCourses);


// GET /api/courses/:id - Get single course by ID (public)
router.get("/:id", getCourses);

// POST /api/courses - Create a new course
router.post("/", createCourse);

// PUT /api/courses/:id - Update a course
router.put("/:id", updateCourse);

// DELETE /api/courses/:id - Delete a course
router.delete("/:id", deleteCourse);

// POST /api/courses/upload-thumbnail - Upload course thumbnail
router.post("/upload-thumbnail", uploadThumbnail.single('thumbnail'), uploadCourseThumbnail);

// POST /api/courses/upload-video - Upload course video
router.post("/upload-video", uploadVideo.single('video'), uploadCourseVideo);

// GET /api/courses/admin/pending - Get pending courses for admin approval
router.get("/admin/pending", getPendingCourses);

// POST /api/courses/admin/approve/:courseId - Approve a course
router.post("/admin/approve/:courseId", approveCourse);

// POST /api/courses/admin/reject/:courseId - Reject a course
router.post("/admin/reject/:courseId", rejectCourse);

export default router;
