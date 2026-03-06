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
    }
});

module.exports = mongoose.model('SuspiciousActivity', suspiciousActivitySchema);
