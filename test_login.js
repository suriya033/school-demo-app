const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testLogin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const User = require('./backend/models/User');
        
        // List all users
        const users = await User.find({}).select('name email role staffClass studentClass');
        console.log('📋 All Users in Database:');
        console.log('─'.repeat(80));
        users.forEach(u => {
            console.log(`Name: ${u.name}`);
            console.log(`Email: ${u.email}`);
            console.log(`Role: ${u.role}`);
            console.log(`Staff Class: ${u.staffClass || 'None'}`);
            console.log(`Student Class: ${u.studentClass || 'None'}`);
            console.log('─'.repeat(80));
        });

        // Test login for a staff member
        console.log('\n🔐 Testing Staff Login...');
        const testEmail = 'staff@school.com';
        const testPassword = 'password123';
        
        const staffUser = await User.findOne({ email: testEmail });
        if (staffUser) {
            console.log(`Found user: ${staffUser.name}`);
            const isMatch = await bcrypt.compare(testPassword, staffUser.password);
            console.log(`Password match: ${isMatch ? '✅ YES' : '❌ NO'}`);
            
            if (isMatch) {
                console.log('\n✅ Login would succeed with:');
                console.log(JSON.stringify({
                    id: staffUser.id,
                    name: staffUser.name,
                    email: staffUser.email,
                    role: staffUser.role,
                    staffClass: staffUser.staffClass,
                    studentClass: staffUser.studentClass
                }, null, 2));
            }
        } else {
            console.log(`❌ User not found: ${testEmail}`);
        }

        await mongoose.connection.close();
        console.log('\n✅ Test completed');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

testLogin();
