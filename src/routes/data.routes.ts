import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { getLimitCoursesAndLessons, searchAll, uploadImageController } from '../controllers/data.controllers';
import { upload } from '../config/multer';

const router = Router();

router.get('/get-limit-courses-and-lessons', authenticate as any, getLimitCoursesAndLessons as any);
router.get('/search', authenticate as any, searchAll as any);
router.post('/upload-image', authenticate as any, upload.single('image'), uploadImageController as any);

export default router;
