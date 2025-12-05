const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Register User
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            name,
            email,
            password: hashedPassword,
            role,
        });

        await user.save();

        // Create token
        const payload = {
            user: {
                id: user.id,
                role: user.role,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret_key_123',
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.log('⚠️  MongoDB not connected, using fallback authentication');

            // Fallback credentials (for development only)
            const fallbackUsers = {
                'admin@school.com': { id: '1', name: 'Admin User', role: 'Admin', password: 'admin123' },
                'staff@school.com': { id: '2', name: 'John staff', role: 'staff', password: 'password123' },
                'student@school.com': { id: '3', name: 'Jane Student', role: 'Student', password: 'password123' },
            };

            const fallbackUser = fallbackUsers[email];
            if (!fallbackUser || fallbackUser.password !== password) {
                return res.status(400).json({ message: 'Invalid Credentials' });
            }

            // Create token
            const payload = {
                user: {
                    id: fallbackUser.id,
                    role: fallbackUser.role,
                },
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET || 'fallback_secret_key_123',
                { expiresIn: '1d' },
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        token,
                        user: {
                            id: fallbackUser.id,
                            name: fallbackUser.name,
                            email: email,
                            role: fallbackUser.role
                        }
                    });
                }
            );
            return;
        }

        // Normal MongoDB authentication
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Create token
        const payload = {
            user: {
                id: user.id,
                role: user.role,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'fallback_secret_key_123',
            { expiresIn: '1d' }, // Longer expiration for mobile app
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        studentClass: user.studentClass
                    }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
