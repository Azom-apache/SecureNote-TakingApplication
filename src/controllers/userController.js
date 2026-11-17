const User = require('../models/User');
const Note = require('../models/Note');
const Post = require('../models/Post');
const { getPagination, buildPagination } = require('../utils/pagination');
const { sendError } = require('../utils/errors');

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    interests: user.interests
});

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const validateNewUser = (body) => {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = normalizeEmail(body.email);
    const password = body.password;

    if (!name) {
        return { error: 'Name is required' };
    }

    if (!email.includes('@') || email.startsWith('@') || email.endsWith('@')) {
        return { error: 'A valid email is required' };
    }

    if (typeof password !== 'string' || password.length < 8) {
        return { error: 'Password must be at least 8 characters' };
    }

    if (body.role !== undefined && !['user', 'admin'].includes(body.role)) {
        return { error: 'Role must be user or admin' };
    }

    if (body.interests !== undefined && !Array.isArray(body.interests)) {
        return { error: 'Interests must be an array' };
    }

    return {
        value: {
            name,
            email,
            password,
            role: body.role || 'user',
            interests: Array.isArray(body.interests) ? body.interests : []
        }
    };
};

exports.getUsers = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);

        const [users, total] = await Promise.all([
            User.find()
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments()
        ]);

        res.json({
            data: users.map(publicUser),
            pagination: buildPagination(total, page, limit)
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

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

exports.createUser = async (req, res) => {
    try {
        const { error, value } = validateNewUser(req.body);

        if (error) {
            return res.status(400).json({ message: error });
        }

        const user = await User.create(value);

        res.status(201).json({
            message: 'User created successfully',
            user: publicUser(user)
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('+password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        if (req.body.name !== undefined) {
            if (typeof req.body.name !== 'string' || !req.body.name.trim()) {
                return res.status(400).json({ message: 'Name is required' });
            }
            user.name = req.body.name.trim();
        }

        if (req.body.email !== undefined) {
            const email = normalizeEmail(req.body.email);
            if (!email.includes('@') || email.startsWith('@') || email.endsWith('@')) {
                return res.status(400).json({ message: 'A valid email is required' });
            }
            user.email = email;
        }

        if (req.body.role !== undefined) {
            if (!['user', 'admin'].includes(req.body.role)) {
                return res.status(400).json({ message: 'Role must be user or admin' });
            }
            user.role = req.body.role;
        }

        if (req.body.interests !== undefined) {
            if (!Array.isArray(req.body.interests)) {
                return res.status(400).json({ message: 'Interests must be an array' });
            }
            user.interests = req.body.interests;
        }

        if (req.body.password !== undefined && req.body.password !== '') {
            if (typeof req.body.password !== 'string' || req.body.password.length < 8) {
                return res.status(400).json({
                    message: 'Password must be at least 8 characters'
                });
            }
            user.password = req.body.password;
        }

        await user.save();

        res.json({
            message: 'User updated successfully',
            user: publicUser(user)
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        await Promise.all([
            Note.deleteMany({ user: user._id }),
            Post.deleteMany({ user: user._id })
        ]);

        res.json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        sendError(res, error);
    }
};

// One aggregation only: users grouped by each interest, then paginated.
exports.groupByInterests = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);

        const [result] = await User.aggregate([
            {
                $match: {
                    interests: { $gte: '' }
                }
            },
            { $unwind: '$interests' },
            {
                $group: {
                    _id: '$interests',
                    count: { $sum: 1 },
                    users: {
                        $push: {
                            _id: '$_id',
                            name: '$name',
                            email: '$email'
                        }
                    }
                }
            },
            { $sort: { _id: 1 } },
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $project: {
                                _id: 0,
                                interest: '$_id',
                                count: 1,
                                users: 1
                            }
                        }
                    ]
                }
            }
        ]);

        const total = result.metadata[0] ? result.metadata[0].total : 0;

        res.json({
            data: result.data,
            pagination: buildPagination(total, page, limit)
        });
    } catch (error) {
        sendError(res, error);
    }
};
