import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const dbState = [
    {
        value: 0,
        label: 'Disconnected',
    },
    {
        value: 1,
        label: 'Connected',
    },
    {
        value: 2,
        label: 'Connecting',
    },
    {
        value: 3,
        label: 'Disconnecting',
    },
    {
        value: 4,
        label: 'Error',
    },
];

export const connection = async () => {
    await mongoose.connect(process.env.MONGO_DB_URL || '');
    const state = Number(mongoose.connection.readyState);
    console.log((dbState.find((f) => f.value === state) || dbState[5]).label, 'to database');
};
