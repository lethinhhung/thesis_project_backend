import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { upload } from '../config/multer';
import { createDocument } from '../controllers/document.controllers';

const router = Router();

router.post('/create-document', authenticate as any, upload.single('document'), createDocument as any);

export default router;
