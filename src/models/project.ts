import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    title: {
        type: String,
        index: true, // Thêm index để tối ưu tìm kiếm
    },
    description: String,
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course',
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
projectSchema.index({
    title: 'text',
    description: 'text',
});

const Project = mongoose.model('project', projectSchema);

export default Project;
