const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get all staffs
exports.getstaffs = async (req, res) => {
    try {
        const staffs = await User.find({ role: 'staff' })
            .populate('staffSubjects', 'name code')
            .populate('staffClass', 'name grade section');
        res.json(staffs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get staff by ID
exports.getstaffById = async (req, res) => {
    try {
        const staff = await User.findById(req.params.id)
            .populate('staffSubjects', 'name code')
            .populate('staffClass', 'name grade section');

        if (!staff || staff.role !== 'staff') {
            return res.status(404).json({ message: 'staff not found' });
        }

        res.json(staff);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create a staff
exports.createstaff = async (req, res) => {
    try {
        let { name, email, password, phone, address, staffSubjects, staffClass, registerNumber, dateOfBirth, gender, subjectClassAssignments } = req.body;

        // Handle staffSubjects array from FormData (which might send it as 'staffSubjects[]')
        if (!staffSubjects && req.body['staffSubjects[]']) {
            staffSubjects = req.body['staffSubjects[]'];
        }
        // Ensure it's an array (if single value sent, make it array)
        if (staffSubjects && !Array.isArray(staffSubjects)) {
            staffSubjects = [staffSubjects];
        }

        // Parse subjectClassAssignments if it's a string
        if (subjectClassAssignments && typeof subjectClassAssignments === 'string') {
            subjectClassAssignments = JSON.parse(subjectClassAssignments);
        }

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'staff with this email already exists' });
        }

        // Check if register number exists
        if (registerNumber) {
            let userWithReg = await User.findOne({ registerNumber });
            if (userWithReg) {
                return res.status(400).json({ message: 'staff with this register number already exists' });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create staff
        const staff = new User({
            name,
            email,
            password: hashedPassword,
            role: 'staff',
            phone,
            address,
            staffSubjects: staffSubjects || [],
            staffClass: staffClass || null,
            subjectClassAssignments: subjectClassAssignments || [],
            registerNumber,
            dateOfBirth,
            gender,
            profilePicture: req.file ? `uploads/${req.file.path.replace(/\\/g, "/").split('uploads/').pop()}` : undefined,
        });

        await staff.save();

        // Update Class model if staffClass is provided
        if (staffClass) {
            await Class.findByIdAndUpdate(staffClass, { classstaff: staff._id });
        }

        // Update Class model for subjectClassAssignments
        if (subjectClassAssignments && subjectClassAssignments.length > 0) {
            for (const assignment of subjectClassAssignments) {
                await Class.findByIdAndUpdate(assignment.class, {
                    $addToSet: {
                        subjectstaffs: {
                            subject: assignment.subject,
                            staff: staff._id
                        }
                    }
                });
            }
        }

        const populatedstaff = await User.findById(staff._id)
            .populate('staffSubjects', 'name code')
            .populate('staffClass', 'name grade section')
            .populate('subjectClassAssignments.subject', 'name code')
            .populate('subjectClassAssignments.class', 'name grade section');

        res.json(populatedstaff);
    } catch (err) {
        console.error('Error creating staff:', err.message);
        console.error('Stack:', err.stack);
        console.error('Request body:', req.body);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Update a staff
exports.updatestaff = async (req, res) => {
    try {
        let { name, email, phone, address, staffSubjects, staffClass, registerNumber, dateOfBirth, gender } = req.body;
        const staffId = req.params.id;

        // Handle staffSubjects array from FormData
        if (!staffSubjects && req.body['staffSubjects[]']) {
            staffSubjects = req.body['staffSubjects[]'];
        }
        if (staffSubjects && !Array.isArray(staffSubjects)) {
            staffSubjects = [staffSubjects];
        }

        let updateData = {
            name,
            email,
            phone,
            address,
            staffSubjects: staffSubjects || [],
            staffClass: staffClass || null,
            registerNumber,
            dateOfBirth,
            gender
        };
        if (req.file) {
            updateData.profilePicture = `uploads/${req.file.path.replace(/\\/g, "/").split('uploads/').pop()}`;
        }

        const oldStaff = await User.findById(staffId);
        const oldClassId = oldStaff.staffClass;

        const updatedstaff = await User.findByIdAndUpdate(
            staffId,
            updateData,
            { new: true }
        ).populate('staffSubjects', 'name code')
            .populate('staffClass', 'name grade section');

        // Sync with Class model
        if (staffClass && staffClass.toString() !== oldClassId?.toString()) {
            // New class assignment
            await Class.findByIdAndUpdate(staffClass, { classstaff: staffId });
            // Clear old class if it existed
            if (oldClassId) {
                await Class.findByIdAndUpdate(oldClassId, { classstaff: null });
            }
        } else if (!staffClass && oldClassId) {
            // Removed class assignment
            await Class.findByIdAndUpdate(oldClassId, { classstaff: null });
        }

        res.json(updatedstaff);
    } catch (err) {
        console.error('Error updating staff:', err.message);
        console.error('Stack:', err.stack);
        console.error('Request body:', req.body);
        res.status(500).json({ message: err.message || 'Server Error' });
    }
};

// Delete a staff
exports.deletestaff = async (req, res) => {
    try {
        const staffId = req.params.id;
        await User.findByIdAndDelete(staffId);
        res.json({ message: 'staff deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
