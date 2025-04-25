import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
    title: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    // aiContent: { type: mongoose.Schema.Types.ObjectId, ref: 'aiContent' },
    // aiProcessed: { type: Boolean, default: false },
});

const Tag = mongoose.model('tag', tagSchema);

export default Tag;
