import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'course' },
    title: String,
    content: { type: String, default: '' },
    refDocuments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'document' }],
    aiGenerated: { type: Boolean, default: false },
    // customization: {

    // },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    // aiContent: { type: mongoose.Schema.Types.ObjectId, ref: 'aiContent' },
    // aiProcessed: { type: Boolean, default: false },
});

const Lesson = mongoose.model('lesson', lessonSchema);

export default Lesson;
