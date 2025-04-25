import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { createCourse, getAllCourses, getCourse } from '../controllers/course.controllers';

const router = Router();

router.post('/create-course', authenticate as any, createCourse as any);
router.get('/get-course/:id', authenticate as any, getCourse as any);
router.get('/get-all-courses', authenticate as any, getAllCourses as any);

export default router;
