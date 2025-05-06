import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    profile: {
        name: { type: String, default: '' },
        avatar: { type: String, default: '' },
        bio: { type: String, default: '' },
        settings: {
            theme: { type: String, default: 'dark' },
            language: { type: String, default: 'en' },
        },
    },
    progress: {
        courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'course' }],
        lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'lesson' }],
        // pages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'page' }],
        // folders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'folder' }],
        documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'document' }],
        tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tag' }],
        images: [{ type: mongoose.Schema.Types.ObjectId, ref: 'image' }],
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const User = mongoose.model('user', userSchema);

export default User;
