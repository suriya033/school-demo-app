const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    classes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
    }],
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
