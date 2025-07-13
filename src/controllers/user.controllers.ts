import { Request, Response } from 'express';
import User from '../models/user';
import Course from '../models/course';
import Lesson from '../models/lesson';
import Document from '../models/document';
import Test from '../models/test';
import Project from '../models/project';
import Chat from '../models/chat';
import { deleteAvatar, uploadAvatar } from '../utils/upload';

export const getProfile = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(200).json({
                success: false,
                message: 'Unauthorized',
                error: {
                    code: 401,
                    details: 'User not authenticated',
                },
            });
        }

        const userId = req.user.id;
        const user = await User.findById(userId).select('-password -__v');

        if (!user) {
            return res.status(200).json({
                success: false,
                message: 'User not found',
                error: {
                    code: 404,
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
            return res.status(200).json({
                success: false,
                message: 'Unauthorized',
                error: {
                    code: 401,
                    details: 'User not authenticated',
                },
            });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (req.file && !allowedTypes.includes(req.file.mimetype)) {
            return res.status(200).json({
                success: false,
                message: 'Invalid file type',
                error: {
                    code: 400,
                    details: 'Only JPEG, JPG and PNG formats are supported',
                },
            });
        }

        const { name, bio } = req.body;
        if (!name && !bio && !req.file) {
            return res.status(200).json({
                success: false,
                message: 'No data to update',
                error: {
                    code: 400,
                    details: 'No fields provided for update',
                },
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: 'User not found',
                error: {
                    code: 404,
                    details: `No user found with ID ${req.user.id}`,
                },
            });
        }

        if (user.profile && user._id.toString()) {
            if (req.file && user.profile.avatar !== '') {
                const deleted = await deleteAvatar(user._id.toString(), user.profile.avatar);
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
                const uploaded = await uploadAvatar(user._id.toString(), req.file);
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
            user.updatedAt = new Date();

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

// Admin: Lấy tất cả users
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password -__v');

        return res.status(200).json({
            success: true,
            message: 'Users retrieved successfully',
            data: {
                users: users,
            },
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

// Admin: Xóa user
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: 'User not found',
                error: {
                    code: 404,
                    details: `No user found with ID ${userId}`,
                },
            });
        }

        // Không cho phép xóa admin khác
        if (user.role === 'admin' && req.user?.id !== userId) {
            return res.status(200).json({
                success: false,
                message: 'Cannot delete another admin',
                error: {
                    code: 403,
                    details: 'You cannot delete another admin account',
                },
            });
        }

        //Xóa hết mọi dữ liệu liên quan đến user
        await Course.deleteMany({ userId });
        await Lesson.deleteMany({ userId });
        await Document.deleteMany({ userId });
        await Test.deleteMany({ userId });
        await Project.deleteMany({ userId });
        await Chat.deleteMany({ userId });

        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: 'User deleted successfully',
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

// Admin: Thống kê hệ thống
export const getSystemStats = async (req: Request, res: Response) => {
    try {
        const [totalUsers, totalCourses, totalLessons, totalDocuments, totalTests, totalProjects, totalChats] =
            await Promise.all([
                User.countDocuments(),
                Course.countDocuments(),
                Lesson.countDocuments(),
                Document.countDocuments(),
                Test.countDocuments(),
                Project.countDocuments(),
                Chat.countDocuments(),
            ]);

        return res.status(200).json({
            success: true,
            message: 'System statistics retrieved successfully',
            data: {
                totalUsers,
                totalCourses,
                totalLessons,
                totalDocuments,
                totalTests,
                totalProjects,
                totalChats,
            },
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
