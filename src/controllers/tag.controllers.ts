import { Request, Response } from 'express';
import Tag from '../models/tag';
import Course from '../models/course';
import User from '../models/user';

export const createTag = async (req: Request, res: Response) => {
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
        const { title } = req.body;

        const user = await User.findById(userId).populate({
            path: 'progress.tags',
            select: 'title',
        });
        if (!user) {
            return res.status(200).json({
                success: false,
                message: 'User not found',
                error: {
                    code: 404,
                    details: 'The user does not exist',
                },
            });
        }

        if (!title) {
            return res.status(200).json({
                success: false,
                message: 'Invalid input',
                error: {
                    code: 400,
                    details: 'Title are required',
                },
            });
        }

        // Kiểm tra tag đã tồn tại cho user này chưa
        const existingTag = await Tag.findOne({ title, userId });
        if (existingTag) {
            return res.status(200).json({
                success: false,
                message: 'Tag already exists',
                error: {
                    code: 409,
                    details: 'You already have a tag with this title',
                },
            });
        }

        // Tạo tag mới với userId
        const tag = await Tag.create({
            title,
            userId,
        });

        user.progress?.tags.push(tag._id);
        await user.save();

        if (!tag) {
            return res.status(200).json({
                success: false,
                message: 'Tag creation failed',
                error: {
                    code: 500,
                    details: 'Failed to create tag',
                },
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Tag created successfully',
            data: tag,
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
// Lấy tất cả tags
export const getAllTags = async (req: Request, res: Response) => {
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
        const user = await User.findById(userId).populate('progress.tags');
        if (!user) {
            return res.status(200).json({
                success: false,
                message: 'User not found',
                error: {
                    code: 404,
                    details: 'The user does not exist',
                },
            });
        }

        const tags = user.progress?.tags;

        if (!tags || tags.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'No tags found',
                error: {
                    code: 404,
                    details: 'No tags found for this user',
                },
            });
        }

        // Đếm số lượng course cho mỗi tag
        const tagsWithCount = await Promise.all(
            tags.map(async (tag: any) => {
                const totalCourses = await Course.countDocuments({ tags: tag._id });
                return {
                    ...tag.toObject(),
                    totalCourses,
                };
            }),
        );

        return res.status(200).json({
            success: true,
            message: 'Get all tags successfully',
            data: tagsWithCount,
        });
    } catch (error) {
        console.error('Error getting tags:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: {
                code: 500,
                details: error instanceof Error ? error.message : 'Unknown error occurred',
            },
        });
    }
};

// Lấy tag theo ID
export const getTagById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const tag = await Tag.findById(id);

        if (!tag) {
            return res.status(404).json({
                success: false,
                message: 'Tag not found',
                error: {
                    code: 404,
                    details: 'The requested tag does not exist',
                },
            });
        }

        // Đếm số lượng course cho tag
        const totalCourses = await Course.countDocuments({ tags: tag._id });

        return res.status(200).json({
            success: true,
            message: 'Get tag successfully',
            data: {
                ...tag.toObject(),
                totalCourses,
            },
        });
    } catch (error) {
        console.error('Error getting tag:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: {
                code: 500,
                details: error instanceof Error ? error.message : 'Unknown error occurred',
            },
        });
    }
};
