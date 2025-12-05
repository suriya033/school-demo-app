const Timetable = require('../models/Timetable');

// Get all timetables (with optional filters)
exports.getTimetables = async (req, res) => {
    try {
        const { classId, day, academicYear } = req.query;
        const filter = {};

        if (classId) filter.class = classId;
        if (day) filter.day = day;
        if (academicYear) filter.academicYear = academicYear;

        const timetables = await Timetable.find(filter)
            .populate('class')
            .populate('periods.subject')
            .populate('periods.staff', 'name email')
            .populate('uploadedBy', 'name email')
            .sort({ day: 1 });

        res.json(timetables);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get timetable by ID
exports.getTimetableById = async (req, res) => {
    try {
        const timetable = await Timetable.findById(req.params.id)
            .populate('class')
            .populate('periods.subject')
            .populate('periods.staff', 'name email')
            .populate('uploadedBy', 'name email');

        if (!timetable) {
            return res.status(404).json({ message: 'Timetable not found' });
        }

        res.json(timetable);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new timetable
exports.createTimetable = async (req, res) => {
    try {
        const timetableData = {
            ...req.body,
            uploadedBy: req.user.id,
        };

        // Verify if the staff is authorized (Class staff)
        const Class = require('../models/Class');
        const classDoc = await Class.findById(req.body.class);

        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Allow Admin or Class staff
        const isClassstaff = classDoc.classstaff?.toString() === req.user.id;
        const isAdmin = req.user.role === 'Admin';

        if (!isClassstaff && !isAdmin) {
            return res.status(403).json({ message: 'Only class staffs can upload timetable for this class' });
        }

        const timetable = new Timetable(timetableData);
        const savedTimetable = await timetable.save();

        const populatedTimetable = await Timetable.findById(savedTimetable._id)
            .populate('class')
            .populate('periods.subject')
            .populate('periods.staff', 'name email')
            .populate('uploadedBy', 'name email');

        res.status(201).json(populatedTimetable);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update timetable
exports.updateTimetable = async (req, res) => {
    try {
        const timetable = await Timetable.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('class')
            .populate('periods.subject')
            .populate('periods.staff', 'name email')
            .populate('uploadedBy', 'name email');

        if (!timetable) {
            return res.status(404).json({ message: 'Timetable not found' });
        }

        res.json(timetable);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete timetable
exports.deleteTimetable = async (req, res) => {
    try {
        const timetable = await Timetable.findByIdAndDelete(req.params.id);

        if (!timetable) {
            return res.status(404).json({ message: 'Timetable not found' });
        }

        res.json({ message: 'Timetable deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
