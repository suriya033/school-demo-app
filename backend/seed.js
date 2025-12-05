const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
require('dotenv').config();

const seedDatabase = async () => {
    try {
        // Connect to MongoDB with better options
        const mongoOptions = {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4,
        };

        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/school_app', mongoOptions);
        console.log('✅ MongoDB Connected');

        // Create a sample class
        let sampleClass = await Class.findOne({ name: 'Class 10-A' });
        if (!sampleClass) {
            sampleClass = await Class.create({
                name: 'Class 10-A',
                grade: '10',
                section: 'A',
            });
            console.log('✅ Created sample class: Class 10-A');
        } else {
            console.log('ℹ️  Class 10-A already exists');
        }

        // Create sample subjects
        let mathSubject = await Subject.findOne({ name: 'Mathematics' });
        if (!mathSubject) {
            mathSubject = await Subject.create({
                name: 'Mathematics',
                code: 'MATH101',
            });
            console.log('✅ Created Mathematics subject');
        } else {
            console.log('ℹ️  Mathematics subject already exists');
        }

        let scienceSubject = await Subject.findOne({ name: 'Science' });
        if (!scienceSubject) {
            scienceSubject = await Subject.create({
                name: 'Science',
                code: 'SCI101',
            });
            console.log('✅ Created Science subject');
        } else {
            console.log('ℹ️  Science subject already exists');
        }

        // Hash password for default users
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = await bcrypt.hash('password123', salt);
        const adminPassword = await bcrypt.hash('admin123', salt);

        // Create or Update Admin user
        let admin = await User.findOne({ email: 'admin@school.com' });
        if (!admin) {
            admin = await User.create({
                name: 'Admin User',
                email: 'admin@school.com',
                password: adminPassword,
                role: 'Admin',
            });
            console.log('✅ Created Admin user (admin@school.com / admin123)');
        } else {
            admin.password = adminPassword;
            await admin.save();
            console.log('✅ Updated Admin user password to admin123');
        }

        // Create staff user
        let staff = await User.findOne({ email: 'staff@school.com' });
        if (!staff) {
            staff = await User.create({
                name: 'John staff',
                email: 'staff@school.com',
                password: defaultPassword,
                role: 'staff',
                staffClass: sampleClass._id,
                staffSubjects: [mathSubject._id, scienceSubject._id],
            });
            console.log('✅ Created staff user (staff@school.com / password123)');
        } else {
            console.log('ℹ️  staff user already exists');
        }

        // Create Student user
        let student = await User.findOne({ email: 'student@school.com' });
        if (!student) {
            student = await User.create({
                name: 'Ganesh',
                email: 'student@school.com',
                password: defaultPassword,
                role: 'Student',
                studentClass: sampleClass._id,
            });
            console.log('✅ Created Student user (student@school.com / password123)');
        } else {
            console.log('ℹ️  Student user already exists');
        }

        // --- Additional Dummy Data ---

        const Notice = require('./models/Notice');
        const Homework = require('./models/Homework');
        const Fee = require('./models/Fee');
        const Timetable = require('./models/Timetable');
        const ExamResult = require('./models/ExamResult');

        // 1. Create Notices
        const noticeCount = await Notice.countDocuments();
        if (noticeCount === 0) {
            await Notice.create([
                {
                    title: 'Annual Sports Day',
                    content: 'The Annual Sports Day will be held on 20th December. All students are requested to participate.',
                    author: admin._id,
                    targetAudience: ['Students', 'staffs'],
                    date: new Date(),
                    attachmentUrl: 'uploads/attachment-1764739032181-733370915.jpg', // Using existing file
                    attachmentType: 'image'
                },
                {
                    title: 'Exam Schedule Released',
                    content: 'The final exam schedule has been released. Please check the notice board.',
                    author: admin._id,
                    targetAudience: ['Students'],
                    date: new Date(Date.now() - 86400000), // Yesterday
                },
                {
                    title: 'Holiday Announcement',
                    content: 'School will remain closed on Friday due to public holiday.',
                    author: admin._id,
                    targetAudience: ['All'],
                    date: new Date(Date.now() - 172800000), // 2 days ago
                }
            ]);
            console.log('✅ Created sample notices');
        }

        // 2. Create Homework
        const homeworkCount = await Homework.countDocuments();
        if (homeworkCount === 0) {
            await Homework.create([
                {
                    title: 'Math Algebra Problems',
                    description: 'Solve exercise 5.1 questions 1 to 10.',
                    subject: mathSubject._id,
                    class: sampleClass._id,
                    assignedBy: staff._id,
                    dueDate: new Date(Date.now() + 86400000 * 2), // Due in 2 days
                },
                {
                    title: 'Science Project',
                    description: 'Submit the solar system model project.',
                    subject: scienceSubject._id,
                    class: sampleClass._id,
                    assignedBy: staff._id,
                    dueDate: new Date(Date.now() + 86400000 * 5), // Due in 5 days
                }
            ]);
            console.log('✅ Created sample homework');
        }

        // 3. Create Fees
        const feeCount = await Fee.countDocuments();
        if (feeCount === 0 && student) {
            await Fee.create([
                {
                    student: student._id,
                    amount: 5000,
                    dueDate: new Date(Date.now() + 86400000 * 10),
                    status: 'Pending',
                    title: 'Term 1 Tuition Fee',
                    description: 'Tuition fee for the first term.'
                },
                {
                    student: student._id,
                    amount: 1000,
                    dueDate: new Date(Date.now() - 86400000 * 10),
                    status: 'Paid',
                    title: 'Lab Fee',
                    description: 'Laboratory maintenance fee.',
                    paidDate: new Date()
                }
            ]);
            console.log('✅ Created sample fees');
        }

        // 4. Create Timetable (Simple version)
        const timetableCount = await Timetable.countDocuments();
        if (timetableCount === 0) {
            await Timetable.create({
                class: sampleClass._id,
                day: 'Monday',
                periods: [
                    {
                        periodNumber: 1,
                        subject: mathSubject._id,
                        staff: staff._id,
                        startTime: '09:00',
                        endTime: '10:00'
                    },
                    {
                        periodNumber: 2,
                        subject: scienceSubject._id,
                        staff: staff._id,
                        startTime: '10:00',
                        endTime: '11:00'
                    },
                    {
                        isBreak: true,
                        breakType: 'Short Break',
                        startTime: '11:00',
                        endTime: '11:15'
                    }
                ]
            });
            console.log('✅ Created sample timetable');
        }

        // 5. Create Exam Results
        const resultCount = await ExamResult.countDocuments();
        if (resultCount === 0 && student) {
            await ExamResult.create({
                student: student._id,
                class: sampleClass._id,
                examName: 'Mid Term Exam',
                subjects: [
                    {
                        subject: mathSubject._id,
                        marksObtained: 85,
                        totalMarks: 100,
                        grade: 'A'
                    },
                    {
                        subject: scienceSubject._id,
                        marksObtained: 78,
                        totalMarks: 100,
                        grade: 'B+'
                    }
                ]
            });
            console.log('✅ Created sample exam results');
        }

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📝 Login Credentials:');
        console.log('┌─────────────────────────────────────────┐');
        console.log('│ Admin:   admin@school.com / admin123    │');
        console.log('│ staff: staff@school.com / password123 │');
        console.log('│ Student: student@school.com / password123 │');
        console.log('└─────────────────────────────────────────┘');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
        console.error('\n💡 Make sure MongoDB is running and accessible');
        console.error('   Check your MONGO_URI in .env file');
        process.exit(1);
    }
};

seedDatabase();
