import { Request, Response } from 'express';
import Document from '../models/document';
import User from '../models/user';
import { deleteImage, uploadDocument, uploadImage } from '../utils/upload';
import { downloadDocument as downloadDocumentUtils } from '../utils/download';
import { deleteDocument as deleteDocumentUtils } from '../utils/upload';
import mongoose from 'mongoose';
import Course from '../models/course';

export const createDocument = async (req: Request, res: Response) => {
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

        const userId = req.user.id.toString();

        const user = await User.findById(userId);
        if (!user) {
            return res.status(200).json({
                success: false,
                message: 'User not found',
                error: {
                    code: 404,
                    details: 'User not found',
                },
            });
        }

        // Document type validation
        const allowedTypes = [
            'application/pdf', // .pdf
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.ms-excel', // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-powerpoint', // .ppt
            'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
            'text/plain', // .txt
            'text/markdown', // .md
            'application/rtf', // .rtf
        ];

        if (req.file && !allowedTypes.includes(req.file.mimetype)) {
            return res.status(200).json({
                success: false,
                message: 'Invalid file type',
                error: {
                    code: 400,
                    details: 'Only PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, MD, and RTF files are allowed',
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

        const { title, courseId, lessonId } = req.body;
        if (!title) {
            return res.status(200).json({
                success: false,
                message: 'Title is required',
                error: {
                    code: 400,
                    details: 'Title is required',
                },
            });
        }

        const uploaded = await uploadDocument(req.user.id.toString(), req.file);
        if (!uploaded) {
            return res.status(500).json({
                success: false,
                message: 'Failed to upload document',
                error: {
                    code: 'UPLOAD_FAILED',
                    details: 'An error occurred while uploading the document',
                },
            });
        }

        const document = await Document.create({
            userId,
            title,
            courses: courseId ? [new mongoose.Types.ObjectId(courseId as string)] : [],
            lessons: lessonId ? [new mongoose.Types.ObjectId(lessonId as string)] : [],
            fileUrl: uploaded.url,
            status: 'processing',
            size: req.file.size,
        });

        if (!document) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create document',
                error: {
                    code: 'CREATE_FAILED',
                    details: 'An error occurred while creating the document',
                },
            });
        }

        if (courseId) {
            const course = await Course.findById(courseId);
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

            course.refDocuments.push(document._id);
            await course.save();
        }

        if (lessonId) {
            const lesson = await Course.findById(lessonId);
            if (!lesson) {
                return res.status(200).json({
                    success: false,
                    message: 'Lesson not found',
                    error: {
                        code: 404,
                        details: 'Lesson not found',
                    },
                });
            }
            lesson.refDocuments.push(document._id);
            await lesson.save();
        }

        user.progress?.documents.push(document._id);
        await user.save();

        return res.status(200).json({
            success: true,
            message:
                courseId && lessonId
                    ? 'Document added successfully to lesson and course'
                    : courseId && !lessonId
                    ? 'Document added successfully to course'
                    : 'Document created successfully',
            data: document,
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

export const getAllDocuments = async (req: Request, res: Response) => {
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

        const user = await User.findById(userId).populate({
            path: 'progress.documents',
            populate: {
                path: 'tags',
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

        if (user.progress?.documents.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'No documents found',
                error: {
                    code: 404,
                    details: 'No documents found for this user',
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Documents retrieved successfully',
            data: user.progress?.documents,
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

export const downloadDocument = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
                error: {
                    code: 401,
                    details: 'User not authenticated',
                },
            });
        }

        const documentId = req.params.id;
        if (!documentId) {
            return res.status(400).json({
                success: false,
                message: 'Document ID is required',
                error: {
                    code: 400,
                    details: 'Document ID is required',
                },
            });
        }

        // Tìm document trong database
        const document = await Document.findById(documentId);
        if (!document || !document.fileUrl) {
            return res.status(404).json({
                success: false,
                message: 'Document not found',
                error: {
                    code: 404,
                    details: 'Document not found',
                },
            });
        }

        // Extract filename from URL
        const filePath = document.fileUrl.split('/').pop();
        if (!filePath) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file path',
                error: {
                    code: 400,
                    details: 'Could not extract file path from URL',
                },
            });
        }

        // Tải file từ Supabase
        const { data, error } = await downloadDocumentUtils(req.user.id.toString(), filePath);

        if (error || !data) {
            return res.status(500).json({
                success: false,
                message: 'Download failed',
                error: {
                    code: 500,
                    details: error || 'An error occurred while downloading the document',
                },
            });
        }

        // Get file extension and set correct MIME type
        const fileExt = filePath.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ppt: 'application/vnd.ms-powerpoint',
            pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            txt: 'text/plain',
            md: 'text/markdown',
            rtf: 'application/rtf',
        };

        // Set headers
        const contentType = fileExt ? mimeTypes[fileExt] || 'application/octet-stream' : 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filePath}"`);
        res.setHeader('Content-Length', Buffer.byteLength(data));

        // Send file
        return res.end(Buffer.from(data));
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

export const deleteDocument = async (req: Request, res: Response) => {
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

        const documentId = req.params.id;
        if (!documentId) {
            return res.status(200).json({
                success: false,
                message: 'Document ID is required',
                error: {
                    code: 400,
                    details: 'Document ID is required',
                },
            });
        }

        // Tìm document trong database
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(200).json({
                success: false,
                message: 'Document not found',
                error: {
                    code: 404,
                    details: 'Document not found',
                },
            });
        }

        // Xóa file từ storage
        const filePath = document.fileUrl?.split('/').pop();
        if (filePath) {
            const deleted = await deleteDocumentUtils(req.user.id.toString(), filePath);
            if (!deleted) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete document file',
                    error: {
                        code: 'DELETE_FILE_FAILED',
                        details: 'An error occurred while deleting the document file',
                    },
                });
            }
        }

        // Xóa document từ database
        await Document.findByIdAndDelete(documentId);

        // Xóa document ID từ course
        if (document.courses && document.courses.length > 0) {
            await Course.updateMany({ _id: { $in: document.courses } }, { $pull: { refDocuments: document._id } });
        }

        // Xóa document ID từ lesson

        if (document.lessons && document.lessons.length > 0) {
            await Course.updateMany({ _id: { $in: document.lessons } }, { $pull: { refDocuments: document._id } });
        }

        // Xóa document ID từ user's progress
        await User.updateOne({ _id: req.user.id }, { $pull: { 'progress.documents': documentId } });

        return res.status(200).json({
            success: true,
            message: 'Document deleted successfully',
            data: document,
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
