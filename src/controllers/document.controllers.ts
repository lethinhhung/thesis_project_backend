import { Request, Response } from 'express';
import Document from '../models/document';
import User from '../models/user';
import { deleteImage, uploadDocument, uploadImage } from '../utils/upload';

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

        const { title } = req.body;
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
            fileUrl: uploaded.url,
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

        user.progress?.documents.push(document._id);
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Document created successfully',
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
