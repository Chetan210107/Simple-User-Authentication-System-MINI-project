const User = require('../models/User');
const SuspiciousActivity = require('../models/SuspiciousActivity');

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { firstName, lastName } = req.body;

    try {
        let user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;

        await user.save();

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.blockUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({ msg: 'User blocked successfully', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.unblockUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({ msg: 'User unblocked successfully', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Cascade delete: delete all suspicious activity records for this user
        await SuspiciousActivity.deleteMany({ userId: req.params.id });

        res.json({ msg: 'User deleted successfully and all associated records removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.kickUser = async (req, res) => {
    const { id: userIdToKick } = req.params;
    const { io, userSockets } = req;

    try {
        const socketId = userSockets[userIdToKick];

        if (socketId) {
            io.to(socketId).emit('kicked', { msg: 'You have been kicked by an administrator.' });
            
            // Optionally, remove the user from the mapping immediately
            delete userSockets[userIdToKick];

            res.json({ msg: `User ${userIdToKick} has been kicked.` });
        } else {
            res.status(404).json({ msg: 'User is not currently connected.' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getSuspiciousActivities = async (req, res) => {
    try {
        // Aggregate suspicious activities per user
        const activities = await SuspiciousActivity.aggregate([
            {
                $group: {
                    _id: '$userId',
                    count: { $sum: 1 },
                    lastTimestamp: { $max: '$timestamp' },
                    lastActivityType: { $last: '$activityType' },
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    userId: '$_id',
                    userName: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
                    email: '$user.email',
                    count: 1,
                    lastTimestamp: 1,
                    lastActivityType: 1,
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.json(activities);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.deleteSuspiciousActivities = async (req, res) => {
    try {
        const { userId } = req.params;

        // Delete all suspicious activities for the user
        await SuspiciousActivity.deleteMany({ userId });

        res.json({ msg: 'Suspicious activities deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.deleteSuspiciousActivityRecord = async (req, res) => {
    try {
        const { id } = req.params;

        // Delete the specific suspicious activity record by _id
        const result = await SuspiciousActivity.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ msg: 'Suspicious activity record not found' });
        }

        res.json({ msg: 'Suspicious activity record deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.globalQuizStop = async (req, res) => {
    const { io } = req;
    try {
        io.to('Student').emit('globalStop', { msg: 'The quiz has been ended by an administrator.' });
        res.json({ msg: 'Global stop signal sent to all students.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.resetCheatedFlag = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { cheatedFlag: false }, { new: true });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({ msg: 'Cheat flag reset successfully', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

// @desc    Admin approval/block decision for suspicious activity
// @route   PUT /api/admin/suspicious-activities/:activityId/decide
// @access  Private (Admin only)
exports.decideSuspiciousActivity = async (req, res) => {
    const { activityId } = req.params;
    const { decision } = req.body; // 'block' or 'approve'
    const { io, userSockets } = req;

    try {
        const activity = await SuspiciousActivity.findById(activityId);
        if (!activity) {
            return res.status(404).json({ msg: 'Activity not found' });
        }

        const studentId = activity.userId.toString();
        const studentSocketId = userSockets && userSockets[studentId];

        if (decision === 'block') {
            // Block student
            await User.findByIdAndUpdate(studentId, { isBlocked: true });
            await SuspiciousActivity.findByIdAndUpdate(activityId, {
                status: 'blocked',
                adminDecisionTime: new Date(),
                adminDecisionBy: req.user._id
            });

            // Notify student of block
            if (studentSocketId && io) {
                io.to(studentSocketId).emit('forceLogout', {
                    msg: 'Your account has been blocked due to violation of academic integrity policy.'
                });
            }

            res.json({ msg: 'Student blocked successfully' });
        } else if (decision === 'approve') {
            // Approve continuation
            await SuspiciousActivity.findByIdAndUpdate(activityId, {
                status: 'approved',
                adminDecisionTime: new Date(),
                adminDecisionBy: req.user._id
            });

            // Notify student of approval
            if (studentSocketId && io) {
                io.to(studentSocketId).emit('suspicionApproved', {
                    msg: 'Admin has approved your continuation. Proceed with the quiz.'
                });
            }

            res.json({ msg: 'Student approved to continue' });
        } else {
            res.status(400).json({ msg: 'Invalid decision. Must be "block" or "approve"' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
