const axios = require('axios');

const testLogin = async () => {
    console.log('🧪 Testing Login API...\n');

    const credentials = [
        { email: 'admin@school.com', password: 'password123', role: 'Admin' },
        { email: 'staff@school.com', password: 'password123', role: 'staff' },
        { email: 'student@school.com', password: 'password123', role: 'Student' },
    ];

    for (const cred of credentials) {
        try {
            console.log(`Testing ${cred.role}: ${cred.email}`);
            const response = await axios.post('http://localhost:5003/api/auth/login', {
                email: cred.email,
                password: cred.password,
            });

            if (response.data.token) {
                console.log(`✅ ${cred.role} login successful!`);
                console.log(`   User: ${response.data.user.name}`);
                console.log(`   Role: ${response.data.user.role}\n`);
            }
        } catch (error) {
            console.log(`❌ ${cred.role} login failed!`);
            console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
        }
    }
};

testLogin();
