import { Request, Response } from 'express';
import { CreateLesson } from '../interfaces/lessons';
import Lesson from '../models/lesson';
import Course from '../models/course';
import User from '../models/user';

export const createLesson = async (req: Request, res: Response) => {
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
        const courseId = req.params.courseId;
        const { title, aiGenerated }: CreateLesson = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(200).json({
                success: false,
                message: 'User not found',
                error: {
                    code: 404,
                    details: 'The requested user does not exist',
                },
            });
        }

        if (!title || !courseId) {
            return res.status(200).json({
                success: false,
                message: 'Invalid input',
                error: {
                    code: 400,
                    details: 'Title and courseId are required',
                },
            });
        }

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(200).json({
                success: false,
                message: 'Course not found',
                error: {
                    code: 404,
                    details: 'The requested course does not exist',
                },
            });
        }

        const lesson = await Lesson.create({
            courseId,
            title,
            aiGenerated: aiGenerated || false,
        });

        if (!lesson) {
            return res.status(200).json({
                success: false,
                message: 'Lesson creation failed',
                error: {
                    code: 500,
                    details: 'Failed to create lesson',
                },
            });
        }

        user?.progress?.lessons.push(lesson._id);
        await user?.save();
        course.lessons.push(lesson._id);
        await course.save();

        return res.status(201).json({
            success: true,
            message: 'Lesson created successfully',
            data: lesson,
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

export const getLesson = async (req: Request, res: Response) => {
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
        const lessonId = req.params.id;
        if (!lessonId) {
            return res.status(200).json({
                success: false,
                message: 'Invalid input',
                error: {
                    code: 400,
                    details: 'Lesson ID is required',
                },
            });
        }

        const lesson = await Lesson.findById(lessonId);

        if (!lesson) {
            return res.status(200).json({
                success: false,
                message: 'Lesson not found',
                error: {
                    code: 404,
                    details: 'The requested lesson does not exist',
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Lesson retrieved successfully',
            data: lesson,
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

export const getAllLesson = async (req: Request, res: Response) => {
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

        const courseId = req.params.courseId;
        const course = await Course.findById(courseId).populate({
            path: 'lessons',
            select: '-content',
            populate: {
                path: 'courseId',
                select: 'title',
            },
        });

        if (course?.lessons.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'No lesson found',
                error: {
                    code: 404,
                    details: 'No lessons found for this course',
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Lessons retrieved successfully',
            data: course?.lessons,
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

export const updateLessonContent = async (req: Request, res: Response) => {
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
        const lessonId = req.params.id;
        const lesson = await Lesson.findById(lessonId);

        if (!lesson) {
            return res.status(200).json({
                success: false,
                message: 'Lesson not found',
                error: {
                    code: 404,
                    details: 'The requested lesson does not exist',
                },
            });
        }

        const { content } = req.body;
        lesson.content = content || lesson.content;
        lesson.updatedAt = new Date();
        await lesson.save();

        return res.status(200).json({
            success: true,
            message: 'Lesson content updated successfully',
            data: lesson,
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

export const deleteLesson = async (req: Request, res: Response) => {
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
        const lessonId = req.params.id;
        if (!lessonId) {
            return res.status(200).json({
                success: false,
                message: 'Invalid input',
                error: {
                    code: 400,
                    details: 'Lesson ID is required',
                },
            });
        }
        const lesson = await Lesson.findByIdAndDelete(lessonId);
        await Course.updateMany({ lessons: lessonId }, { $pull: { lessons: lessonId } });
        await User.updateMany({ 'progress.lessons': lessonId }, { $pull: { 'progress.lessons': lessonId } });

        if (!lesson) {
            return res.status(200).json({
                success: false,
                message: 'Lesson not found',
                error: {
                    code: 404,
                    details: 'The requested lesson does not exist',
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Lesson deleted successfully',
            data: lesson,
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
