import { Express } from 'express';
import { Types } from 'mongoose';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string | Types.ObjectId;
                username: string;
                email: string;
                role?: string;
                // profile?: {
                //     name: string;
                //     avatar: string;
                //     bio: string;
                //     settings?: {
                //         theme: string;
                //         language: string;
                //     };
                // };
                // progress?: {
                //     courses: Types.ObjectId[];
                //     lessons: Types.ObjectId[];
                //     documents: Types.ObjectId[];
                //     //                     pages: Types.ObjectId[];
                //     //                     folders: Types.ObjectId[];
                // };
                // createdAt: Date;
                // updatedAt: Date;
            };
        }
    }
}
