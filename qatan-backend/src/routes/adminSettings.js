// routes/adminSettings.js
import express from "express";
import { getSettings, updateSettings } from "../controllers/adminSettings.js";

const router = express.Router();

router.get("/platform-settings", getSettings);
router.post("/platform-settings", updateSettings);

export default router;
