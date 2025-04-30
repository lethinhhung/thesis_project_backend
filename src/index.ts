import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import courseRoutes from './routes/course.routes';
import lessonRoutes from './routes/lesson.routes';
import dataRoutes from './routes/data.routes';
import uploadRoutes from './routes/upload.routes';
import { connection } from './config/mongodb';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import './models/user';
import './models/course';
import './models/document';
import './models/lesson';
import './models/tag';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
    cors({
        origin: 'http://localhost:3000',
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/lesson', lessonRoutes);
app.use('/api/data', dataRoutes);

(async () => {
    try {
        await connection();

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.log('>>> Error connect to DB: ', error);
    }
})();
