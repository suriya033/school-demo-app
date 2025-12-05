const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');

// Get all subject staff assignments
exports.getAssignments = async (req, res) => {
    try {
        const staffs = await User.find({ role: 'staff' })
            .populate('staffSubjects', 'name code')
            .populate('staffClass', 'name grade section')
            .select('name email staffSubjects staffClass');

        res.json(staffs);
    } catch (err) {
        console.error('Error fetching assignments:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Assign subject and class to staff
exports.assignSubjectTostaff = async (req, res) => {
    try {
        const { staffId, subjectId, classId } = req.body;

        if (!staffId || !subjectId || !classId) {
            return res.status(400).json({ message: 'staff, Subject, and Class are required' });
        }

        // Check if staff exists
        const staff = await User.findById(staffId);
        if (!staff || staff.role !== 'staff') {
            return res.status(404).json({ message: 'staff not found' });
        }

        // Check if subject exists
        const subject = await Subject.findById(subjectId);
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        // Check if class exists
        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Add subject to staff's subjects if not already added
        if (!staff.staffSubjects.includes(subjectId)) {
            staff.staffSubjects.push(subjectId);
        }

        await staff.save();

        const updatedstaff = await User.findById(staffId)
            .populate('staffSubjects', 'name code')
            .populate('staffClass', 'name grade section');

        res.json(updatedstaff);
    } catch (err) {
        console.error('Error assigning subject:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Remove subject from staff
exports.removeSubjectFromstaff = async (req, res) => {
    try {
        const { staffId, subjectId } = req.body;

        const staff = await User.findById(staffId);
        if (!staff) {
            return res.status(404).json({ message: 'staff not found' });
        }

        staff.staffSubjects = staff.staffSubjects.filter(
            s => s.toString() !== subjectId
        );

        await staff.save();

        const updatedstaff = await User.findById(staffId)
            .populate('staffSubjects', 'name code')
            .populate('staffClass', 'name grade section');

        res.json(updatedstaff);
    } catch (err) {
        console.error('Error removing subject:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Assign class staff
exports.assignClassstaff = async (req, res) => {
    try {
        const { staffId, classId } = req.body;

        if (!staffId || !classId) {
            return res.status(400).json({ message: 'staff and Class are required' });
        }

        // Remove previous class staff assignment for this class
        await User.updateMany(
            { staffClass: classId },
            { $unset: { staffClass: "" } }
        );

        // Assign new class staff
        const staff = await User.findByIdAndUpdate(
            staffId,
            { staffClass: classId },
            { new: true }
        )
            .populate('staffSubjects', 'name code')
            .populate('staffClass', 'name grade section');

        if (!staff) {
            return res.status(404).json({ message: 'staff not found' });
        }

        res.json(staff);
    } catch (err) {
        console.error('Error assigning class staff:', err.message);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};


