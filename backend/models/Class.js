const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // e.g., "Class 10 A"
    },
    grade: {
        type: String,
        required: true, // e.g., "10"
    },
    section: {
        type: String,
        required: true, // e.g., "A"
    },
    classstaff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
    }],
    subjectstaffs: [{
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
        },
        staff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    }],
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
