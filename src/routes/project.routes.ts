import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
    createProject,
    updateProject,
    getCourseProjects,
    deleteProject,
    updateProjectStatus,
} from '../controllers/project.controllers';

const router = Router();

router.post('/create-project/:courseId', authenticate as any, createProject as any);
router.patch('/update-project/:projectId', authenticate as any, updateProject as any);
router.get('/get-course-projects/:courseId', authenticate as any, getCourseProjects as any);
router.delete('/delete-project/:projectId', authenticate as any, deleteProject as any);
router.patch('/update-project-status/:projectId', authenticate as any, updateProjectStatus as any);

export default router;
