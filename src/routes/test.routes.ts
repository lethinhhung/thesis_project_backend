import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { createTest, updateTest, deleteTest, getCourseTests, updateTestScore } from '../controllers/test.controllers';

const router = Router();

router.post('/create-test/:courseId', authenticate as any, createTest as any);
router.patch('/update-test/:testId', authenticate as any, updateTest as any);
router.delete('/delete-test/:testId', authenticate as any, deleteTest as any);
router.get('/get-course-tests/:courseId', authenticate as any, getCourseTests as any);
router.patch('/update-test-score/:testId', authenticate as any, updateTestScore as any);

export default router;
