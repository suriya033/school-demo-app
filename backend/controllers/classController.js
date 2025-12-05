const Class = require('../models/Class');

// Get all classes
exports.getClasses = async (req, res) => {
    try {
        const { staffId } = req.query;
        let query = {};

        if (staffId) {
            query.$or = [
                { classstaff: staffId },
                { 'subjectstaffs.staff': staffId }
            ];
        }

        const classes = await Class.find(query)
            .populate('classstaff', 'name email')
            .populate('subjects', 'name code')
            .populate('subjectstaffs.staff', 'name email')
            .populate('subjectstaffs.subject', 'name code')
            .populate('students', 'name email registerNumber');
        res.json(classes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create a class
exports.createClass = async (req, res) => {
    try {
        const { name, grade, section, classstaff, subjects, subjectstaffs } = req.body;

        const newClass = new Class({
            name,
            grade,
            section,
            classstaff,
            subjects: subjects || [],
            subjectstaffs: subjectstaffs || [],
        });

        const savedClass = await newClass.save();
        const populatedClass = await Class.findById(savedClass._id)
            .populate('classstaff', 'name email')
            .populate('subjects', 'name code')
            .populate('subjectstaffs.staff', 'name email')
            .populate('subjectstaffs.subject', 'name code');

        res.json(populatedClass);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete a class
exports.deleteClass = async (req, res) => {
    try {
        const classId = req.params.id;
        await Class.findByIdAndDelete(classId);
        res.json({ message: 'Class deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Assign subject staff to a class
exports.assignSubjectstaff = async (req, res) => {
    try {
        const { classId } = req.params;
        const { subjectId, staffId } = req.body;

        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Check if this subject-staff combination already exists
        const existingIndex = classDoc.subjectstaffs.findIndex(
            st => st.subject.toString() === subjectId
        );

        if (existingIndex >= 0) {
            // Update existing assignment
            classDoc.subjectstaffs[existingIndex].staff = staffId;
        } else {
            // Add new assignment
            classDoc.subjectstaffs.push({ subject: subjectId, staff: staffId });
        }

        await classDoc.save();

        const populatedClass = await Class.findById(classId)
            .populate('classstaff', 'name email')
            .populate('subjects', 'name code')
            .populate('subjectstaffs.staff', 'name email')
            .populate('subjectstaffs.subject', 'name code')
            .populate('students', 'name email registerNumber');

        res.json(populatedClass);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Remove subject staff from a class
exports.removeSubjectstaff = async (req, res) => {
    try {
        const { classId, subjectId } = req.params;

        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found' });
        }

        classDoc.subjectstaffs = classDoc.subjectstaffs.filter(
            st => st.subject.toString() !== subjectId
        );

        await classDoc.save();

        const populatedClass = await Class.findById(classId)
            .populate('classstaff', 'name email')
            .populate('subjects', 'name code')
            .populate('subjectstaffs.staff', 'name email')
            .populate('subjectstaffs.subject', 'name code')
            .populate('students', 'name email registerNumber');

        res.json(populatedClass);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Add subject to class
exports.addSubject = async (req, res) => {
    try {
        const { classId } = req.params;
        const { subjectId } = req.body;

        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found' });
        }

        if (!classDoc.subjects.includes(subjectId)) {
            classDoc.subjects.push(subjectId);
            await classDoc.save();
        }

        const populatedClass = await Class.findById(classId)
            .populate('classstaff', 'name email')
            .populate('subjects', 'name code')
            .populate('subjectstaffs.staff', 'name email')
            .populate('subjectstaffs.subject', 'name code')
            .populate('students', 'name email registerNumber');

        res.json(populatedClass);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Remove subject from class
exports.removeSubject = async (req, res) => {
    try {
        const { classId, subjectId } = req.params;

        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found' });
        }

        classDoc.subjects = classDoc.subjects.filter(
            id => id.toString() !== subjectId
        );

        // Also remove from subjectstaffs if present
        classDoc.subjectstaffs = classDoc.subjectstaffs.filter(
            st => st.subject.toString() !== subjectId
        );

        await classDoc.save();

        const populatedClass = await Class.findById(classId)
            .populate('classstaff', 'name email')
            .populate('subjects', 'name code')
            .populate('subjectstaffs.staff', 'name email')
            .populate('subjectstaffs.subject', 'name code')
            .populate('students', 'name email registerNumber');

        res.json(populatedClass);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Assign class staff (Class Teacher)
exports.assignClassStaff = async (req, res) => {
    try {
        const { classId } = req.params;
        const { staffId } = req.body;

        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found' });
        }

        classDoc.classstaff = staffId;
        await classDoc.save();

        const populatedClass = await Class.findById(classId)
            .populate('classstaff', 'name email')
            .populate('subjects', 'name code')
            .populate('subjectstaffs.staff', 'name email')
            .populate('subjectstaffs.subject', 'name code')
            .populate('students', 'name email registerNumber');

        res.json(populatedClass);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
