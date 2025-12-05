const Homework = require('../models/Homework');

// Get all homework
exports.getHomework = async (req, res) => {
    try {
        const { classId, subjectId, staffId } = req.query;

        let query = {};
        if (classId) query.class = classId;
        if (subjectId) query.subject = subjectId;
        if (staffId) query.staff = staffId;

        const homework = await Homework.find(query)
            .populate('class', 'name grade section')
            .populate('subject', 'name code')
            .populate('staff', 'name')
            .sort({ dueDate: -1 });

        res.json(homework);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create homework
exports.createHomework = async (req, res) => {
    try {
        const { title, description, classId, subjectId, staffId, dueDate, attachmentUrl } = req.body;

        const homework = new Homework({
            title,
            description,
            class: classId,
            subject: subjectId,
            staff: staffId,
            dueDate,
            attachmentUrl,
        });

        await homework.save();

        const populated = await Homework.findById(homework._id)
            .populate('class', 'name grade section')
            .populate('subject', 'name code')
            .populate('staff', 'name');

        res.json(populated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update homework
exports.updateHomework = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, attachmentUrl } = req.body;

        const homework = await Homework.findByIdAndUpdate(
            id,
            { title, description, dueDate, attachmentUrl },
            { new: true }
        )
            .populate('class', 'name grade section')
            .populate('subject', 'name code')
            .populate('staff', 'name');

        res.json(homework);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete homework
exports.deleteHomework = async (req, res) => {
    try {
        const { id } = req.params;
        await Homework.findByIdAndDelete(id);
        res.json({ message: 'Homework deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
