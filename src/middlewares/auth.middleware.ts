import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import '../interfaces/user';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Lấy token từ header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(200).json({
                success: false,
                message: 'Authentication required',
                error: {
                    code: 401,
                    details: 'No authentication token provided',
                },
            });
        }

        const token = authHeader.split(' ')[1];

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
                id: string;
                username: string;
                email: string;
            };

            // Kiểm tra user có tồn tại không
            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(200).json({
                    success: false,
                    message: 'Authentication failed',
                    error: {
                        code: 401,
                        details: 'User not found',
                    },
                });
            }

            // Thêm thông tin user vào request để các middlewares và controllers tiếp theo có thể sử dụng
            req.user = {
                id: decoded.id,
                username: decoded.username,
                email: decoded.email,
                role: user.role,
            };

            next();
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                return res.status(200).json({
                    success: false,
                    message: 'Authentication failed',
                    error: {
                        code: 401,
                        details: 'Access token has expired',
                    },
                });
            }

            if (error instanceof jwt.JsonWebTokenError) {
                return res.status(200).json({
                    success: false,
                    message: 'Authentication failed',
                    error: {
                        code: 401,
                        details: 'Invalid token',
                    },
                });
            }

            throw error;
        }
    } catch (error) {
        console.error('Authentication middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: {
                code: 'SERVER_ERROR',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
        });
    }
};

// Middleware kiểm tra quyền admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(200).json({
            success: false,
            message: 'Access denied',
            error: {
                code: 403,
                details: 'Admin permission required',
            },
        });
    }
};
