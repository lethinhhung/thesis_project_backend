import { Request, Response } from 'express';
import { CreateCourse } from '../interfaces/course';
import Course from '../models/course';
import User from '../models/user';
import Lesson from '../models/lesson';
import Tag from '../models/tag';
import mongoose from 'mongoose';
import { deleteImage, uploadImage } from '../utils/upload';
import Test from '../models/test';
import Project from '../models/project';

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
        const { title, description, aiGenerated, emoji, tags }: CreateCourse = req.body;

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
            userId,
            title,
            tags: tags ? tags.map((tag: string) => new mongoose.Types.ObjectId(tag)) : [],
            description,
            aiGenerated: aiGenerated || false,
            customization: {
                emoji: emoji,
            },
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

        const tests = await Test.find({ courseId });
        const testIds = tests.map((test) => test._id);
        await Test.deleteMany({ courseId });

        const projects = await Project.find({ courseId });
        const projectIds = projects.map((project) => project._id);
        await Project.deleteMany({ courseId });

        const lessons = await Lesson.find({ courseId });
        const lessonIds = lessons.map((lesson) => lesson._id);
        await Lesson.deleteMany({ courseId });

        await User.updateMany(
            {},
            {
                $pull: {
                    'progress.courses': courseId,
                    'progress.lessons': { $in: lessonIds },
                    'progress.tests': { $in: testIds },
                    'progress.projects': { $in: projectIds },
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

        if (course.customization?.cover) {
            const deleted = await deleteImage(req.user.id.toString(), course.customization.cover);
            if (!deleted) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete old cover',
                    error: {
                        code: 'DELETE_IMAGE_FAILED',
                        details: 'An error occurred while deleting the old cover image',
                    },
                });
            }
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
                populate: {
                    path: 'tags',
                    select: 'title',
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
                populate: {
                    path: 'tags',
                    select: 'title',
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
        const { query, tags, status, page, limit, sortBy, order } = req.query;

        let sortByField = 'createdAt'; // default sort field
        if (sortBy) {
            switch (sortBy) {
                case 'title':
                    sortByField = 'title';
                    break;
                case 'date':
                    sortByField = 'createdAt';
                    break;
                default:
                    sortByField = 'createdAt';
            }
        }

        // Build search criteria
        const searchCriteria: any = {};

        // Tìm kiếm theo query
        if (query) {
            searchCriteria.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
            ];
        }

        // Tìm kiếm theo tags
        if (typeof tags === 'string') {
            try {
                const tagTitles = tags.split(',');
                const foundTags = await Tag.find({ title: { $in: tagTitles } });
                if (foundTags.length > 0) {
                    const tagIds = foundTags.map((tag) => tag._id);
                    searchCriteria.tags = { $all: tagIds };
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

        // Tìm kiếm theo status
        if (status !== undefined) {
            searchCriteria.status = status === 'true';
        }

        // Tính toán skip cho phân trang
        const skip = (Number(page) - 1) * Number(limit);

        // Get user's courses với phân trang và sorting
        const user = await User.findById(userId)
            .select('progress.courses')
            .populate({
                path: 'progress.courses',
                match: searchCriteria,
                options: {
                    sort: { [sortByField]: order === 'desc' ? -1 : 1 },
                    skip: skip,
                    limit: Number(limit),
                },
                populate: {
                    path: 'tags',
                    select: 'title',
                },
            });

        // Đếm tổng số kết quả để tính total pages
        const total = await Course.countDocuments(searchCriteria);

        if (!user) {
            return res.status(200).json({
                success: false,
                message: 'User not found',
                error: {
                    code: 404,
                    details: 'User not found in database',
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Courses retrieved successfully',
            data: {
                courses: user.progress?.courses,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit)),
                },
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

export const updateCourseDetails = async (req: Request, res: Response) => {
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
        const { title, description, aiGenerated, emoji }: CreateCourse = req.body;
        const courseId = req.params.id;

        if (!courseId || !title || !description) {
            return res.status(200).json({
                success: false,
                message: 'Invalid input',
                error: {
                    code: 400,
                    details: 'Course ID, title and description are required',
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

        const course = await Course.findByIdAndUpdate(
            courseId,
            {
                $set: {
                    title,
                    description,
                    aiGenerated: aiGenerated || false,
                    'customization.emoji': emoji,
                },
            },
            { new: true },
        );

        if (!course) {
            return res.status(200).json({
                success: false,
                message: 'Course update failed',
                error: {
                    code: 500,
                    details: 'Failed to update course',
                },
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Course updated successfully',
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

export const updateCourseCover = async (req: Request, res: Response) => {
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
                    details: 'File upload is required',
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

        if (req.file && course.customization?.cover) {
            const deleted = await deleteImage(req.user.id.toString(), course.customization.cover);
            if (!deleted) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete old cover',
                    error: {
                        code: 'DELETE_IMAGE_FAILED',
                        details: 'An error occurred while deleting the old cover image',
                    },
                });
            }
        }

        if (req.file) {
            const uploaded = await uploadImage(req.user.id.toString(), req.file);
            if (!uploaded) {
                return res.status(500).json({
                    success: false,
                    message: 'Image upload failed',
                    error: {
                        code: 'UPLOAD_FAILED',
                        details: 'An error occurred while uploading the image cover',
                    },
                });
            }
            if (course.customization) {
                course.customization.cover = uploaded.url;
            }

            await course.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Course cover updated successfully',
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

export const getCourseDocuments = async (req: Request, res: Response) => {
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
        const course = await Course.findById(courseId).populate('refDocuments');

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
            message: 'Course retrieved successfully',
            data: course.refDocuments,
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

export const getCourseTestsAndProjects = async (req: Request, res: Response) => {
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
                message: 'Missing required fields',
                error: {
                    code: 400,
                    details: 'Course ID is required',
                },
            });
        }
        const course = await Course.findById(courseId).populate('progress.tests').populate('progress.projects');
        if (!course) {
            return res.status(200).json({
                success: false,
                message: 'Course not found',
                error: {
                    code: 404,
                    details: 'Course not found',
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Tests and projects retrieved successfully',
            data: {
                tests: course.progress?.tests || [],
                projects: course.progress?.projects || [],
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
