import { Request, Response } from 'express';
import Test from '../models/test';
import Course from '../models/course';
import User from '../models/user';

export const createTest = async (req: Request, res: Response) => {
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
        const { courseId } = req.params;
        const { title, description, date, score } = req.body;

        if (!title || !description || !date || !score) {
            return res.status(200).json({
                success: false,
                message: 'Missing required fields',
                error: {
                    code: 400,
                    details: 'Title, description, date, and score are required',
                },
            });
        }

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

        if (!courseId || !title) {
            return res.status(200).json({
                success: false,
                message: 'Missing required fields',
                error: {
                    code: 400,
                    details: 'Course ID and title are required',
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
                    details: 'The course does not exist',
                },
            });
        }

        const test = await Test.create({
            course: courseId,
            title,
            description,
            date: new Date(date),
            score,
            userId,
        });

        if (!test) {
            return res.status(200).json({
                success: false,
                message: 'Failed to create test',
                error: {
                    code: 500,
                    details: 'An error occurred while creating the test',
                },
            });
        }

        // Update the course with the new test ID
        course.progress?.tests.push(test._id);
        course.updatedAt = new Date();
        await course.save();
        // Update the user with the new test ID
        user.progress?.tests.push(test._id);
        await user.save();

        return res.status(201).json({
            success: true,
            message: 'Test created successfully',
            data: test,
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

export const updateTest = async (req: Request, res: Response) => {
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

        const { testId } = req.params;
        const { title, description, date, score } = req.body;

        if (!testId || !title || !description || !date || !score) {
            return res.status(200).json({
                success: false,
                message: 'Missing required fields',
                error: {
                    code: 400,
                    details: 'Test ID, title, description, date, and score are required',
                },
            });
        }

        const test = await Test.findByIdAndUpdate(
            testId,
            {
                title,
                description,
                date,
                score,
                updatedAt: new Date(),
            },
            { new: true },
        );

        if (!test) {
            return res.status(200).json({
                success: false,
                message: 'Test not found',
                error: {
                    code: 404,
                    details: 'Test not found',
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Test updated successfully',
            data: test,
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

export const deleteTest = async (req: Request, res: Response) => {
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

        const { testId } = req.params;

        const test = await Test.findByIdAndDelete(testId);

        if (!test) {
            return res.status(200).json({
                success: false,
                message: 'Test not found',
                error: {
                    code: 404,
                    details: 'Test not found',
                },
            });
        }

        await Course.updateMany(
            {},
            {
                $pull: {
                    'progress.tests': testId,
                },
            },
        );
        await Course.updateMany({ _id: { $in: test.course } }, { updatedAt: new Date() });

        await User.updateMany(
            {},
            {
                $pull: {
                    'progress.tests': testId,
                },
            },
        );

        return res.status(200).json({
            success: true,
            message: 'Test deleted successfully',
            data: test,
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

export const getCourseTests = async (req: Request, res: Response) => {
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
        const { courseId } = req.params;

        const tests = await Test.find({ courseId }).sort({ date: -1 });

        return res.status(200).json({
            success: true,
            message: 'Tests retrieved successfully',
            data: tests,
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

export const updateTestScore = async (req: Request, res: Response) => {
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

        const { testId } = req.params;
        const { score } = req.body;
        if (!testId || !score) {
            return res.status(200).json({
                success: false,
                message: 'Missing required fields',
                error: {
                    code: 400,
                    details: 'Project ID and status are required',
                },
            });
        }

        const test = await Test.findByIdAndUpdate(
            testId,
            {
                score,
                updatedAt: new Date(),
            },
            { new: true },
        );

        if (!test) {
            return res.status(200).json({
                success: false,
                message: 'Test not found',
                error: {
                    code: 404,
                    details: 'Test not found',
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Test score updated successfully',
            data: test,
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
