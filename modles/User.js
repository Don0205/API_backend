const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: false
    },
    isAdmin: {
        type: Boolean,
        required: true
    }
});

// Pre-save middleware to check the company field
UserSchema.pre('save', function(next) {
    if (this.isAdmin && !this.company) {
        return next(new Error('Company is required for admin users'));
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);