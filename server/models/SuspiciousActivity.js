const mongoose = require('mongoose');

const suspiciousActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    activityType: {
        type: String,
        enum: ['tab_switch', 'window_blur', 'window_minimize'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending_admin', 'blocked', 'approved'],
        default: 'pending_admin'
    },
    adminDecisionTime: Date,
    adminDecisionBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('SuspiciousActivity', suspiciousActivitySchema);
