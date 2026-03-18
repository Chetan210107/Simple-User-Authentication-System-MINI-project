const express = require('express');
const router = express.Router();
const { signup, login, sendOtp, verifyOtp, forgotPassword, resetPassword, getMe, reportSuspiciousActivity, clearCheatedFlag, logout } = require('../controllers/auth');
const { protect } = require('../middleware/auth');

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, getMe);

// @route   POST api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', signup);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);

// @route   POST api/auth/send-otp
// @desc    Send OTP to student email
// @access  Public
router.post('/send-otp', sendOtp);

// @route   POST api/auth/verify-otp
// @desc    Verify OTP and issue token
// @access  Public
router.post('/verify-otp', verifyOtp);

// @route   POST api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   POST api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', resetPassword);

// @route   POST api/auth/suspicious-activity
// @desc    Report suspicious activity during quiz
// @access  Private
router.post('/suspicious-activity', protect, reportSuspiciousActivity);

// @route   PUT api/auth/clear-cheated-flag
// @desc    Clear cheated flag after user acknowledges warning
// @access  Private
router.put('/clear-cheated-flag', protect, clearCheatedFlag);

// @route   POST api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, logout);

module.exports = router;
