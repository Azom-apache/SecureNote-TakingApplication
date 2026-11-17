const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
        select: false
    },

    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    interests: {
        type: [{
            type: String,
            trim: true,
            lowercase: true
        }],
        default: []
    }

}, {
    timestamps: true
});

// Profile reads are served by MongoDB's default _id index.
// Login and registration look up a user by email.
userSchema.index({ email: 1 }, { unique: true });

// Admin user list, newest first, with a stable pagination order.
userSchema.index({ createdAt: -1, _id: -1 });

// Group-by-interests aggregation matches this multikey field.
userSchema.index({ interests: 1 });

userSchema.pre('save', function () {
    if (!Array.isArray(this.interests)) {
        return;
    }

    this.interests = [...new Set(
        this.interests
            .map((interest) => String(interest).trim().toLowerCase())
            .filter(Boolean)
    )];
});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
});

userSchema.set('toJSON', {
    transform(_doc, ret) {
        delete ret.password;
        return ret;
    }
});

module.exports = mongoose.model('User', userSchema);
