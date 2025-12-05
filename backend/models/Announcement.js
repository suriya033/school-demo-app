const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    targetAudience: {
        type: String,
        enum: ['staffs', 'Students', 'All'],
        default: 'staffs',
    },
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    attachmentUrl: {
        type: String,
    },
    attachmentType: {
        type: String,
        enum: ['image', 'pdf'],
    },
}, { timestamps: true });

// Index for faster queries
announcementSchema.index({ targetAudience: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
