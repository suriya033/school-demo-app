const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['Admin', 'staff', 'Student', 'Parent'],
        required: true,
    },
    phone: {
        type: String,
    },
    address: {
        type: String,
    },
    registerNumber: {
        type: String,
        unique: true,
        sparse: true, // Allows null values to be non-unique
    },
    dateOfBirth: {
        type: Date,
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
    },
    profilePicture: {
        type: String, // URL or path to profile picture
    },
    // Specific fields for different roles can be added here or in separate schemas
    // For simplicity, we can add them here as optional
    studentClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
    },
    staffSubjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
    }],
    staffClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class', // Class staff assignment
    },
    subjectClassAssignments: [{
        subject: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
        },
        class: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Class',
        }
    }],
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Link student to parent
    },
    children: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Link parent to students
    }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
