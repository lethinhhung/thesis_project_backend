import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadAvatarController } from '../controllers/upload.controllers';
import { upload } from '../config/multer';

const router = Router();

router.post('/avatar', authenticate as any, upload.single('avatar'), uploadAvatarController as any);

export default router;
