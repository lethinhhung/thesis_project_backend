import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import { connection } from './config/mongodb';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
