const Note = require('../models/Note');
const { getPagination, buildPagination } = require('../utils/pagination');
const { sendError } = require('../utils/errors');

const listSort = { createdAt: -1, _id: -1 };

const requireNoteFields = (body, { partial } = {}) => {
    const updates = {};

    if (body.title !== undefined) {
        if (typeof body.title !== 'string' || !body.title.trim()) {
            return { error: 'Title is required' };
        }
        updates.title = body.title.trim();
    }

    if (body.content !== undefined) {
        if (typeof body.content !== 'string' || !body.content.trim()) {
            return { error: 'Content is required' };
        }
        updates.content = body.content;
    }

    if (!partial && (!updates.title || updates.content === undefined)) {
        return { error: 'Title and content are required' };
    }

    if (partial && Object.keys(updates).length === 0) {
        return { error: 'Nothing to update' };
    }

    return { updates };
};

exports.createNote = async (req, res) => {
    try {
        const { error, updates } = requireNoteFields(req.body);

        if (error) {
            return res.status(400).json({ message: error });
        }

        const note = await Note.create({
            user: req.user._id,
            title: updates.title,
            content: updates.content
        });

        res.status(201).json({
            message: 'Note created successfully',
            note
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.getNotes = async (req, res) => {
    try {
        const { page, limit, skip } = getPagination(req.query);
        const filter = req.user.role === 'admin'
            ? {}
            : { user: req.user._id };

        const [notes, total] = await Promise.all([
            Note.find(filter)
                .populate('user', 'name email')
                .sort(listSort)
                .skip(skip)
                .limit(limit),
            Note.countDocuments(filter)
        ]);

        res.json({
            data: notes,
            pagination: buildPagination(total, page, limit)
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.getNote = async (req, res) => {
    try {
        const filter = { _id: req.params.id };

        if (req.user.role !== 'admin') {
            filter.user = req.user._id;
        }

        const note = await Note.findOne(filter).populate('user', 'name email');

        if (!note) {
            return res.status(404).json({
                message: 'Note not found'
            });
        }

        res.json({ note });
    } catch (error) {
        sendError(res, error);
    }
};

exports.updateNote = async (req, res) => {
    try {
        const { error, updates } = requireNoteFields(req.body, { partial: true });

        if (error) {
            return res.status(400).json({ message: error });
        }

        const note = await Note.findOneAndUpdate(
            {
                _id: req.params.id,
                user: req.user._id
            },
            updates,
            {
                returnDocument: 'after',
                runValidators: true
            }
        );

        if (!note) {
            return res.status(404).json({
                message: 'Note not found'
            });
        }

        res.json({
            message: 'Note updated successfully',
            note
        });
    } catch (error) {
        sendError(res, error);
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!note) {
            return res.status(404).json({
                message: 'Note not found'
            });
        }

        res.json({
            message: 'Note deleted successfully'
        });
    } catch (error) {
        sendError(res, error);
    }
};
