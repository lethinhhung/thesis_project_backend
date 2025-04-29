import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import {
    createLesson,
    deleteLesson,
    getAllLesson,
    getLesson,
    updateLessonContent,
} from '../controllers/lessons.controllers';

const router = Router();

router.post('/create-lesson/:courseId', authenticate as any, createLesson as any);
router.get('/get-lesson/:id', authenticate as any, getLesson as any);
router.get('/get-all-lessons/:courseId', authenticate as any, getAllLesson as any);
router.put('/update-lesson-content/:id', authenticate as any, updateLessonContent as any);
router.delete('/delete-lesson/:id', authenticate as any, deleteLesson as any);

export default router;
