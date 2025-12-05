const Fee = require('../models/Fee');

// Get all fees
exports.getFees = async (req, res) => {
    try {
        const { studentId, status } = req.query;

        let query = {};
        if (studentId) query.student = studentId;
        if (status) query.status = status;

        const fees = await Fee.find(query)
            .populate('student', 'name email')
            .populate('class', 'name grade section')
            .sort({ dueDate: -1 });

        res.json(fees);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create fee
exports.createFee = async (req, res) => {
    try {
        const { student, classId, title, amount, dueDate } = req.body;

        const fee = new Fee({
            student,
            class: classId,
            title,
            amount,
            dueDate,
            status: 'Pending',
        });

        await fee.save();

        const populated = await Fee.findById(fee._id)
            .populate('student', 'name email')
            .populate('class', 'name grade section');

        res.json(populated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update fee payment
exports.updateFeePayment = async (req, res) => {
    try {
        const { feeId } = req.params;
        const { status, paymentMethod, transactionId } = req.body;

        const fee = await Fee.findById(feeId);
        if (!fee) {
            return res.status(404).json({ message: 'Fee not found' });
        }

        fee.status = status;
        if (status === 'Paid') {
            fee.paymentDate = new Date();
            fee.paymentMethod = paymentMethod;
            fee.transactionId = transactionId;
        }

        await fee.save();

        const populated = await Fee.findById(fee._id)
            .populate('student', 'name email')
            .populate('class', 'name grade section');

        res.json(populated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete fee
exports.deleteFee = async (req, res) => {
    try {
        const { feeId } = req.params;
        await Fee.findByIdAndDelete(feeId);
        res.json({ message: 'Fee deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get fee statistics
exports.getFeeStats = async (req, res) => {
    try {
        const totalFees = await Fee.countDocuments();
        const paidFees = await Fee.countDocuments({ status: 'Paid' });
        const pendingFees = await Fee.countDocuments({ status: 'Pending' });
        const overdueFees = await Fee.countDocuments({ status: 'Overdue' });

        const totalAmount = await Fee.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const paidAmount = await Fee.aggregate([
            { $match: { status: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            totalFees,
            paidFees,
            pendingFees,
            overdueFees,
            totalAmount: totalAmount[0]?.total || 0,
            paidAmount: paidAmount[0]?.total || 0,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
