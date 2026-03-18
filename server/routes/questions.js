const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../middleware/auth');
const {
    getCategories,
    deleteQuestion
} = require('../controllers/questions');

const requireJwt = (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-auth-token']) {
        token = req.headers['x-auth-token'];
    }

    if (!token) {
        return res.status(401).json({ msg: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.jwt = decoded;
        next();
    } catch (err) {
        console.error('JWT verify error:', err.message);
        return res.status(401).json({ msg: 'Token is not valid' });
    }
};

// @route   GET api/questions/categories
// @desc    Get all unique question categories
// @access  Private (Teacher, Admin)
router.get('/categories', protect, authorize('Teacher', 'Admin'), getCategories);

// @route   DELETE api/questions/:id
// @desc    Delete a question
// @access  Private (Admin)
router.delete('/:id', requireJwt, protect, authorize('Admin'), deleteQuestion);

module.exports = router;
