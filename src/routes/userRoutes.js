const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

const {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    groupByInterests
} = require('../controllers/userController');

router.use(protect);

router.get('/interests', adminOnly, groupByInterests);
router.get('/', adminOnly, getUsers);
router.post('/', adminOnly, createUser);
router.get('/:id', adminOnly, getUser);
router.put('/:id', adminOnly, updateUser);
router.delete('/:id', adminOnly, deleteUser);

module.exports = router;
