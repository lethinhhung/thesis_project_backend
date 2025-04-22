import { Request, Response } from 'express';
import User from '../models/user';
import { uploadAvatar } from '../utils/upload';

export const getProfile = async (req: Request, res: Response) => {
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
        } else {
            // Fetch user details from the database using the user ID from the request
            const userId = req.user.id; // Assuming req.user contains the authenticated user's ID
            const user = await User.findById(userId).select('-password -__v'); // Exclude password and version field
            return res.status(200).json({
                success: true,
                message: 'User profile retrieved successfully',
                data: user,
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
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

        if (!result) {
            return res.status(500).json({ message: 'Error uploading file' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        } else if (user?.profile) {
            user.profile.avatar = result.url;
            await user.save();
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
