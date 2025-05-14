import mongoose from 'mongoose';

const testSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'course',
    },
    title: {
        type: String,
        index: true, // Thêm index để tối ưu tìm kiếm
    },
    description: String,
    score: {
        type: Number,
        min: 0,
        max: 10,
    },
    date: {
        type: Date,
        default: Date.now,
        index: true, // Thêm index cho sorting
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
});

testSchema.index({
    title: 'text',
    description: 'text',
});

const Test = mongoose.model('test', testSchema);

export default Test;
