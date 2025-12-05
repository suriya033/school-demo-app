const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all students
exports.getStudents = async (req, res) => {
    try {
        const { classId } = req.query;
        let query = { role: 'Student' };

        if (classId) {
            query.studentClass = classId;
        }

        const students = await User.find(query)
            .populate('studentClass', 'name grade section')
            .populate('parentId', 'name email phone')
            .sort({ name: 1 }); // Sort alphabetically by name
        res.json(students);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get student by ID
exports.getStudentById = async (req, res) => {
    try {
        const student = await User.findById(req.params.id)
            .populate('studentClass', 'name grade section')
            .populate('parentId', 'name email phone');

        if (!student || student.role !== 'Student') {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json(student);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create a student
exports.createStudent = async (req, res) => {
    try {
        const { name, email, password, phone, address, studentClass, parentId, registerNumber, dateOfBirth, gender } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Student with this email already exists' });
        }

        // Check if register number exists
        if (registerNumber) {
            let userWithReg = await User.findOne({ registerNumber });
            if (userWithReg) {
                return res.status(400).json({ message: 'Student with this register number already exists' });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create student
        const student = new User({
            name,
            email,
            password: hashedPassword,
            role: 'Student',
            phone,
            address,
            registerNumber,
            dateOfBirth,
            gender,
            studentClass: studentClass || null,
            parentId: parentId || null,
            profilePicture: req.file ? `uploads/${req.file.path.replace(/\\/g, "/").split('uploads/').pop()}` : undefined,
        });

        await student.save();

        // If parent is assigned, add student to parent's children array
        if (parentId) {
            await User.findByIdAndUpdate(parentId, {
                $push: { children: student._id }
            });
        }

        // Add student to class students array
        if (studentClass) {
            const Class = require('../models/Class');
            await Class.findByIdAndUpdate(studentClass, {
                $addToSet: { students: student._id }
            });
        }

        const populatedStudent = await User.findById(student._id)
            .populate('studentClass', 'name grade section')
            .populate('parentId', 'name email phone');

        res.json(populatedStudent);
    } catch (err) {
        console.error('Error creating student:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Update a student
exports.updateStudent = async (req, res) => {
    try {
        const { name, email, phone, address, studentClass, parentId, registerNumber, dateOfBirth, gender } = req.body;
        const studentId = req.params.id;

        // Get old student data to check if class/parent changed
        const oldStudent = await User.findById(studentId);
        if (!oldStudent) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check register number uniqueness
        if (registerNumber) {
            const userWithReg = await User.findOne({ registerNumber });
            if (userWithReg && userWithReg._id.toString() !== studentId) {
                return res.status(400).json({ message: 'Student with this register number already exists' });
            }
        }

        let updateData = {
            name,
            email,
            phone,
            address,
            registerNumber,
            dateOfBirth,
            gender
        };

        // Handle studentClass update
        if (studentClass !== undefined) {
            updateData.studentClass = studentClass || null;
        }

        // Handle parentId update
        if (parentId !== undefined) {
            updateData.parentId = parentId || null;
        }

        if (req.file) {
            updateData.profilePicture = `uploads/${req.file.path.replace(/\\/g, "/").split('uploads/').pop()}`;
        }

        const updatedStudent = await User.findByIdAndUpdate(
            studentId,
            updateData,
            { new: true }
        )
            .populate('studentClass', 'name grade section')
            .populate('parentId', 'name email phone');

        // Update class students arrays if class changed
        const oldClassId = oldStudent.studentClass?.toString();
        const newClassId = updateData.studentClass ? updateData.studentClass.toString() : null;

        if (oldClassId !== newClassId) {
            const Class = require('../models/Class');

            // Remove from old class
            if (oldClassId) {
                await Class.findByIdAndUpdate(oldClassId, {
                    $pull: { students: studentId }
                });
            }

            // Add to new class
            if (newClassId) {
                await Class.findByIdAndUpdate(newClassId, {
                    $addToSet: { students: studentId }
                });
            }
        }

        // Update parent children arrays if parent changed
        const oldParentId = oldStudent.parentId?.toString();
        const newParentId = updateData.parentId ? updateData.parentId.toString() : null;

        if (oldParentId !== newParentId) {
            // Remove from old parent
            if (oldParentId) {
                await User.findByIdAndUpdate(oldParentId, {
                    $pull: { children: studentId }
                });
            }

            // Add to new parent
            if (newParentId) {
                await User.findByIdAndUpdate(newParentId, {
                    $addToSet: { children: studentId }
                });
            }
        }

        res.json(updatedStudent);
    } catch (err) {
        console.error('Error updating student:', err.message);
        console.error('Stack:', err.stack);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
    try {
        const studentId = req.params.id;
        await User.findByIdAndDelete(studentId);
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
