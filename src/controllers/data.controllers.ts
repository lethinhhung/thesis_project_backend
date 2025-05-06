import { Request, Response } from 'express';
import { CreateCourse } from '../interfaces/course';
import Course from '../models/course';
import User from '../models/user';
import Lesson from '../models/lesson';

// export const createCourse = async (req: Request, res: Response) => {
//     try {
//         if (!req.user) {
//             return res.status(200).json({
//                 success: false,
//                 message: 'Unauthorized',
//                 error: {
//                     code: 401,
//                     details: 'User not authenticated',
//                 },
//             });
//         }

//         const userId = req.user.id;
//         const { title, description, aiGenerated }: CreateCourse = req.body;

//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(200).json({
//                 success: false,
//                 message: 'User not found',
//                 error: {
//                     code: 404,
//                     details: 'The user does not exist',
//                 },
//             });
//         }

//         if (!title || !description) {
//             return res.status(200).json({
//                 success: false,
//                 message: 'Invalid input',
//                 error: {
//                     code: 400,
//                     details: 'Title and description are required',
//                 },
//             });
//         }

//         const course = await Course.create({
//             title,
//             description,
//             aiGenerated: aiGenerated || false,
//         });

//         if (!course) {
//             return res.status(200).json({
//                 success: false,
//                 message: 'Course creation failed',
//                 error: {
//                     code: 500,
//                     details: 'Failed to create course',
//                 },
//             });
//         }

//         user.progress?.courses.push(course._id);
//         await user.save();

//         return res.status(201).json({
//             success: true,
//             message: 'Course created successfully',
//             data: course,
//         });
//     } catch (error: any) {
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: {
//                 code: 'SERVER_ERROR',
//                 details: error.message || 'An unexpected error occurred',
//             },
//         });
//     }
// };

// export const getCourse = async (req: Request, res: Response) => {
//     try {
//         if (!req.user) {
//             return res.status(200).json({
//                 success: false,
//                 message: 'Unauthorized',
//                 error: {
//                     code: 401,
//                     details: 'User not authenticated',
//                 },
//             });
//         }
//         const userId = req.user.id;
//         const courseId = req.params.id;
//         if (!courseId) {
//             return res.status(200).json({
//                 success: false,
//                 message: 'Invalid input',
//                 error: {
//                     code: 400,
//                     details: 'Course ID is required',
//                 },
//             });
//         }
//         const course = await Course.findById(courseId).populate('tags').populate('lessons').populate('refDocuments');

//         if (!course) {
//             return res.status(200).json({
//                 success: false,
//                 message: 'Course not found',
//                 error: {
//                     code: 404,
//                     details: 'The requested course does not exist',
//                 },
//             });
//         }

//         // if (!course.creator) {
//         //     return res.status(200).json({
//         //         success: false,
//         //         message: 'Course creator not found',
//         //         error: {
//         //             code: 404,
//         //             details: 'The course creator does not exist',
//         //         },
//         //     });
//         // }

//         // if (course.creator.toString() !== userId) {
//         //     return res.status(200).json({
//         //         success: false,
//         //         message: 'Forbidden',
//         //         error: {
//         //             code: 403,
//         //             details: 'You do not have permission to access this course',
//         //         },
//         //     });
//         // }

//         return res.status(200).json({
//             success: true,
//             message: 'Course retrieved successfully',
//             data: course,
//         });
//     } catch (error: any) {
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: {
//                 code: 'SERVER_ERROR',
//                 details: error.message || 'An unexpected error occurred',
//             },
//         });
//     }
// };

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

// export const deleteCourse = async (req: Request, res: Response) => {
//     try {
//         if (!req.user) {
//             return res.status(200).json({
//                 success: false,
//                 message: 'Unauthorized',
//                 error: {
//                     code: 401,
//                     details: 'User not authenticated',
//                 },
//             });
//         }
//         const courseId = req.params.id;
//         if (!courseId) {
//             return res.status(200).json({
//                 success: false,
//                 message: 'Invalid input',
//                 error: {
//                     code: 400,
//                     details: 'Course ID is required',
//                 },
//             });
//         }
//         const course = await Course.findByIdAndDelete(courseId);

//         const lessons = await Lesson.find({ courseId });
//         const lessonIds = lessons.map((lesson) => lesson._id);
//         await Lesson.deleteMany({ courseId });
//         await User.updateMany(
//             {},
//             {
//                 $pull: {
//                     'progress.courses': courseId,
//                     'progress.lessons': { $in: lessonIds },
//                 },
//             },
//         );

//         if (!course) {
//             return res.status(200).json({
//                 success: false,
//                 message: 'Course not found',
//                 error: {
//                     code: 404,
//                     details: 'The requested course does not exist',
//                 },
//             });
//         }

//         return res.status(200).json({
//             success: true,
//             message: 'Course deleted successfully',
//             data: course,
//         });
//     } catch (error: any) {
//         return res.status(500).json({
//             success: false,
//             message: 'Internal server error',
//             error: {
//                 code: 'SERVER_ERROR',
//                 details: error.message || 'An unexpected error occurred',
//             },
//         });
//     }
// };
