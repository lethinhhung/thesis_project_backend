import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { getAllCoursesAndLessons } from '../controllers/data.controllers';

const router = Router();

router.get('/get-all-courses-and-lessons', authenticate as any, getAllCoursesAndLessons as any);

export default router;
