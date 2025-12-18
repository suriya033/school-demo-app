const Class = require('../models/Class');
const User = require('../models/User');

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

// Get class by ID
exports.getClassById = async (req, res) => {
    try {
        const classDoc = await Class.findById(req.params.id)
            .populate('classstaff', 'name email')
            .populate('subjects', 'name code')
            .populate('subjectstaffs.staff', 'name email')
            .populate('subjectstaffs.subject', 'name code')
            .populate('students', 'name email registerNumber');

        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found' });
        }
        res.json(classDoc);
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

        // Update User model if classstaff is provided
        if (classstaff) {
            await User.findByIdAndUpdate(classstaff, { staffClass: savedClass._id });
        }

        // Update User model for subjectstaffs
        if (subjectstaffs && subjectstaffs.length > 0) {
            for (const ss of subjectstaffs) {
                await User.findByIdAndUpdate(ss.staff, {
                    $addToSet: {
                        subjectClassAssignments: {
                            subject: ss.subject,
                            class: savedClass._id
                        }
                    }
                });
            }
        }

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

        const oldStaffId = existingIndex >= 0 ? classDoc.subjectstaffs[existingIndex].staff : null;

        if (existingIndex >= 0) {
            // Update existing assignment
            classDoc.subjectstaffs[existingIndex].staff = staffId;
        } else {
            // Add new assignment
            classDoc.subjectstaffs.push({ subject: subjectId, staff: staffId });
        }

        await classDoc.save();

        // Update User model for new staff
        await User.findByIdAndUpdate(staffId, {
            $addToSet: {
                subjectClassAssignments: {
                    subject: subjectId,
                    class: classId
                }
            }
        });

        // Remove from old staff if changed
        if (oldStaffId && oldStaffId.toString() !== staffId.toString()) {
            await User.findByIdAndUpdate(oldStaffId, {
                $pull: {
                    subjectClassAssignments: {
                        subject: subjectId,
                        class: classId
                    }
                }
            });
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

        const oldStaffId = classDoc.classstaff;

        classDoc.classstaff = staffId;
        await classDoc.save();

        // Update new staff
        if (staffId) {
            await User.findByIdAndUpdate(staffId, { staffClass: classId });
        }

        // Clear old staff
        if (oldStaffId && oldStaffId.toString() !== staffId?.toString()) {
            await User.findByIdAndUpdate(oldStaffId, { staffClass: null });
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
