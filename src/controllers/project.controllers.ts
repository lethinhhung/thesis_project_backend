import { Request, Response } from 'express';
import Project from '../models/project';
import Course from '../models/course';
import User from '../models/user';

export const createProject = async (req: Request, res: Response) => {
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

        const { courseId } = req.params;
        const { title, description, status } = req.body;

        if (!title || !description) {
            return res.status(200).json({
                success: false,
                message: 'Missing required fields',
                error: {
                    code: 400,
                    details: 'Title and description are required',
                },
            });
        }

        if (!courseId) {
            return res.status(200).json({
                success: false,
                message: 'Missing required fields',
                error: {
                    code: 400,
                    details: 'Course ID are required',
                },
            });
        }

        const project = await Project.create({
            course: courseId,
            title,
            description,
            status,
            userId,
        });

        if (!project) {
            return res.status(200).json({
                success: false,
                message: 'Project creation failed',
                error: {
                    code: 500,
                    details: 'Failed to create project',
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

        course.progress?.projects.push(project._id);
        course.updatedAt = new Date();
        await course.save();
        // Update the user with the new project ID
        user.progress?.projects.push(project._id);
        await user.save();

        return res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: project,
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

export const updateProject = async (req: Request, res: Response) => {
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

        const { projectId } = req.params;
        const { title, description, status } = req.body;
        if (!projectId || !title || !description) {
            return res.status(200).json({
                success: false,
                message: 'Missing required fields',
                error: {
                    code: 400,
                    details: 'Project ID and title are required',
                },
            });
        }

        const project = await Project.findByIdAndUpdate(
            projectId,
            {
                title,
                description,
                status,
                updatedAt: new Date(),
            },
            { new: true },
        );

        if (!project) {
            return res.status(200).json({
                success: false,
                message: 'Project not found',
                error: {
                    code: 404,
                    details: 'Project not found',
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            data: project,
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

export const getCourseProjects = async (req: Request, res: Response) => {
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
        const course = await Course.findById(courseId).populate('progress.projects');

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
            message: 'Projects retrieved successfully',
            data: course.progress?.projects,
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

export const deleteProject = async (req: Request, res: Response) => {
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
        const { projectId } = req.params;
        if (!projectId) {
            return res.status(200).json({
                success: false,
                message: 'Missing required fields',
                error: {
                    code: 400,
                    details: 'Project ID is required',
                },
            });
        }
        const project = await Project.findByIdAndDelete(projectId);
        if (!project) {
            return res.status(200).json({
                success: false,
                message: 'Project not found',
                error: {
                    code: 404,
                    details: 'Project not found',
                },
            });
        }

        await Course.updateMany(
            {},
            {
                $pull: {
                    'progress.projects': projectId,
                },
            },
        );
        await Course.updateMany({ _id: { $in: project.course } }, { updatedAt: new Date() });

        await User.updateMany(
            {},
            {
                $pull: {
                    'progress.projects': projectId,
                },
            },
        );

        return res.status(200).json({
            success: true,
            message: 'Project deleted successfully',
            data: project,
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

export const updateProjectStatus = async (req: Request, res: Response) => {
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

        const { projectId } = req.params;
        const { status } = req.body;
        if (!projectId || !status) {
            return res.status(200).json({
                success: false,
                message: 'Missing required fields',
                error: {
                    code: 400,
                    details: 'Project ID and status are required',
                },
            });
        }

        const project = await Project.findByIdAndUpdate(
            projectId,
            {
                status,
                updatedAt: new Date(),
            },
            { new: true },
        );

        if (!project) {
            return res.status(200).json({
                success: false,
                message: 'Project not found',
                error: {
                    code: 404,
                    details: 'Project not found',
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Project status updated successfully',
            data: project,
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
