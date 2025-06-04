import { Request } from 'express';
import { Types } from 'mongoose';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string | Types.ObjectId;
                username: string;
                email: string;
                role?: string;
            };
        }
    }
}
