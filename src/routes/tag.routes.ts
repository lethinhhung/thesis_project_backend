import express from 'express';
import { createTag, getAllTags, getTagById } from '../controllers/tag.controllers';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

router.post('/create-tag', authenticate as any, createTag as any);
router.get('/get-all-tags', authenticate as any, getAllTags as any);
router.get('/get-tag/:id', authenticate as any, getTagById as any);

export default router;
