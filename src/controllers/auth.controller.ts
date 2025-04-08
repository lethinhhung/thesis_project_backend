import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user';

const SALTROUNDS = 10;

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

// export const login = async (req: Request, res: Response) => {
//     const { username, password } = req.body;
//     const user = User.find((u) => u.username === username);

//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

//     const token = jwt.sign({ username }, process.env.JWT_SECRET!, {
//         expiresIn: '1h',
//     });
//     res.status(201).json({ token });
// };
