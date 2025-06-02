import { Request, Response } from 'express';
import axios from 'axios';

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
