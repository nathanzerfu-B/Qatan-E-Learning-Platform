// src/routes/payments.routes.js
import express from "express";
import { initPayment, verifyPayment } from "../controllers/paymentController.js";


const router = express.Router();

// ------------------- INIT PAYMENT -------------------
// POST /api/payments/init
router.post("/init", initPayment);

// ------------------- VERIFY PAYMENT -------------------
// GET /api/payments/verify/:tx_ref
router.get("/verify/:tx_ref", verifyPayment);

export default router;
