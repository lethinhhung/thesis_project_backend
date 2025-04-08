import { Router } from 'express';
import { register } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register as any);

export default router;
