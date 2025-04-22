import { Request, Response } from 'express';
import { uploadAvatar } from '../utils/upload';

export const uploadAvatarController = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
                error: {
                    code: 'UNAUTHORIZED',
                    details: 'User not authenticated',
                },
            });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ message: 'Invalid file type. Only JPEG, JPG and PNG are allowed' });
        }

        const result = await uploadAvatar(req.user.username, req.file);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
