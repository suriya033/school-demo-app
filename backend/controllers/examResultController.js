const ExamResult = require('../models/ExamResult');

// Get all exam results (with optional filters)
exports.getExamResults = async (req, res) => {
    try {
        const { studentId, classId, examType, academicYear } = req.query;
        const filter = {};

        if (studentId) filter.student = studentId;
        if (classId) filter.class = classId;
        if (examType) filter.examType = examType;
        if (academicYear) filter.academicYear = academicYear;

        const results = await ExamResult.find(filter)
            .populate('student', 'name email registerNumber')
            .populate('class')
            .populate('subjects.subject')
            .populate('uploadedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get exam result by ID
exports.getExamResultById = async (req, res) => {
    try {
        const result = await ExamResult.findById(req.params.id)
            .populate('student', 'name email registerNumber')
            .populate('class')
            .populate('subjects.subject')
            .populate('uploadedBy', 'name email');

        if (!result) {
            return res.status(404).json({ message: 'Exam result not found' });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create new exam result
exports.createExamResult = async (req, res) => {
    try {
        const resultData = {
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
            return res.status(403).json({ message: 'Only class staffs can upload exam marks for this class' });
        }

        // Calculate totals and percentage
        let totalMarksObtained = 0;
        let totalMarks = 0;

        resultData.subjects.forEach(subject => {
            totalMarksObtained += subject.marksObtained;
            totalMarks += subject.totalMarks;

            // Calculate grade for each subject
            const percentage = (subject.marksObtained / subject.totalMarks) * 100;
            subject.grade = calculateGrade(percentage);
        });

        resultData.totalMarksObtained = totalMarksObtained;
        resultData.totalMarks = totalMarks;
        resultData.percentage = (totalMarksObtained / totalMarks) * 100;
        resultData.overallGrade = calculateGrade(resultData.percentage);

        const result = new ExamResult(resultData);
        const savedResult = await result.save();

        const populatedResult = await ExamResult.findById(savedResult._id)
            .populate('student', 'name email registerNumber')
            .populate('class')
            .populate('subjects.subject')
            .populate('uploadedBy', 'name email');

        res.status(201).json(populatedResult);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update exam result
exports.updateExamResult = async (req, res) => {
    try {
        // Recalculate totals and percentage if subjects are updated
        if (req.body.subjects) {
            let totalMarksObtained = 0;
            let totalMarks = 0;

            req.body.subjects.forEach(subject => {
                totalMarksObtained += subject.marksObtained;
                totalMarks += subject.totalMarks;

                const percentage = (subject.marksObtained / subject.totalMarks) * 100;
                subject.grade = calculateGrade(percentage);
            });

            req.body.totalMarksObtained = totalMarksObtained;
            req.body.totalMarks = totalMarks;
            req.body.percentage = (totalMarksObtained / totalMarks) * 100;
            req.body.overallGrade = calculateGrade(req.body.percentage);
        }

        const result = await ExamResult.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('student', 'name email registerNumber')
            .populate('class')
            .populate('subjects.subject')
            .populate('uploadedBy', 'name email');

        if (!result) {
            return res.status(404).json({ message: 'Exam result not found' });
        }

        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete exam result
exports.deleteExamResult = async (req, res) => {
    try {
        const result = await ExamResult.findByIdAndDelete(req.params.id);

        if (!result) {
            return res.status(404).json({ message: 'Exam result not found' });
        }

        res.json({ message: 'Exam result deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper function to calculate grade
function calculateGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
}
