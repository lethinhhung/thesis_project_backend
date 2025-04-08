import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { connection } from './config/mongodb';
import cors from 'cors';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
    cors({
        origin: 'http://localhost:5174',
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

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
