const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    content: {
        type: String,
        required: true
    }

}, {
    timestamps: true,
    collection: 'posts'
});

// $lookup of one user's posts, newest first, with pagination.
postSchema.index({ user: 1, createdAt: -1, _id: -1 });

module.exports = mongoose.model('Post', postSchema);
