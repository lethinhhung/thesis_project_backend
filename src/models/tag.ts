import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Tạo compound index cho title và userId
tagSchema.index({ title: 1, userId: 1 }, { unique: true });

// Middleware để tự động cập nhật updatedAt
tagSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const Tag = mongoose.model('tag', tagSchema);

export default Tag;
