const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Class = require('../models/Class');

// Get attendance by class, subject and date
exports.getAttendance = async (req, res) => {
    try {
        const { classId, subjectId, date } = req.query;

        let query = {};
        if (classId) query.class = classId;
        if (subjectId) query.subject = subjectId;
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const attendance = await Attendance.find(query)
            .populate('class', 'name grade section')
            .populate('subject', 'name code')
            .populate('staff', 'name')
            .populate('records.student', 'name email')
            .sort({ date: -1 });

        res.json(attendance);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Mark attendance
exports.markAttendance = async (req, res) => {
    try {
        const { classId, subjectId, staffId, records, date } = req.body;

        // Verify if the staff is authorized to mark attendance for this class
        const Class = require('../models/Class');
        const classDoc = await Class.findById(classId);

        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found' });
        }

        const isClassstaff = classDoc.classstaff.toString() === staffId;

        // Only class staffs can mark attendance
        if (!isClassstaff) {
            return res.status(403).json({ message: 'Only class staffs can mark attendance' });
        }

        // Check if attendance already exists for this class and date
        const attendanceDate = date ? new Date(date) : new Date();
        attendanceDate.setHours(0, 0, 0, 0);

        const query = {
            class: classId,
            subject: null, // Full-day attendance has no subject
            date: {
                $gte: attendanceDate,
                $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
            }
        };

        const existingAttendance = await Attendance.findOne(query);

        if (existingAttendance) {
            // Update existing attendance
            existingAttendance.records = records;
            existingAttendance.staff = staffId;
            await existingAttendance.save();

            const populated = await Attendance.findById(existingAttendance._id)
                .populate('class', 'name grade section')
                .populate('subject', 'name code')
                .populate('staff', 'name')
                .populate('records.student', 'name email');

            return res.json(populated);
        }

        // Create new attendance
        const attendance = new Attendance({
            date: attendanceDate,
            class: classId,
            subject: null, // No subject for full-day attendance
            staff: staffId,
            records,
        });

        await attendance.save();

        const populated = await Attendance.findById(attendance._id)
            .populate('class', 'name grade section')
            .populate('subject', 'name code')
            .populate('staff', 'name')
            .populate('records.student', 'name email');

        res.json(populated);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get student attendance history
exports.getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;

        const attendance = await Attendance.find({
            'records.student': studentId
        })
            .populate('class', 'name grade section')
            .sort({ date: -1 });

        const studentRecords = attendance.map(att => {
            const record = att.records.find(r => r.student.toString() === studentId);
            return {
                date: att.date,
                class: att.class,
                status: record.status,
                remarks: record.remarks,
            };
        });

        res.json(studentRecords);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get admin attendance statistics for all classes
exports.getAdminAttendanceStats = async (req, res) => {
    try {
        const { date } = req.query;
        const Class = require('../models/Class');

        // Parse date
        const attendanceDate = date ? new Date(date) : new Date();
        attendanceDate.setHours(0, 0, 0, 0);
        const endDate = new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000);

        // Get all classes
        const classes = await Class.find().populate('students', 'name');

        // Get attendance for the date
        const attendanceRecords = await Attendance.find({
            date: { $gte: attendanceDate, $lt: endDate },
            subject: null // Only full-day attendance
        }).populate('class', 'name grade section');

        // Build stats for each class
        const stats = classes.map(cls => {
            const attendance = attendanceRecords.find(
                att => att.class._id.toString() === cls._id.toString()
            );

            let present = 0, absent = 0, od = 0;

            if (attendance) {
                attendance.records.forEach(record => {
                    if (record.status === 'Present') present++;
                    else if (record.status === 'Absent') absent++;
                    else if (record.status === 'OD') od++;
                });
            } else {
                // No attendance marked yet
                absent = cls.students?.length || 0;
            }

            return {
                classId: cls._id,
                className: cls.name,
                present,
                absent,
                od
            };
        });

        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get class attendance details with student list
exports.getClassAttendanceDetails = async (req, res) => {
    try {
        const { classId, date } = req.query;

        if (!classId || !date) {
            return res.status(400).json({ message: 'Class ID and date are required' });
        }

        // Parse date
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);
        const endDate = new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000);

        // Get class details
        const classDoc = await Class.findById(classId);
        if (!classDoc) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Get all students in the class
        const students = await User.find({ studentClass: classId, role: 'Student' })
            .select('name email registerNumber')
            .sort({ name: 1 });

        // Get attendance record for this class and date
        const attendanceRecord = await Attendance.findOne({
            class: classId,
            date: { $gte: attendanceDate, $lt: endDate },
            subject: null // Full-day attendance
        });

        // Build student list with attendance status
        const studentsWithStatus = students.map(student => {
            let status = 'Absent'; // Default to absent if no attendance marked

            if (attendanceRecord) {
                const record = attendanceRecord.records.find(
                    r => r.student.toString() === student._id.toString()
                );
                if (record) {
                    status = record.status;
                }
            }

            return {
                _id: student._id,
                name: student.name,
                email: student.email,
                registerNumber: student.registerNumber,
                status
            };
        });

        // Calculate stats
        const stats = {
            present: studentsWithStatus.filter(s => s.status === 'Present').length,
            absent: studentsWithStatus.filter(s => s.status === 'Absent').length,
            od: studentsWithStatus.filter(s => s.status === 'OD').length
        };

        res.json({
            students: studentsWithStatus,
            stats
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
