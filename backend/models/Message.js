const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: false, // Not required if it's a poll or attachment-only message
    },
    attachmentUrl: {
        type: String,
    },
    attachmentType: {
        type: String,
        enum: ['image', 'pdf', 'none'],
        default: 'none',
    },
    isPoll: {
        type: Boolean,
        default: false,
    },
    pollQuestion: {
        type: String,
    },
    pollOptions: [{
        option: String,
        votes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
    }],
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, { timestamps: true });

// Index for faster queries
messageSchema.index({ class: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
