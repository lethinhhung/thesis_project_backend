import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    title: {
        type: String,
        index: true, // Thêm index để tối ưu tìm kiếm
    },
    messages: [
        {
            role: { type: String, enum: ['user', 'assistant'], required: true },
            content: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
        },
    ],
    // customization: {},
    createdAt: {
        type: Date,
        default: Date.now,
        index: true, // Thêm index cho sorting
    },
    updatedAt: {
        type: Date,
        default: Date.now,
        index: true, // Thêm index cho sorting
    },
});

chatSchema.index({
    title: 'text',
});

const Chat = mongoose.model('chat', chatSchema);

export default Chat;
