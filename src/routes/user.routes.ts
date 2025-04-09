import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import '../interfaces/user';
import { getProfile } from '../controllers/user.controller';

const router = Router();

// Route yêu cầu xác thực người dùng
router.get('/profile', authenticate as any, getProfile as any);

// Route yêu cầu quyền admin
router.get('/all', authenticate as any, requireAdmin as any, (req, res) => {
    // Logic để lấy tất cả người dùng (chỉ admin mới được phép)
});

export default router;
