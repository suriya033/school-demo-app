const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors({
    origin: '*', // Allow all origins for mobile app
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Request Logger Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Database Connection with Retry Logic
const connectDB = async () => {
    const maxRetries = 3;
    let retryCount = 0;

    const mongoOptions = {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        retryWrites: true,
        w: 'majority',
    };

    while (retryCount < maxRetries) {
        try {
            console.log(`\n🔄 Attempting to connect to MongoDB Atlas... (Attempt ${retryCount + 1}/${maxRetries})`);

            await mongoose.connect(process.env.MONGO_URI, mongoOptions);

            console.log('✅ MongoDB Atlas Connected Successfully!');
            console.log(`📊 Database: ${mongoose.connection.name}`);
            console.log(`🌐 Host: ${mongoose.connection.host}`);
            return;

        } catch (err) {
            retryCount++;
            console.error(`❌ Connection attempt ${retryCount} failed:`, err.message);

            if (retryCount >= maxRetries) {
                console.log('\n⚠️  All connection attempts failed. Starting in OFFLINE MODE');
                console.log('   The app will work with temporary in-memory data.');
                console.log('   Changes will NOT be saved after restart.');

                console.log('\n🔑 USE THESE LOGIN CREDENTIALS:');
                console.log('   ┌──────────────────────────────────────────────┐');
                console.log('   │ Role    | Email              | Password      │');
                console.log('   │ Admin   | admin@school.com   | password123   │');
                console.log('   │ staff | staff@school.com | password123   │');
                console.log('   │ Student | student@school.com | password123   │');
                console.log('   └──────────────────────────────────────────────┘');

                console.log('\n🛠️  TO FIX MONGODB CONNECTION:');
                console.log('   1. Go to MongoDB Atlas (cloud.mongodb.com)');
                console.log('   2. Click "Network Access" in left sidebar');
                console.log('   3. Click "Add IP Address"');
                console.log('   4. Click "Allow Access from Anywhere" (0.0.0.0/0)');
                console.log('   5. Wait 2-3 minutes for changes to apply');
                console.log('   6. Restart this server\n');
                return;
            }

            // Wait before retry
            console.log(`⏳ Waiting 2 seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
    console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('📴 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
});

connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/classes', require('./routes/classRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/staffs', require('./routes/staffRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/fees', require('./routes/feeRoutes'));
app.use('/api/homework', require('./routes/homeworkRoutes'));
app.use('/api/notices', require('./routes/noticeRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/timetables', require('./routes/timetableRoutes'));
app.use('/api/exam-results', require('./routes/examResultRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));

app.get('/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running!',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (req, res) => {
    res.send('School Management App API is running');
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`   Local:           http://localhost:${PORT}`);
    console.log(`   Android Emulator: http://10.0.2.2:${PORT}`);
    console.log(`   Network (LAN):    http://<YOUR_PC_IP>:${PORT}\n`);
});
