import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    title: String,
    description: String,
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tag' }],
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    aiGenerated: { type: Boolean, default: false },
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'lesson' }],
    refDocuments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'document' }],
    // customization: {},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    // aiContent: { type: mongoose.Schema.Types.ObjectId, ref: 'aiContent' },
    // aiProcessed: { type: Boolean, default: false },
});

const Course = mongoose.model('course', courseSchema);

export default Course;
