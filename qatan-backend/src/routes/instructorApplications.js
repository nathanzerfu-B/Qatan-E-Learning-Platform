import express from 'express';
import { getPendingInstructorApplications, approveInstructorApplication, rejectInstructorApplication, validateInstructorPasskey } from '../utils/emailMonitor.js';

const router = express.Router();

// Get all pending instructor applications (Admin only)
router.get('/pending', async (req, res) => {
  try {
    const applications = await getPendingInstructorApplications();
    res.json({ success: true, applications });
  } catch (error) {
    console.error('Error fetching pending applications:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Approve instructor application (Admin only)
router.post('/:id/approve', async (req, res) => {
  try {
    const application = await approveInstructorApplication(parseInt(req.params.id));
    res.json({ success: true, application });
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({ message: 'Failed to approve application' });
  }
});

// Reject instructor application (Admin only)
router.post('/:id/reject', async (req, res) => {
  try {
    const application = await rejectInstructorApplication(parseInt(req.params.id));
    res.json({ success: true, application });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ message: 'Failed to reject application' });
  }
});

// Validate instructor passkey (Public endpoint for signup)
router.post('/validate-passkey', async (req, res) => {
  try {
    const { email, passkey } = req.body;

    if (!email || !passkey) {
      return res.status(400).json({ success: false, message: 'Email and passkey are required' });
    }

    await validateInstructorPasskey(email, passkey);

    res.json({ success: true, message: 'Passkey is valid' });
  } catch (error) {
    console.error('Error validating passkey:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
