const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: true
    },
    role: {
        type: String,
        enum: ['Student', 'Teacher', 'Admin'],
        default: 'Student'
    },
    classDivision: {
        type: String,
        required: function() {
            return this.role === 'Student';
        }
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    otpCode: String,
    otpExpiresAt: Date,
    isBlocked: {
        type: Boolean,
        default: false
    }
    ,
    cheatedFlag: {
        type: Boolean,
        default: false
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
