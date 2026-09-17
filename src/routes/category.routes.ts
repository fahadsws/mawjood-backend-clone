import { Router } from 'express';
import {
  getAllCategories,
  getPopularCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Public routes
router.get('/', getAllCategories);
router.get('/popular', getPopularCategories);
router.get('/:id', getCategoryById);
router.get('/slug/:slug', getCategoryBySlug);

// Admin only routes
router.post('/', authenticate, authorize('ADMIN'), 
  upload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]), 
  createCategory
);
router.put('/:id', authenticate, authorize('ADMIN'), 
  upload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]), 
  updateCategory
);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

export default router;
