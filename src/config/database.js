const mongoose = require('mongoose');

const User = require('../models/User');
const Note = require('../models/Note');
const Post = require('../models/Post');

const seedAdmin = async () => {
    const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        return;
    }

    const existing = await User.findOne({ email }).select('+password');

    if (!existing) {
        await User.create({
            name: process.env.ADMIN_NAME || 'Admin',
            email,
            password,
            role: 'admin',
            interests: ['administration']
        });
        console.log('Default admin account created');
        return;
    }

    const alreadyHashed = String(existing.password || '').startsWith('$2');

    if (existing.role === 'admin' && alreadyHashed) {
        return;
    }

    existing.role = 'admin';

    if (!alreadyHashed) {
        existing.password = password;
    }

    await existing.save();
    console.log('Default admin account updated');
};

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected Successfully');

        await Promise.all([
            User.syncIndexes(),
            Note.syncIndexes(),
            Post.syncIndexes()
        ]);

        await seedAdmin();
    } catch (error) {
        console.error('MongoDB Connection Failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
