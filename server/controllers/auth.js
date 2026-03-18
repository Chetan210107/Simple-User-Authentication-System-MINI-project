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

        // Students must use OTP login
        if (user.role === 'Student') {
            return res.status(400).json({ msg: 'Students must login with OTP. Please send an OTP to your email.' });
        }

        // Compare password for Teacher/Admin
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

// @desc    Send OTP to student email for login
// @route   POST /api/auth/send-otp
// @access  Public
exports.sendOtp = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Email and password are required to send an OTP' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'No user found with this email' });
        }

        if (user.role !== 'Student') {
            return res.status(400).json({ msg: 'OTP login is only available for students' });
        }

        // First factor: verify student password before sending OTP
        if (password !== user.password) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Generate a 6-digit OTP code
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 5;
        const otpExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

        user.otpCode = otpCode;
        user.otpExpiresAt = otpExpiresAt;

        await user.save();

        const message = `Your login code is: ${otpCode}\n\nThis code will expire in ${expiryMinutes} minutes.`;

        await sendEmail({
            email: user.email,
            subject: 'Your Quiz App Login Code',
            message
        });

        res.json({ msg: 'OTP sent to your email' });
    } catch (err) {
        console.error('sendOtp error:', err);

        // Ensure OTP fields are cleared on failure to avoid reuse
        await User.findOneAndUpdate({ email }, { otpCode: undefined, otpExpiresAt: undefined });

        res.status(500).json({ msg: 'Server error while sending OTP', error: err.message });
    }
};

// @desc    Verify OTP and return JWT token
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ msg: 'Email and OTP are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid email or OTP' });
        }

        if (user.role !== 'Student') {
            return res.status(400).json({ msg: 'OTP login is only available for students' });
        }

        if (!user.otpCode || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            return res.status(400).json({ msg: 'OTP has expired. Please request a new one.' });
        }

        if (otp !== user.otpCode) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        // Clear OTP fields after successful verification
        user.otpCode = undefined;
        user.otpExpiresAt = undefined;
        await user.save();

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
            { expiresIn: '2h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, cheatedFlag: user.cheatedFlag });
            }
        );
    } catch (err) {
        console.error('verifyOtp error:', err);
        res.status(500).json({ msg: 'Server error while verifying OTP', error: err.message });
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
            status: 'pending_admin'
        });
        await activity.save();

        // Get total count for this user
        const count = await SuspiciousActivity.countDocuments({ userId: req.user._id });

        // Notify admins in real-time if threshold exceeded
        const THRESHOLD = 3;
        if (count >= THRESHOLD && req.io) {
            // Do NOT auto-logout: await admin approval instead
            const user = await User.findById(req.user._id);
            req.io.to('Admin').emit('suspiciousAlert', {
                userId: req.user._id,
                userName: `${user.firstName} ${user.lastName}`,
                count,
                activityType,
                timestamp: activity.timestamp,
                status: 'pending_admin',
                activityId: activity._id
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
