import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { questionController, createChatCompletionController } from '../controllers/chat.controllers';

const router = Router();

router.post('/question', authenticate as any, questionController as any);
router.post('/completions', authenticate as any, createChatCompletionController as any);

export default router;
