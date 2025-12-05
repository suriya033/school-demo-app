const Subject = require('../models/Subject');

// Get all subjects
exports.getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().populate('classes', 'name grade section');
        res.json(subjects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create a subject
exports.createSubject = async (req, res) => {
    try {
        const { name, code, classes } = req.body;

        const newSubject = new Subject({
            name,
            code,
            classes: classes || [],
        });

        const savedSubject = await newSubject.save();
        const populatedSubject = await Subject.findById(savedSubject._id).populate('classes', 'name grade section');
        res.json(populatedSubject);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete a subject
exports.deleteSubject = async (req, res) => {
    try {
        const subjectId = req.params.id;
        await Subject.findByIdAndDelete(subjectId);
        res.json({ message: 'Subject deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Add class to subject
exports.addClass = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { classId } = req.body;

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        if (!subject.classes.includes(classId)) {
            subject.classes.push(classId);
            await subject.save();
        }

        const populatedSubject = await Subject.findById(subjectId).populate('classes', 'name grade section');
        res.json(populatedSubject);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Remove class from subject
exports.removeClass = async (req, res) => {
    try {
        const { subjectId, classId } = req.params;

        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        subject.classes = subject.classes.filter(
            id => id.toString() !== classId
        );

        await subject.save();

        const populatedSubject = await Subject.findById(subjectId).populate('classes', 'name grade section');
        res.json(populatedSubject);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
