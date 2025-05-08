import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    title: {
        type: String,
        index: true, // Thêm index để tối ưu tìm kiếm
    },
    fileUrl: String,
    tags: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'tag',
            index: true, // Thêm index cho tags
        },
    ],
    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'pending', index: true },
    courseId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'course' }],
    lessonId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'lesson' }],
    size: Number,
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
    // aiContent: { type: mongoose.Schema.Types.ObjectId, ref: 'aiContent' },
    // aiProcessed: { type: Boolean, default: false },
});

documentSchema.index({
    title: 'text',
});

const Document = mongoose.model('document', documentSchema);

export default Document;
