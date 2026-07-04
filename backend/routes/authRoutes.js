const express = require('express');
const { Protect } = require('../middleware/authMiddleware');
const rateLimiter = require('../middleware/rateLimiter');
const upload = require('../middleware/uploadMiddleware');

const {
    registerUser,
    loginUser,
    verifyEmail,
    resendOTP,
    forgotPassword,
    resetPassword,
    refreshToken,
    logoutUser,
    getUserInfo,
    updateProfile,
    changePassword,
    exportUserData,
    deleteAccount
} = require('../controller/authController');

const router = express.Router();

// Define specific rate limiters for security
const signupLimiter = rateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many accounts created from this IP. Please try again after an hour.'
});

const loginLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many login attempts. Please try again after 15 minutes.'
});

const verifyEmailLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: 'Too many verification attempts. Please try again after 15 minutes.'
});

const resendOtpLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    message: 'Too many OTP resend requests. Please try again after 15 minutes.'
});

const forgotPasswordLimiter = rateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many password reset requests. Please try again after an hour.'
});

const resetPasswordLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many password resets attempted. Please try again after 15 minutes.'
});

// Authentication routes
router.post('/register', signupLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/verify-email', verifyEmailLimiter, verifyEmail);
router.post('/resend-otp', resendOtpLimiter, resendOTP);
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPassword);
router.post('/refresh-token', refreshToken);
router.post('/logout', logoutUser);

// User Profile routes
router.get('/getUser', Protect, getUserInfo);
router.patch('/profile', Protect, updateProfile);
router.patch('/change-password', Protect, changePassword);

// Image Upload
router.post('/upload-image', Protect, upload.single('profileImage'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.status(200).json({
        message: 'File uploaded successfully',
        imageUrl,
    });
});

// GDPR & Compliance routes
router.get('/export-data', Protect, exportUserData);
router.delete('/delete-account', Protect, deleteAccount);

module.exports = router;
