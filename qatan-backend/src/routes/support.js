// src/routes/support.js
import express from "express";
import { sendSupportMessage } from "../controllers/supportController.js";

const router = express.Router();

// POST /api/support/send
router.post("/send", sendSupportMessage);

export default router;
