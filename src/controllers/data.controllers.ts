import { Request, Response } from 'express';
import { CreateCourse } from '../interfaces/course';
import Course from '../models/course';
import User from '../models/user';
import Lesson from '../models/lesson';
import Document from '../models/document';
import { uploadImage } from '../utils/upload';
import Image from '../models/image';

export const getLimitCoursesAndLessons = async (req: Request, res: Response) => {
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

        const user = await User.findById(userId)
            .select('progress') // Chỉ lấy trường progress
            .lean(); // Tránh thêm overhead của Mongoose Document

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

        if (user.progress?.courses.length === 0 && user.progress?.lessons.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'No courses or lessons found',
                error: {
                    code: 404,
                    details: 'No courses or lessons found for this user',
                },
            });
        }

        // Lấy ID các bài học và khóa học từ progress
        const lessonIds = user.progress?.lessons || [];
        const courseIds = user.progress?.courses || [];

        // Lấy 6 bài học gần nhất
        const recentLessons = await Lesson.find({ _id: { $in: lessonIds } })
            .select('-content')
            .populate('courseId', 'title')
            .sort({ updatedAt: -1 })
            .limit(6)
            .lean();

        // Lấy 6 khóa học status === true gần nhất
        const activeCourses = await Course.find({
            _id: { $in: courseIds },
            status: true,
        })
            .sort({ updatedAt: -1 })
            .limit(6)
            .populate('tags')
            .lean();

        // Lấy 6 khóa học status === false gần nhất
        const inactiveCourses = await Course.find({
            _id: { $in: courseIds },
            status: false,
        })
            .sort({ updatedAt: -1 })
            .limit(6)
            .populate('tags')
            .lean();

        const data = {
            ...user.progress,
            lessons: recentLessons,
            courses: activeCourses.concat(inactiveCourses),
        };
        // const user = await User.findById(userId)
        //     .populate('progress.courses')
        //     .populate({
        //         path: 'progress.lessons',
        //         select: '-content',
        //         populate: {
        //             path: 'courseId',
        //             select: 'title',
        //         },
        //     });

        return res.status(200).json({
            success: true,
            message: 'Courses and lessons retrieved successfully',
            data: data,
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

export const getAllCoursesAndLessons = async (req: Request, res: Response) => {
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

        const user = await User.findById(userId)
            .populate('progress.courses')
            .populate({
                path: 'progress.lessons',
                select: '-content',
                populate: {
                    path: 'courseId',
                    select: 'title',
                },
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

        if (user.progress?.courses.length === 0 && user.progress?.lessons.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'No courses or lessons found',
                error: {
                    code: 404,
                    details: 'No courses or lessons found for this user',
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Courses and lessons retrieved successfully',
            data: user.progress,
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

export const searchAll = async (req: Request, res: Response) => {
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
        const { query } = req.query;

        if (!query) {
            return res.status(200).json({
                success: false,
                message: 'Invalid input',
                error: {
                    code: 400,
                    details: 'Search query is required',
                },
            });
        }

        // Get user's courses and lessons
        const user = await User.findById(userId).select('progress');

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

        // Search courses
        const courses = await Course.find({
            _id: { $in: user.progress?.courses },
            $or: [{ title: { $regex: query, $options: 'i' } }, { description: { $regex: query, $options: 'i' } }],
        }).populate('tags');

        // Search lessons
        const lessons = await Lesson.find({
            _id: { $in: user.progress?.lessons },
            $or: [{ title: { $regex: query, $options: 'i' } }, { description: { $regex: query, $options: 'i' } }],
        })
            .select('-content')
            .populate('courseId', 'title');

        // Search documents
        const documents = await Document.find({
            _id: { $in: user.progress?.documents },
            $or: [{ title: { $regex: query, $options: 'i' } }],
        }).populate('tags');

        return res.status(200).json({
            success: true,
            message: 'Search completed successfully',
            data: {
                courses,
                lessons,
                documents,
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

export const uploadImageController = async (req: Request, res: Response) => {
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

        if (!req.file) {
            return res.status(200).json({
                success: false,
                message: 'No file uploaded',
                error: {
                    code: 400,
                    details: 'File is required',
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

        if (req.file) {
            const uploaded = await uploadImage(user._id.toString(), req.file);
            if (!uploaded) {
                return res.status(500).json({
                    success: false,
                    message: 'Image upload failed',
                    error: {
                        code: 'UPLOAD_FAILED',
                        details: 'An error occurred while uploading the image',
                    },
                });
            }

            const image = await Image.create({
                filename: uploaded.fileName,
                url: uploaded.url,
                userId: user._id,
            });

            if (!image) {
                return res.status(500).json({
                    success: false,
                    message: 'Image creation failed',
                    error: {
                        code: 'IMAGE_CREATION_FAILED',
                        details: 'An error occurred while creating the image record',
                    },
                });
            }

            user.progress?.images.push(image._id);
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Image uploaded successfully',
                data: image,
            });
        }
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
