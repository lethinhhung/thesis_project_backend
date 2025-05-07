import { Router } from 'express';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { upload } from '../config/multer';
import { createDocument, getAllDocuments } from '../controllers/document.controllers';

const router = Router();

router.post('/create-document', authenticate as any, upload.single('document'), createDocument as any);
router.get('/get-all-documents', authenticate as any, getAllDocuments as any);

export default router;
