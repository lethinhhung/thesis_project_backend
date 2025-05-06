import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { getLimitCoursesAndLessons, searchAll } from '../controllers/data.controllers';

const router = Router();

router.get('/get-limit-courses-and-lessons', authenticate as any, getLimitCoursesAndLessons as any);
router.get('/search', authenticate as any, searchAll as any);

export default router;
