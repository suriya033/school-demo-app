const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('CONNECTED');
        const User = require('./backend/models/User');
        const users = await User.find({}, 'email role');
        console.log('USERS:', JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}
check();
