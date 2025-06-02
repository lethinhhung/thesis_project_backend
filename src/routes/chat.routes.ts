import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { questionController } from '../controllers/chat.controllers';

const router = Router();

router.post('/question', authenticate as any, questionController as any);

export default router;
