import express from 'express';
import { getPerformanceReports, getEnrollmentReports, getPaymentReports } from '../controllers/reportController.js';

const router = express.Router();

// Performance report route
router.get('/performance', getPerformanceReports);

// Enrollment report route
router.get('/enrollment', getEnrollmentReports);

// Payment report route
router.get('/payment', getPaymentReports);

export default router;
