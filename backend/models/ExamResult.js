const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true,
    },
    examType: {
        type: String,
        enum: ['Mid-Term', 'Final', 'Unit Test', 'Quarterly', 'Half-Yearly', 'Annual'],
        required: true,
    },
    examName: {
        type: String,
        required: true,
    },
    academicYear: {
        type: String,
        required: true,
    },
    subjects: [{
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        marksObtained: {
            type: Number,
            required: true,
        },
        totalMarks: {
            type: Number,
            required: true,
        },
        grade: {
            type: String,
        },
        remarks: {
            type: String,
        },
    }],
    totalMarksObtained: {
        type: Number,
        required: true,
    },
    totalMarks: {
        type: Number,
        required: true,
    },
    percentage: {
        type: Number,
        required: true,
    },
    overallGrade: {
        type: String,
    },
    rank: {
        type: Number,
    },
    remarks: {
        type: String,
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('ExamResult', examResultSchema);
