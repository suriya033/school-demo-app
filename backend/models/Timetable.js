const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
    },
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true,
    },
    periods: [{
        periodNumber: {
            type: Number,
            required: true,
        },
        startTime: {
            type: String,
            required: true,
        },
        endTime: {
            type: String,
            required: true,
        },
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
        },
        staff: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        isBreak: {
            type: Boolean,
            default: false,
        },
        breakType: {
            type: String,
            enum: ['Short Break', 'Lunch Break', null],
        },
    }],
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    academicYear: {
        type: String,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);
