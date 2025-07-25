import { Request, Response } from 'express';
import Document from '../models/document';
import User from '../models/user';
import { deleteImage, uploadDocument, uploadImage } from '../utils/upload';
import { downloadDocument as downloadDocumentUtils } from '../utils/download';
import { deleteDocument as deleteDocumentUtils } from '../utils/upload';
import mongoose from 'mongoose';
import Course from '../models/course';
import Lesson from '../models/lesson';
import axios from 'axios';
import PdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import os from 'os';
import mammoth from 'mammoth';
import xlsx from 'xlsx';
import { extname } from 'path';
import PptxParser from 'node-pptx-parser';
import Chat from '../models/chat';

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

        if (req.file && !allowedTypes.includes(req.file.mimetype) && !req.file.originalname.endsWith('.md')) {
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
            course.updatedAt = new Date();
            await course.save();
        }

        if (lessonId) {
            const lesson = await Lesson.findById(lessonId);
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

        // Embedding file content

        const file = req.file;
        const ext = extname(file.originalname).toLowerCase();
        console.log('File extension:', ext);
        const tempPath = path.join(os.tmpdir(), `${Date.now()}-${file.originalname}`);
        let textContent = '';

        fs.writeFileSync(tempPath, file.buffer);

        switch (ext) {
            case '.pdf': {
                const data = await PdfParse(file.buffer);
                textContent = data.text;
                break;
            }
            case '.docx': {
                const result = await mammoth.extractRawText({ path: tempPath });
                textContent = result.value;
                break;
            }
            case '.xlsx': {
                const workbook = xlsx.readFile(tempPath);
                textContent = workbook.SheetNames.map((name) => xlsx.utils.sheet_to_csv(workbook.Sheets[name])).join(
                    '\n',
                );
                break;
            }
            case '.pptx': {
                const parser = new PptxParser(tempPath);
                const xmlArray = await parser.extractText();
                textContent = xmlArray.map((slide) => slide.text).join('\n');
                break;
            }
            case '.md': {
                textContent = fs.readFileSync(tempPath, 'utf-8');
                break;
            }
            default:
                return res.status(400).json({ error: 'Unsupported file type' });
        }

        await axios
            .post(`${process.env.RAG_SERVER_URL}/v1/ingest` || 'http://localhost:8080', {
                userId: user._id.toString(),
                documentId: document._id.toString(),
                document: textContent,
                title: document.title,
                courseId: courseId ? courseId.toString() : null,
                courseTitle: await Course.findById(courseId).then((course) => course?.title || null),
            })
            .then(() => {
                document.status = 'completed';
                document.save();
            })
            .catch((error) => {
                console.error('Error embedding PDF content:', error);
                document.status = 'failed';
                document.save();
            });

        // if (req.file.buffer) {
        //     const data = await PdfParse(req.file.buffer);
        //     await axios
        //         .post(`${process.env.RAG_SERVER_URL}/v1/ingest` || 'http://localhost:8080', {
        //             userId: user._id.toString(),
        //             documentId: document._id.toString(),
        //             document: data.text,
        //             title: document.title,
        //         })
        //         .then(() => {
        //             document.status = 'completed';
        //             document.save();
        //         })
        //         .catch((error) => {
        //             console.error('Error embedding PDF content:', error);
        //             document.status = 'failed';
        //             document.save();
        //         });
        // }

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
        console.error('Error creating document:', error);
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
            await Course.updateMany({ _id: { $in: document.courses } }, { updatedAt: new Date() });
        }

        // Xóa document ID từ lesson
        if (document.lessons && document.lessons.length > 0) {
            await Lesson.updateMany({ _id: { $in: document.lessons } }, { $pull: { refDocuments: document._id } });
            await Lesson.updateMany({ _id: { $in: document.lessons } }, { updatedAt: new Date() });
        }

        // Xóa document ID từ user's progress
        await User.updateOne({ _id: req.user.id }, { $pull: { 'progress.documents': documentId } });

        // Remove document from chat messages
        await Chat.updateMany(
            { userId: req.user.id },
            {
                $pull: {
                    'messages.$[].documents': documentId,
                },
            },
        );

        // Remove document from RAG server
        const response = await axios.post(
            `${process.env.RAG_SERVER_URL}/v1/delete-document` || 'http://localhost:8000/v1/delete-document',
            {
                userId: req.user?.id,
                documentId: documentId,
            },
        );

        if (response.status !== 200) {
            console.error('Error removing document from RAG server:', response.data);
            return res.status(500).json({
                success: false,
                message: 'Failed to remove document from RAG server',
                error: {
                    code: 'RAG_SERVER_ERROR',
                    details: 'An error occurred while removing the document from the RAG server',
                },
            });
        }

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
