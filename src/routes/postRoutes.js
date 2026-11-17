const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
    createPost,
    getUserPosts
} = require('../controllers/postController');

router.get('/user/:userId', getUserPosts);
router.post('/', protect, createPost);

module.exports = router;
