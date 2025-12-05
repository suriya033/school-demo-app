const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    targetAudience: [{
        type: String,
        enum: ['Student', 'staff', 'Parent', 'Admin'], // or specific class IDs if needed
    }],
    // Optional: Link to specific classes if the notice is for them
    targetClasses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
    }],
    attachmentUrl: {
        type: String,
    },
    attachmentType: {
        type: String,
        enum: ['image', 'pdf'],
    },
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);
