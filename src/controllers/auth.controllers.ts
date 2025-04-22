import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user';

const SALTROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '1d';
const REFRESH_TOKEN_EXPIRY = '7d';
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only use secure in production
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
};

export const register = async (req: Request, res: Response) => {
    try {
        const { username, password, email } = req.body;
        if (!username || !password || !email) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: {
                    code: 'VALIDATION_ERROR',
                    details: 'All fields are required',
                },
            });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists',
                error: {
                    code: 'USER_EXISTS',
                    details: 'User already exists. Please choose a different username.',
                },
            });
        }

        const hashPassword = await bcrypt.hash(password, SALTROUNDS);

        const newUser = await User.create({
            username: username,
            password: hashPassword,
            email: email,
        });

        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
            },
        });
    } catch (error) {
        console.error('Failed', error);

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

export const login = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                error: {
                    code: 'VALIDATION_ERROR',
                    details: 'All fields are required',
                },
            });
        }

        const user = await User.findOne({ username });

        if (user) {
            const isPasswordValid = await bcrypt.compare(password, user.password as string);
            if (isPasswordValid) {
                const payload = {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    avatar: user.profile?.avatar || null,
                };

                const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, {
                    expiresIn: ACCESS_TOKEN_EXPIRY,
                });

                const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, {
                    expiresIn: REFRESH_TOKEN_EXPIRY,
                });

                res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

                return res.status(200).json({
                    success: true,
                    message: 'Login successful',
                    data: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        avatar: user.profile?.avatar || null,
                        accessToken,
                    },
                });
            } else {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                    error: {
                        code: 'INVALID_CREDENTIALS',
                        details: 'Invalid username or password',
                    },
                });
            }
        }

        return res.status(404).json({
            success: false,
            message: 'User not found',
            error: {
                code: 'USER_NOT_FOUND',
                details: 'User not found. Please check your username.',
            },
        });
    } catch (error) {
        console.error('Failed', error);

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

export const refreshAccessToken = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required',
                error: {
                    code: 'TOKEN_REQUIRED',
                    details: 'Refresh token is required',
                },
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as { id: string };
        const user = await User.findById(decoded.id);

        if (!user) {
            res.clearCookie('refreshToken', { path: '/' });
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token',
                error: {
                    code: 'INVALID_REFRESH_TOKEN',
                    details: 'User not found for the provided refresh token',
                },
            });
        }

        const payload = {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.profile?.avatar || null,
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: ACCESS_TOKEN_EXPIRY });

        const newRefreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, {
            expiresIn: REFRESH_TOKEN_EXPIRY,
        });

        res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

        return res.status(200).json({
            success: true,
            message: 'New access token generated successfully',
            data: {
                accessToken,
            },
        });
    } catch (error) {
        console.error('Token refresh failed', error);

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token',
                error: {
                    code: 'INVALID_REFRESH_TOKEN',
                    details: 'The refresh token is invalid or expired',
                },
            });
        }

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

export const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie('refreshToken', { path: '/' });

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Logout failed', error);
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
