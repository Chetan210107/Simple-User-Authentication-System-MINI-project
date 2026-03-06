const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { 
    getUsers,
    updateUser,
    blockUser,
    unblockUser,
    deleteUser,
    kickUser,
    globalQuizStop,
    resetCheatedFlag,
    getSuspiciousActivities,
    deleteSuspiciousActivities,
    deleteSuspiciousActivityRecord
} = require('../controllers/admin');

// @route   GET api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', protect, authorize('Admin'), getUsers);

// @route   PUT api/admin/users/:id
// @desc    Update a user's details
// @access  Private (Admin)
router.put('/users/:id', protect, authorize('Admin'), updateUser);

// @route   PUT api/admin/users/:id/block
// @desc    Block a user
// @access  Private (Admin)
router.put('/users/:id/block', protect, authorize('Admin'), blockUser);

// @route   PUT api/admin/users/:id/unblock
// @desc    Unblock a user
// @access  Private (Admin)
router.put('/users/:id/unblock', protect, authorize('Admin'), unblockUser);

// @route   DELETE api/admin/users/:id
// @desc    Delete a user
// @access  Private (Admin)
router.delete('/users/:id', protect, authorize('Admin'), deleteUser);

// @route   POST api/admin/kick/:id
// @desc    Kick a user
// @access  Private (Admin)
router.post('/kick/:id', protect, authorize('Admin'), kickUser);

// @route   POST api/admin/global-stop
// @desc    Globally stop the quiz for all students
// @access  Private (Admin)
router.post('/global-stop', protect, authorize('Admin'), globalQuizStop);

// @route   GET api/admin/suspicious-activities
// @desc    Get aggregated suspicious activity data
// @access  Private (Admin)
router.get('/suspicious-activities', protect, authorize('Admin'), getSuspiciousActivities);

// @route   DELETE api/admin/suspicious-activities/:userId
// @desc    Delete all suspicious activities for a user
// @access  Private (Admin)
router.delete('/suspicious-activities/:userId', protect, authorize('Admin'), deleteSuspiciousActivities);

// @route   DELETE api/admin/suspicious-activity/:id
// @desc    Delete a specific suspicious activity record
// @access  Private (Admin)
router.delete('/suspicious-activity/:id', protect, authorize('Admin'), deleteSuspiciousActivityRecord);

// @route   PUT api/admin/users/:id/reset-cheat-flag
// @desc    Reset a student's cheat flag
// @access  Private (Admin)
router.put('/users/:id/reset-cheat-flag', protect, authorize('Admin'), resetCheatedFlag);

module.exports = router;
