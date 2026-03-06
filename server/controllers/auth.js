const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');
const SuspiciousActivity = require('../models/SuspiciousActivity');

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        // req.user is already set by the protect middleware (without password)
        res.json(req.user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.signup = async (req, res) => {
    const { firstName, lastName, email, password, role, classDivision, invitationCode } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Check invitation code for Teacher and Admin roles
        if (role === 'Teacher' || role === 'Admin') {
            const code = role === 'Teacher' ? process.env.TEACHER_CODE : process.env.ADMIN_CODE;
            if (invitationCode !== code) {
                return res.status(400).json({ msg: 'Invalid invitation code' });
            }
        }

        user = new User({
            firstName,
            lastName,
            email,
            password,
            role,
            classDivision
        });

        await user.save();

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return res.status(403).json({ msg: 'Your account has been blocked. Contact administrator.' });
        }

        // Compare password
        const isMatch = password === user.password;
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Return jsonwebtoken
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: 3600 },
            (err, token) => {
                if (err) throw err;
                res.json({ token, cheatedFlag: user.cheatedFlag });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Generate and hash password reset token
        const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase();

        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 300000; // 5 minutes

        await user.save();

        // Send email
        const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please use the following OTP to reset your password: ${resetToken}`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Password reset OTP',
                message
            });

            res.status(200).json({ msg: 'Email sent' });
        } catch (err) {
            console.error(err);
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;

            await user.save();

            return res.status(500).send('Email could not be sent');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.resetPassword = async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ msg: 'Passwords do not match' });
    }

    try {
        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid or expired token' });
        }

        // Set new password
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();

        res.status(200).json({ msg: 'Password reset successful' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Report suspicious activity during quiz
// @route   POST /api/auth/suspicious-activity
// @access  Private (Students only)
exports.reportSuspiciousActivity = async (req, res) => {
    const { activityType } = req.body;

    try {
        // Only accept reports from Student users - reject Admin/Teacher submissions
        if (req.user.role !== 'Student') {
            return res.status(403).json({ msg: 'Only students can be subject to anti-cheat monitoring' });
        }

        const activity = new SuspiciousActivity({
            userId: req.user._id,
            activityType,
        });
        await activity.save();

        // Get total count for this user
        const count = await SuspiciousActivity.countDocuments({ userId: req.user._id });

        // Notify admins in real-time if threshold exceeded
        const THRESHOLD = 3;
        if (count >= THRESHOLD && req.io) {
            await User.findByIdAndUpdate(req.user._id, { cheatedFlag: true });

            const socketId = req.userSockets && req.userSockets[req.user._id.toString()];
            if (socketId) {
                req.io.to(socketId).emit('forceLogout', { msg: 'You have been automatically logged out due to suspicious activity.' });
            }

            req.io.to('Admin').emit('suspiciousAlert', {
                userId: req.user._id,
                userName: `${req.user.firstName} ${req.user.lastName}`,
                count,
                activityType,
                timestamp: activity.timestamp,
            });
        }

        res.json({ msg: 'Activity recorded', count });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Clear cheated flag after user acknowledges warning
// @route   PUT /api/auth/clear-cheated-flag
// @access  Private
exports.clearCheatedFlag = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ 
                msg: 'User not authenticated',
                success: false 
            });
        }
        
        console.log('Clearing cheated flag for user:', req.user._id);
        
        const result = await User.findByIdAndUpdate(
            req.user._id, 
            { cheatedFlag: false },
            { new: true }
        );
        
        if (!result) {
            return res.status(404).json({ 
                msg: 'User not found',
                success: false 
            });
        }
        
        console.log('Successfully cleared cheated flag for user:', req.user._id);
        
        res.json({ 
            msg: 'Cheated flag cleared',
            success: true,
            user: {
                id: result._id,
                firstName: result.firstName,
                cheatedFlag: result.cheatedFlag
            }
        });
    } catch (err) {
        console.error('Error clearing cheated flag:', err);
        res.status(500).json({ 
            msg: 'Server error',
            error: err.message,
            success: false 
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    try {
        // Token is already validated by protect middleware
        // Just return success - client will handle redirect
        res.json({ msg: 'Logged out successfully', success: true });
    } catch (err) {
        console.error('Error logging out:', err.message);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};
