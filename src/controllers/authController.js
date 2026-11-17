const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/errors');

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    interests: user.interests
});

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const validateCredentials = (name, email, password) => {
    if (typeof name !== 'string' || !name.trim()) {
        return 'Name is required';
    }

    if (!email.includes('@') || email.startsWith('@') || email.endsWith('@')) {
        return 'A valid email is required';
    }

    if (typeof password !== 'string' || password.length < 8) {
        return 'Password must be at least 8 characters';
    }

    return null;
};

const signToken = (user) => jwt.sign(
    {
        id: user._id,
        role: user.role
    },
    process.env.JWT_SECRET,
    {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
);

exports.register = async (req, res) => {
    try {
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        const email = normalizeEmail(req.body.email);
        const password = req.body.password;
        const error = validateCredentials(name, email, password);

        if (error) {
            return res.status(400).json({ message: error });
        }

        const user = await User.create({
            name,
            email,
            password,
            role: 'user',
            interests: Array.isArray(req.body.interests) ? req.body.interests : []
        });

        res.status(201).json({
            message: 'Registration successful',
            user: publicUser(user)
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.login = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = req.body.password;

        if (!email || typeof password !== 'string') {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        res.json({
            message: 'Login successful',
            token: signToken(user),
            user: publicUser(user)
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json({
            user: publicUser(user)
        });
    } catch (error) {
        sendError(res, error);
    }
};
