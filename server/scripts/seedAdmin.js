require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

const seedAdmin = async () => {
    try {
        const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

        if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error('Admin environment variables are missing');
        }

        if (ADMIN_PASSWORD.length < 12) {
            throw new Error('Admin password must contain at least 12 characters');
        }

        await connectDB();

        const existingAdmin = await User.findOne({
            email: ADMIN_EMAIL.toLowerCase().trim(),
        });

        if (existingAdmin) {
            if (existingAdmin.role !== 'admin') {
                throw new Error('This email already belongs to a non-admin account');
            }

            console.log('Admin account already exists.');
            return;
        }

        await User.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin',
        });

        console.log('Administrator account created successfully.');
    } catch (error) {
        console.error('Admin seed failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

seedAdmin();