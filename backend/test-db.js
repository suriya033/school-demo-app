const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI;
console.log('Testing connection to:', uri.replace(/:([^:@]+)@/, ':****@')); // Hide password

mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4,
})
    .then(() => {
        console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ ERROR: Connection failed');
        console.error('Name:', err.name);
        console.error('Message:', err.message);
        if (err.reason) console.error('Reason:', err.reason);

        if (err.message.includes('bad auth')) {
            console.log('\n💡 DIAGNOSIS: Authentication failed. Check username and password.');
        } else if (err.message.includes('ETIMEDOUT')) {
            console.log('\n💡 DIAGNOSIS: Network timeout. Your IP is likely blocked.');
            console.log('   ACTION: Go to MongoDB Atlas -> Network Access -> Add IP Address -> Allow Access from Anywhere');
        } else if (err.message.includes('ENOTFOUND')) {
            console.log('\n💡 DIAGNOSIS: DNS Error. Cannot resolve hostname.');
            console.log('   ACTION: Check your internet connection or DNS settings.');
        }

        process.exit(1);
    });
