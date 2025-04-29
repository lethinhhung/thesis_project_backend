import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { createCourse, deleteCourse, getAllCourses, getCourse } from '../controllers/course.controllers';

const router = Router();

router.post('/create-course', authenticate as any, createCourse as any);
router.get('/get-course/:id', authenticate as any, getCourse as any);
router.get('/get-all-courses', authenticate as any, getAllCourses as any);
router.delete('/delete-course/:id', authenticate as any, deleteCourse as any);

export default router;
