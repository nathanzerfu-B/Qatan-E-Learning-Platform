import express from "express";
import multer from "multer";
import { getAllUsers, getUserById, updateUserStatus, getUsersMetrics, getCoursesMetrics, createUserByAdmin, updateProfile } from "../controllers/userController.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/users - Create user by admin (admin only)
router.post("/", createUserByAdmin);

// GET /api/users - Get all users (admin only)
router.get("/", getAllUsers);

// GET /api/users/metrics - Get users metrics (admin only)
router.get("/metrics", getUsersMetrics);

// GET /api/courses/metrics - Get courses metrics (admin only)
router.get("/courses/metrics", getCoursesMetrics);

// GET /api/users/:id - Get user by ID (admin only)
router.get("/:id", getUserById);

// PUT /api/users/:id/status - Update user status (admin only)
router.put("/:id/status", updateUserStatus);

// PUT /api/users/profile - Update student profile (authenticated user only)
router.put("/profile", upload.single("profilePicture"), updateProfile);

export default router;
