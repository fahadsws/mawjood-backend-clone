import express from 'express';
import {
  createEnquiry,
  getBusinessEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  getUserEnquiries,
  getAllEnquiries,
  bulkUpdateEnquiryStatus,
} from '../controllers/enquiry.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Public route - Create enquiry (requires authentication)
router.post('/', authenticate, createEnquiry);

// User routes - Get own enquiries
router.get('/my-enquiries', authenticate, getUserEnquiries);

// Business owner routes - Get business enquiries
router.get('/business', authenticate, getBusinessEnquiries);

// Admin routes - Get all enquiries
router.get('/admin/all', authenticate, authorize('ADMIN'), getAllEnquiries);
router.patch('/admin/bulk-status', authenticate, authorize('ADMIN'), bulkUpdateEnquiryStatus);

// Get single enquiry
router.get('/:id', authenticate, getEnquiryById);

// Update enquiry status (Business Owner only)
router.put('/:id/status', authenticate, authorize('BUSINESS_OWNER'), updateEnquiryStatus);

export default router;

