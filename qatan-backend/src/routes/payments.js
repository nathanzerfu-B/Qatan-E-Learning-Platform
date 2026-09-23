import express from "express";
import { initPayment, verifyPayment } from "../controllers/paymentController..js";

const router = express.Router();

// Initialize payment
router.post("/init", initPayment);

// Verify payment
router.get("/verify/:tx_ref", verifyPayment);

export default router;
