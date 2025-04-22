import { Request, Response } from 'express';
import User from '../models/user';
import { deleteAvatar, uploadAvatar } from '../utils/upload';

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
        }

        const userId = req.user.id;
        const user = await User.findById(userId).select('-password -__v');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                error: {
                    code: 'USER_NOT_FOUND',
                    details: `No user found with ID ${userId}`,
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'User profile retrieved successfully',
            data: user,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: {
                code: 'SERVER_ERROR',
                details: error.message || 'An unexpected error occurred',
            },
        });
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

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (req.file && !allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type',
                error: {
                    code: 'INVALID_FILE_TYPE',
                    details: 'Only JPEG, JPG and PNG formats are supported',
                },
            });
        }

        const { name, bio } = req.body;
        if (!name && !bio && !req.file) {
            return res.status(400).json({
                success: false,
                message: 'No data to update',
                error: {
                    code: 'NO_UPDATE_DATA',
                    details: 'No fields provided for update',
                },
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                error: {
                    code: 'USER_NOT_FOUND',
                    details: `No user found with ID ${req.user.id}`,
                },
            });
        }

        if (user.profile && user.username) {
            if (req.file && user.profile.avatar !== '') {
                const deleted = await deleteAvatar(user.username, user.profile.avatar);
                if (!deleted) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to delete old avatar',
                        error: {
                            code: 'DELETE_AVATAR_FAILED',
                            details: 'An error occurred while deleting the old avatar image',
                        },
                    });
                }
            }

            if (req.file) {
                const uploaded = await uploadAvatar(user.username, req.file);
                if (!uploaded) {
                    return res.status(500).json({
                        success: false,
                        message: 'Avatar upload failed',
                        error: {
                            code: 'UPLOAD_FAILED',
                            details: 'An error occurred while uploading the avatar image',
                        },
                    });
                }
                user.profile.avatar = uploaded.url;
            }

            if (name) user.profile.name = name;
            if (bio) user.profile.bio = bio;

            await user.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user,
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: {
                code: 'SERVER_ERROR',
                details: error.message || 'An unexpected error occurred',
            },
        });
    }
};
