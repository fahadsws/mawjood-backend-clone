import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { resumeUpload } from '../middleware/upload.middleware';
import { createCareerOpening, deleteCareerOpening, getActiveCareerOpenings, getAllCareerOpenings, getCareerApplications, submitCareerApplication, updateCareerOpening } from '../controllers/career.controller';

const router = Router();
router.get('/', getActiveCareerOpenings);
router.post('/applications', resumeUpload.single('resume'), submitCareerApplication);
router.get('/admin/all', authenticate, authorize('ADMIN'), getAllCareerOpenings);
router.get('/admin/applications', authenticate, authorize('ADMIN'), getCareerApplications);
router.post('/', authenticate, authorize('ADMIN'), createCareerOpening);
router.patch('/:id', authenticate, authorize('ADMIN'), updateCareerOpening);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCareerOpening);
export default router;
