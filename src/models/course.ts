import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        index: true, // Thêm index để tối ưu tìm kiếm
    },
    description: String,
    tags: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'tag',
            index: true, // Thêm index cho tags
        },
    ],
    aiGenerated: { type: Boolean, default: false },
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'lesson' }],
    refDocuments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'document' }],
    customization: {
        emoji: { type: String, default: '📚' },
        color: { type: String, default: '#000000' },
        cover: { type: String, default: '' },
    },
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
    status: {
        type: Boolean,
        default: false,
        index: true, // Thêm index cho filtering
    },
});

// Thêm text index cho tìm kiếm full-text
courseSchema.index({
    title: 'text',
    description: 'text',
});

const Course = mongoose.model('course', courseSchema);

export default Course;
