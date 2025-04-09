import { Request, Response } from 'express';

export const getProfile = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
                error: {
                    code: 'UNAUTHORIZED',
                    details: 'User not authenticated',
                },
            });
        } else {
            return res.status(200).json({
                success: true,
                message: 'User profile retrieved successfully',
                data: req.user,
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
