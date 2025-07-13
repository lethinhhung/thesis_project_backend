import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import '../interfaces/user';
import { getProfile, updateProfile, getAllUsers, deleteUser, getSystemStats } from '../controllers/user.controllers';
import { upload } from '../config/multer';

const router = Router();

// Route yêu cầu xác thực người dùng
router.get('/profile', authenticate as any, getProfile as any);
router.put('/update-profile', authenticate as any, upload.single('avatar'), updateProfile as any);

// Route yêu cầu quyền admin
router.get('/all', authenticate as any, requireAdmin as any, getAllUsers as any);
router.delete('/:userId', authenticate as any, requireAdmin as any, deleteUser as any);
router.get('/stats/system', authenticate as any, requireAdmin as any, getSystemStats as any);

export default router;
