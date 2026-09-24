import express from 'express';
import { getPerformanceReports, getEnrollmentReports, getPaymentReports } from '../controllers/reportController.js';
import { authMiddleware, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Performance report route (Admin only)
router.get('/performance', authMiddleware, requireRole('admin'), getPerformanceReports);

// Enrollment report route (Admin only)
router.get('/enrollment', authMiddleware, requireRole('admin'), getEnrollmentReports);

// Payment report route (Admin only)
router.get('/payment', authMiddleware, requireRole('admin'), getPaymentReports);

export default router;

