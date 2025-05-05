import { Request, Response } from 'express';
import { CreateCourse } from '../interfaces/course';
import Course from '../models/course';
import User from '../models/user';
import Lesson from '../models/lesson';
import Tag from '../models/tag';
import mongoose from 'mongoose';

export const createCourse = async (req: Request, res: Response) => {
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
        const { title, description, aiGenerated }: CreateCourse = req.body;

        const user = await User.findById(userId);
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

        if (!title || !description) {
            return res.status(200).json({
                success: false,
                message: 'Invalid input',
                error: {
                    code: 400,
                    details: 'Title and description are required',
                },
            });
        }

        const course = await Course.create({
            title,
            description,
            aiGenerated: aiGenerated || false,
        });

        if (!course) {
            return res.status(200).json({
                success: false,
                message: 'Course creation failed',
                error: {
                    code: 500,
                    details: 'Failed to create course',
                },
            });
        }

        user.progress?.courses.push(course._id);
        await user.save();

        return res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: course,
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

export const getCourse = async (req: Request, res: Response) => {
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
        const courseId = req.params.id;
        if (!courseId) {
            return res.status(200).json({
                success: false,
                message: 'Invalid input',
                error: {
                    code: 400,
                    details: 'Course ID is required',
                },
            });
        }
        const course = await Course.findById(courseId).populate('tags').populate('lessons').populate('refDocuments');

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

        // if (!course.creator) {
        //     return res.status(200).json({
        //         success: false,
        //         message: 'Course creator not found',
        //         error: {
        //             code: 404,
        //             details: 'The course creator does not exist',
        //         },
        //     });
        // }

        // if (course.creator.toString() !== userId) {
        //     return res.status(200).json({
        //         success: false,
        //         message: 'Forbidden',
        //         error: {
        //             code: 403,
        //             details: 'You do not have permission to access this course',
        //         },
        //     });
        // }

        return res.status(200).json({
            success: true,
            message: 'Course retrieved successfully',
            data: course,
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

export const getAllCourses = async (req: Request, res: Response) => {
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

        const user = await User.findById(userId).select('progress.courses').populate('progress.courses').lean();
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

        if (user.progress?.courses.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'No courses found',
                error: {
                    code: 404,
                    details: 'No courses found for this user',
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Courses retrieved successfully',
            data: user.progress?.courses,
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

export const deleteCourse = async (req: Request, res: Response) => {
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
        const courseId = req.params.id;
        if (!courseId) {
            return res.status(200).json({
                success: false,
                message: 'Invalid input',
                error: {
                    code: 400,
                    details: 'Course ID is required',
                },
            });
        }
        const course = await Course.findByIdAndDelete(courseId);

        const lessons = await Lesson.find({ courseId });
        const lessonIds = lessons.map((lesson) => lesson._id);
        await Lesson.deleteMany({ courseId });
        await User.updateMany(
            {},
            {
                $pull: {
                    'progress.courses': courseId,
                    'progress.lessons': { $in: lessonIds },
                },
            },
        );

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

        return res.status(200).json({
            success: true,
            message: 'Course deleted successfully',
            data: course,
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

export const getOngoingCourses = async (req: Request, res: Response) => {
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
            .select('progress.courses')
            .populate({
                path: 'progress.courses',
                match: { status: false },
            })
            .lean();
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

        if (user.progress?.courses.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'No ongoing courses found',
                error: {
                    code: 404,
                    details: 'No ongoing courses found for this user',
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Courses retrieved successfully',
            // data: user.progress?.courses,
            data: user.progress?.courses,
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

export const getCompletedCourses = async (req: Request, res: Response) => {
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
            .select('progress.courses')
            .populate({
                path: 'progress.courses',
                match: { status: true },
            })
            .lean();
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

        if (user.progress?.courses.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'No completed courses found',
                error: {
                    code: 404,
                    details: 'No completed courses found for this user',
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Courses retrieved successfully',
            // data: user.progress?.courses,
            data: user.progress?.courses,
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

export const updateCourseStatus = async (req: Request, res: Response) => {
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
        const courseId = req.params.id;
        if (!courseId) {
            return res.status(200).json({
                success: false,
                message: 'Invalid input',
                error: {
                    code: 400,
                    details: 'Course ID is required',
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
        course.status = !course.status;
        course.updatedAt = new Date();
        await course.save();

        return res.status(200).json({
            success: true,
            message: 'Course status updated successfully',
            data: course,
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

export const searchCourses = async (req: Request, res: Response) => {
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
        const { query, tags, status } = req.query;

        // Build search criteria
        const searchCriteria: any = {};

        if (query) {
            searchCriteria.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
            ];
        }

        if (typeof tags === 'string') {
            try {
                const tagTitles = tags.split(',');
                // Tìm các tag dựa trên title
                const foundTags = await Tag.find({ title: { $in: tagTitles } });
                if (foundTags.length > 0) {
                    const tagIds = foundTags.map((tag) => tag._id);
                    searchCriteria.tags = { $in: tagIds };
                }
            } catch (error) {
                return res.status(200).json({
                    success: false,
                    message: 'Invalid tag titles',
                    error: {
                        code: 400,
                        details: 'One or more tag titles are invalid',
                    },
                });
            }
        }

        if (status !== undefined) {
            searchCriteria.status = status === 'true';
        }

        // Get user's courses
        const user = await User.findById(userId)
            .select('progress.courses')
            .populate({
                path: 'progress.courses',
                match: searchCriteria,
                populate: {
                    path: 'tags',
                    select: 'title', // Chỉ lấy trường title của tag
                },
            })
            .lean();

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

        return res.status(200).json({
            success: true,
            message: 'Courses retrieved successfully',
            data: user.progress?.courses || [],
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
