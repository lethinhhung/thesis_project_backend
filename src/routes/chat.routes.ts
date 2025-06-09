import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
    questionController,
    createChatCompletionController,
    getChatCompletionController,
    getAllChatsController,
} from '../controllers/chat.controllers';

const router = Router();

router.post('/question', authenticate as any, questionController as any);
router.post('/completions', authenticate as any, createChatCompletionController as any);
router.get('/get-completions', authenticate as any, getChatCompletionController as any);
router.get('/get-all', authenticate as any, getAllChatsController as any);

export default router;
