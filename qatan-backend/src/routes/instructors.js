import express from "express";
import multer from "multer";
import { updateInstructorProfile } from "../controllers/instructorController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// PUT /api/instructors/profile - Update instructor profile (instructor only)
router.put("/profile", authMiddleware, upload.single("profilePicture"), updateInstructorProfile);

export default router;
