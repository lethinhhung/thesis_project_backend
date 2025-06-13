import { Request, Response } from 'express';
import axios from 'axios';
import Document from '../models/document';
import Chat from '../models/chat';
import User from '../models/user';

export const questionController = async (req: Request, res: Response) => {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'Invalid question format' });
    }

    try {
        const response = await axios.post(
            `${process.env.RAG_SERVER_URL}/v1/question` || 'http://localhost:8000/v1/question',
            {
                userId: req.user?.id,
                query: question,
            },
        );

        if (response.status === 200) {
            // If the reponse contains a 'documents' field, you can handle it accordingly.
            if (response.data.choices[0].message.documents.length > 0) {
                const documents = await Document.find({
                    _id: { $in: response.data.choices[0].message.documents.map((doc: any) => doc.documentId) },
                });

                return res.status(200).json({
                    success: true,
                    message: 'Response fetched successfully',
                    data: {
                        ...response.data,
                        choices: [
                            {
                                ...response.data.choices[0],
                                message: {
                                    ...response.data.choices[0].message,
                                    documents,
                                },
                            },
                        ],
                    },
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Response fetched successfully',
                data: response.data,
            });
        } else {
            return res.status(response.status).json({
                success: false,
                message: 'Failed to fetch response',
                error: response.data,
            });
        }
    } catch (error) {
        console.error('Error fetching chat response:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching the response',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export const createChatCompletionController = async (req: Request, res: Response) => {
    const { messages, isUseKnowledge, model, courseId, _id } = req.body;
    const userId = req.user?.id;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            error: {
                code: 400,
                details: 'Messages array is required and cannot be empty.',
            },
        });
    }
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: {
                code: 401,
                details: 'User ID is required.',
            },
        });
    }

    try {
        const ragApiUrl = `${process.env.RAG_SERVER_URL || 'http://localhost:8000'}/v1/chat/completions`;
        const response = await axios.post(ragApiUrl, {
            userId: userId,
            messages: messages,
            isUseKnowledge: isUseKnowledge || false,
            model: model,
            courseId: courseId || null,
        });

        if (response.status === 200) {
            if (!_id) {
                const chat = await Chat.create({
                    userId: userId,
                    messages: [
                        ...messages,
                        {
                            role: response.data.choices[0].message.role,
                            content: response.data.choices[0].message.content,
                        },
                    ],
                    title: messages[0]?.content || 'Chat with RAG',
                });

                if (!chat) {
                    return res.status(404).json({
                        success: false,
                        message: 'Chat not found or could not be created',
                        error: {
                            code: 404,
                            details: 'Chat not found or could not be created.',
                        },
                    });
                }

                // Find the oldest chat and total chat count for this user
                const userChats = await User.findById(userId).select('progress.chats');
                const chatCount = userChats?.progress?.chats?.length || 0;

                // If user has 10 or more chats, remove the oldest one
                if (chatCount >= 10) {
                    const oldestChat = await Chat.findOne({
                        userId,
                        _id: { $in: userChats?.progress?.chats || [] },
                    }).sort({ updatedAt: 1 });

                    if (oldestChat) {
                        await Chat.findByIdAndDelete(oldestChat._id);
                        await User.findByIdAndUpdate(userId, { $pull: { 'progress.chats': oldestChat._id } });
                    }
                }

                // Add the new chat
                const userProgress = await User.findByIdAndUpdate(
                    userId,
                    { $addToSet: { 'progress.chats': chat._id } },
                    { new: true },
                );

                if (!userProgress || !userProgress.progress) {
                    return res.status(404).json({
                        success: false,
                        message: 'User not found or could not be updated',
                        error: {
                            code: 404,
                            details: 'User not found or could not be updated.',
                        },
                    });
                }

                if (!chat) {
                    return res.status(404).json({
                        success: false,
                        message: 'Chat not found or could not be created',
                        error: {
                            code: 404,
                            details: 'Chat not found or could not be created.',
                        },
                    });
                }

                if (
                    response.data.choices[response.data.choices.length - 1].message?.documents?.length &&
                    response.data.choices[response.data.choices.length - 1].message.documents.length > 0
                ) {
                    const documents = await Document.find({
                        _id: {
                            $in: response.data.choices[response.data.choices.length - 1].message.documents.map(
                                (doc: any) => doc.documentId,
                            ),
                        },
                    });

                    if (documents && documents.length > 0) {
                        chat.messages[chat.messages.length - 1].documents = documents.map((doc) => doc._id);
                        await chat.save();
                    }

                    return res.status(200).json({
                        success: true,
                        message: 'Response fetched successfully',
                        data: {
                            _id: chat._id,
                            ...response.data,
                            choices: [
                                {
                                    ...response.data.choices[0],
                                    message: {
                                        ...response.data.choices[0].message,
                                        documents,
                                    },
                                },
                            ],
                        },
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Chat completion successful',
                    data: {
                        _id: chat._id,
                        ...response.data,
                    },
                });
            } else {
                const chat = await Chat.findByIdAndUpdate(
                    _id,
                    {
                        $set: {
                            messages: [
                                ...messages,
                                {
                                    role: response.data.choices[0].message.role,
                                    content: response.data.choices[0].message.content,
                                },
                            ],
                            updatedAt: new Date(),
                        },
                    },
                    { new: true },
                );

                if (!chat) {
                    return res.status(404).json({
                        success: false,
                        message: 'Chat not found or could not be created',
                        error: {
                            code: 404,
                            details: 'Chat not found or could not be created.',
                        },
                    });
                }

                if (
                    response.data.choices[response.data.choices.length - 1].message?.documents?.length &&
                    response.data.choices[response.data.choices.length - 1].message.documents.length > 0
                ) {
                    const documents = await Document.find({
                        _id: {
                            $in: response.data.choices[response.data.choices.length - 1].message.documents.map(
                                (doc: any) => doc.documentId,
                            ),
                        },
                    });

                    if (documents && documents.length > 0) {
                        chat.messages[chat.messages.length - 1].documents = documents.map((doc) => doc._id);
                        await chat.save();
                    }

                    return res.status(200).json({
                        success: true,
                        message: 'Response fetched successfully',
                        data: {
                            _id: chat._id,
                            ...response.data,
                            choices: [
                                {
                                    ...response.data.choices[0],
                                    message: {
                                        ...response.data.choices[0].message,
                                        documents,
                                    },
                                },
                            ],
                        },
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: 'Chat completion successful',
                    data: {
                        _id: chat._id,
                        ...response.data,
                    },
                });
            }
        } else {
            return res.status(response.status).json({
                success: false,
                message: 'Error from RAG service',
                error: {
                    code: response.status,
                    details: response.data,
                },
            });
        }
    } catch (error: any) {
        console.error('Error creating chat completion:', error);
        const statusCode = error.response?.status || 500;
        const errorDetails = error.response?.data || (error instanceof Error ? error.message : 'Unknown error');
        return res.status(statusCode).json({
            success: false,
            message: 'Internal server error during chat completion',
            error: {
                code: statusCode,
                details: errorDetails,
            },
        });
    }
};

export const getChatCompletionController = async (req: Request, res: Response) => {
    const { _id } = req.query;

    if (!_id || typeof _id !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            error: {
                code: 400,
                details: 'Chat ID is required.',
            },
        });
    }

    try {
        //Populate the chat with messages and documents
        const chat = await Chat.findById(_id).populate({
            path: 'messages',
            populate: {
                path: 'documents',
                model: 'document',
            },
        });

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found',
                error: {
                    code: 404,
                    details: 'Chat not found.',
                },
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Chat fetched successfully',
            data: chat,
        });
    } catch (error) {
        console.error('Error fetching chat:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: {
                code: 500,
                details: error instanceof Error ? error.message : 'Unknown error',
            },
        });
    }
};

export const getAllChatsController = async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized',
            error: {
                code: 401,
                details: 'User ID is required.',
            },
        });
    }

    try {
        const chats = await Chat.find({ userId }).select('_id title').sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Chats fetched successfully',
            data: chats,
        });
    } catch (error) {
        console.error('Error fetching chats:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: {
                code: 500,
                details: error instanceof Error ? error.message : 'Unknown error',
            },
        });
    }
};
