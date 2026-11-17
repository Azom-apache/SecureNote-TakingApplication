const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
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
    timestamps: true
});

// A single note read is served by MongoDB's default _id index.
// A user listing their own notes, newest first, with stable pagination.
noteSchema.index({ user: 1, createdAt: -1, _id: -1 });

// An admin listing every note, newest first, with stable pagination.
noteSchema.index({ createdAt: -1, _id: -1 });

module.exports = mongoose.model('Note', noteSchema);
