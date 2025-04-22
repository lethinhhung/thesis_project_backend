import { Router } from 'express';
import { register, login, refreshAccessToken, logout } from '../controllers/auth.controllers';

const router = Router();

router.post('/register', register as any);
router.post('/login', login as any);
router.post('/refresh-token', refreshAccessToken as any);
router.post('/logout', logout as any);

export default router;
