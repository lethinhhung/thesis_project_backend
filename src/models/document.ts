import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    title: String,
    fileUrl: String,
    shortSummary: String,
    longSummary: String,
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tag' }],
    // customization: {},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    // aiContent: { type: mongoose.Schema.Types.ObjectId, ref: 'aiContent' },
    // aiProcessed: { type: Boolean, default: false },
});

const Document = mongoose.model('document', documentSchema);

export default Document;
