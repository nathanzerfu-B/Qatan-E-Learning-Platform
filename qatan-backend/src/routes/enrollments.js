import express from "express";
import { createEnrollment, getStudentEnrollments, getAllEnrollments } from "../controllers/enrollmentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/enrollments - Create a new enrollment
router.post("/", createEnrollment);

// GET /api/enrollments - Get student's enrollments
router.get("/", getStudentEnrollments);

// GET /api/enrollments/admin/all - Get all enrollments (admin only)
router.get("/admin/all", authMiddleware, getAllEnrollments);

export default router;
