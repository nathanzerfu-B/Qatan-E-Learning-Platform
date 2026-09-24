// routes/adminSettings.js
import express from "express";
import { getSettings, updateSettings } from "../controllers/adminSettings.js";
import { authMiddleware, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/platform-settings", authMiddleware, requireRole("admin"), getSettings);
router.post("/platform-settings", authMiddleware, requireRole("admin"), updateSettings);

export default router;

