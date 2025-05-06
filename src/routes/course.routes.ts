import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import {
    createCourse,
    deleteCourse,
    getAllCourses,
    getCompletedCourses,
    getCourse,
    getOngoingCourses,
    searchCourses,
    updateCourseCover,
    updateCourseDetails,
    updateCourseStatus,
} from '../controllers/course.controllers';
import { upload } from '../config/multer';

const router = Router();

router.post('/create-course', authenticate as any, createCourse as any);
router.get('/get-course/:id', authenticate as any, getCourse as any);
router.get('/get-all-courses', authenticate as any, getAllCourses as any);
router.delete('/delete-course/:id', authenticate as any, deleteCourse as any);
router.get('/get-ongoing-courses', authenticate as any, getOngoingCourses as any);
router.get('/get-completed-courses', authenticate as any, getCompletedCourses as any);
router.patch('/update-course-status/:id', authenticate as any, updateCourseStatus as any);
router.get('/search-courses', authenticate as any, searchCourses as any);
router.patch('/update-course-details/:id', authenticate as any, updateCourseDetails as any);
router.patch('/update-course-cover/:id', authenticate as any, upload.single('image'), updateCourseCover as any);

export default router;
