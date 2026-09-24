import express from "express";
import multer from "multer";
import { getAllUsers, getUserById, updateUserStatus, getUsersMetrics, getCoursesMetrics, createUserByAdmin, updateProfile } from "../controllers/userController.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/users - Create user by admin (admin only)
router.post("/", authMiddleware, requireRole("admin"), createUserByAdmin);

// GET /api/users - Get all users (admin only)
router.get("/", authMiddleware, requireRole("admin"), getAllUsers);

// GET /api/users/metrics - Get users metrics (admin only)
router.get("/metrics", authMiddleware, requireRole("admin"), getUsersMetrics);

// GET /api/courses/metrics - Get courses metrics (admin only)
router.get("/courses/metrics", authMiddleware, requireRole("admin"), getCoursesMetrics);

// GET /api/users/:id - Get user by ID (admin only)
router.get("/:id", authMiddleware, requireRole("admin"), getUserById);

// PUT /api/users/:id/status - Update user status (admin only)
router.put("/:id/status", authMiddleware, requireRole("admin"), updateUserStatus);

// PUT /api/users/profile - Update student profile (authenticated user only)
router.put("/profile", authMiddleware, upload.single("profilePicture"), updateProfile);

export default router;

