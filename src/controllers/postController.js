const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const { getPagination, buildPagination } = require('../utils/pagination');
const { sendError } = require('../utils/errors');

const toObjectId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
    }

    const objectId = new mongoose.Types.ObjectId(id);

    if (objectId.toString() !== String(id).toLowerCase()) {
        return null;
    }

    return objectId;
};

exports.createPost = async (req, res) => {
    try {
        const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
        const content = req.body.content;

        if (!title || typeof content !== 'string' || !content.trim()) {
            return res.status(400).json({
                message: 'Title and content are required'
            });
        }

        const post = await Post.create({
            user: req.user._id,
            title,
            content
        });

        res.status(201).json({
            message: 'Post created successfully',
            post
        });
    } catch (error) {
        sendError(res, error);
    }
};

// One aggregation: posts for a user, joined with $lookup, then paginated.
exports.getUserPosts = async (req, res) => {
    try {
        const userId = toObjectId(req.params.userId);

        if (!userId) {
            return res.status(400).json({
                message: 'Invalid user id'
            });
        }

        const { page, limit, skip } = getPagination(req.query);

        const rows = await User.aggregate([
            { $match: { _id: userId } },
            {
                $lookup: {
                    from: 'posts',
                    let: { ownerId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$user', '$$ownerId'] }
                            }
                        },
                        { $sort: { createdAt: -1, _id: -1 } },
                        {
                            $facet: {
                                metadata: [{ $count: 'total' }],
                                data: [
                                    { $skip: skip },
                                    { $limit: limit },
                                    {
                                        $project: {
                                            title: 1,
                                            content: 1,
                                            user: 1,
                                            createdAt: 1,
                                            updatedAt: 1
                                        }
                                    }
                                ]
                            }
                        }
                    ],
                    as: 'postsResult'
                }
            },
            {
                $project: {
                    name: 1,
                    postsResult: { $arrayElemAt: ['$postsResult', 0] }
                }
            }
        ]);

        if (!rows.length) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const bucket = rows[0].postsResult || { data: [], metadata: [] };
        const total = bucket.metadata && bucket.metadata[0] ? bucket.metadata[0].total : 0;

        res.json({
            user: {
                id: rows[0]._id,
                name: rows[0].name
            },
            data: bucket.data || [],
            pagination: buildPagination(total, page, limit)
        });
    } catch (error) {
        sendError(res, error);
    }
};
