import { Request, Response } from 'express';
import User from '../models/user';

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
            // Fetch user details from the database using the user ID from the request
            const userId = req.user.id; // Assuming req.user contains the authenticated user's ID
            const user = await User.findById(userId).select('-password -__v'); // Exclude password and version field
            return res.status(200).json({
                success: true,
                message: 'User profile retrieved successfully',
                data: user,
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
