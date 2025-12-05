const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
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
    title: {
        type: String, // e.g., "Tuition Fee - Term 1"
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    dueDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['Paid', 'Pending', 'Overdue'],
        default: 'Pending',
    },
    paymentDate: {
        type: Date,
    },
    paymentMethod: {
        type: String, // e.g., "Cash", "Online", "Cheque"
    },
    transactionId: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);
