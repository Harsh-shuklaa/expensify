const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const UserSchema = mongoose.Schema({
    fullname: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    profileImageUrl: {
        type: String,
        default: null,
    },
    // Email Verification fields
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationCode: {
        type: String,
        default: null,
    },
    verificationCodeExpires: {
        type: Date,
        default: null,
    },
    // OTP brute-force protection
    otpAttempts: {
        type: Number,
        default: 0,
    },
    // Password Reset fields
    resetCode: {
        type: String,
        default: null,
    },
    resetCodeExpires: {
        type: Date,
        default: null,
    },
    // Brute-force account lock fields
    failedLoginAttempts: {
        type: Number,
        default: 0,
    },
    lockUntil: {
        type: Date,
        default: null,
    }
}, {
    timestamps: true,
});

// hash password before saving 
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcryptjs.hash(this.password, 12); // Upgraded to 12 salt rounds
    next();
});

// compare password 
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcryptjs.compare(candidatePassword, this.password);
};

// TTL index: auto-delete unverified users whose OTP has expired
// MongoDB's TTL monitor runs every ~60 seconds and will delete matching documents
// Only applies to documents where isVerified is false (partial filter expression)
UserSchema.index(
    { verificationCodeExpires: 1 },
    {
        expireAfterSeconds: 0,
        partialFilterExpression: { isVerified: false }
    }
);

module.exports = mongoose.model('User', UserSchema);
