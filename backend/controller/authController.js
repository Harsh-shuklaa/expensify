const User = require('../models/User');
const crypto = require('crypto');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/emailService');

// Token durations
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '7d';  // Long-lived refresh token
const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// OTP Constants
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

// Helper to generate JWT Access Token
const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
};

// Helper to generate JWT Refresh Token
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY,
    });
};

// Helper to set Refresh Token Cookie
const setRefreshTokenCookie = (res, token) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });
};

// Helper to validate strong password
const isValidPassword = (password) => {
    // Min 8 chars, at least one letter, one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
};

// Helper to generate OTP verification email HTML
const getOtpEmailHtml = (verificationCode, heading) => {
    return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #7c3aed; text-align: center;">${heading}</h2>
                <p>Please verify your email using the verification code below:</p>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111827; margin: 20px 0;">
                    ${verificationCode}
                </div>
                <p style="color: #ef4444; font-weight: 500;">Note: This verification code is valid for ${OTP_EXPIRY_MINUTES} minutes only.</p>
                <p style="font-size: 12px; color: #6b7280; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                    If you did not request this email, please ignore it.
                </p>
               </div>`;
};

// Register User
exports.registerUser = async (req, res) => {
    try {
        const { fullname, email, password, profileImageUrl } = req.body || {};

        if (!fullname || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields',
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address format',
            });
        }

        // Password strength validation
        if (!isValidPassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long and contain both letters and numbers',
            });
        }

        const normalizedEmail = email.toLowerCase();

        // Check for existing user
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            if (existingUser.isVerified) {
                // Verified user exists — cannot re-register
                return res.status(400).json({
                    success: false,
                    message: 'An account with this email already exists. Please login instead.',
                });
            }

            // Unverified user exists — check if OTP has expired
            if (existingUser.verificationCodeExpires && existingUser.verificationCodeExpires < new Date()) {
                // OTP expired — delete the stale unverified user so they can re-register
                await User.findByIdAndDelete(existingUser._id);
                logger.info(`Cleaned up expired unverified user: ${existingUser.email}`);
            } else {
                // Unverified user with active OTP — prompt to verify or resend
                return res.status(409).json({
                    success: false,
                    message: 'A verification email was already sent to this address. Please check your inbox or use "Resend OTP" on the verification page.',
                    canResendOtp: true,
                    email: normalizedEmail,
                });
            }
        }

        // Generate cryptographically secure 6-digit OTP
        const verificationCode = crypto.randomInt(100000, 1000000).toString();
        const verificationCodeExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Hash the OTP before storing
        const hashedOtp = await bcryptjs.hash(verificationCode, 10);

        // Step 1: Create User (Unverified)
        let user;
        try {
            user = await User.create({
                fullname,
                email: normalizedEmail,
                password,
                profileImageUrl,
                isVerified: false,
                verificationCode: hashedOtp,
                verificationCodeExpires,
                otpAttempts: 0,
            });
        } catch (dbError) {
            logger.error(`Failed to create user record for ${normalizedEmail}: ${dbError.message}`);
            return res.status(500).json({
                success: false,
                message: 'Failed to create account. Please try again.',
            });
        }

        // Step 2: Send verification email — if this fails, DELETE the user (rollback)
        try {
            await sendEmail({
                to: user.email,
                subject: 'Verify Your Expensify Account',
                text: `Welcome to Expensify! Your email verification code is: ${verificationCode}. It is valid for ${OTP_EXPIRY_MINUTES} minutes.`,
                html: getOtpEmailHtml(verificationCode, 'Welcome to Expensify!'),
            });

            logger.info(`User registered and verification email sent: ${user.email}`);

            res.status(201).json({
                success: true,
                message: 'Registration successful! Please check your email for the verification code.',
                email: user.email,
                isVerified: false,
            });
        } catch (emailError) {
            // CRITICAL: Email failed — rollback user creation
            await User.findByIdAndDelete(user._id);
            logger.error(`Registration rolled back for ${user.email}: email delivery failed — ${emailError.message}`);

            return res.status(503).json({
                success: false,
                message: 'Unable to send verification email. Please try again later or contact support.',
                detail: process.env.NODE_ENV !== 'production' ? emailError.message : undefined,
            });
        }
    } catch (error) {
        logger.error('Error registering user:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred during registration. Please try again.',
        });
    }
};

// Verify Email
exports.verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body || {};

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and verification code',
            });
        }

        // Validate OTP format
        if (!/^\d{6}$/.test(code)) {
            return res.status(400).json({
                success: false,
                message: 'Verification code must be exactly 6 digits',
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email. Please sign up first.',
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified. Please login.',
            });
        }

        // Check OTP attempt limit
        if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
            return res.status(429).json({
                success: false,
                message: 'Too many failed verification attempts. Please request a new OTP.',
            });
        }

        // Check OTP expiry
        if (!user.verificationCodeExpires || Date.now() > user.verificationCodeExpires) {
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new one.',
                isExpired: true,
            });
        }

        // Compare hashed OTP
        const isOtpValid = await bcryptjs.compare(code, user.verificationCode);
        if (!isOtpValid) {
            // Increment attempt counter
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            await user.save();

            const remaining = MAX_OTP_ATTEMPTS - user.otpAttempts;
            return res.status(400).json({
                success: false,
                message: `Invalid verification code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
            });
        }

        // OTP is valid — verify the user
        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpires = null;
        user.otpAttempts = 0;
        await user.save();

        logger.info(`User email verified: ${user.email}`);

        // Automatically log them in by generating tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        setRefreshTokenCookie(res, refreshToken);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully!',
            token: accessToken,
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                profileImageUrl: user.profileImageUrl,
                isVerified: true
            }
        });
    } catch (error) {
        logger.error('Error verifying email:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying email. Please try again.',
        });
    }
};

// Login User with Brute-Force Protection
exports.loginUser = async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide email and password',
        });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
            return res.status(423).json({
                success: false,
                message: `Account is temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`,
            });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            // Increment failed attempts
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lock
                logger.warn(`User account locked due to brute force protection: ${user.email}`);
            }
            await user.save();

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Reset locking fields on successful login
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        // Block unverified users — they must verify via the OTP they received during signup
        if (!user.isVerified) {
            logger.warn(`Login attempt by unverified user: ${user.email}`);
            return res.status(403).json({
                success: false,
                isVerified: false,
                email: user.email,
                message: 'Please verify your email first. Check your inbox for the verification code sent during signup.',
            });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        setRefreshTokenCookie(res, refreshToken);

        logger.info(`User logged in: ${user.email}`);

        res.status(200).json({
            success: true,
            id: user._id,
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                profileImageUrl: user.profileImageUrl,
                isVerified: true
            },
            token: accessToken,
        });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in. Please try again.',
        });
    }
};

// Refresh Access Token
exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Refresh Token not found' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        const newAccessToken = generateAccessToken(user._id);
        res.status(200).json({
            success: true,
            token: newAccessToken,
        });
    } catch (error) {
        logger.warn('Invalid refresh token received:', error.message);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token',
        });
    }
};

// Forgot Password Request
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body || {};
        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide email address' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            // Avoid enumerating accounts, return standard message
            return res.status(200).json({
                success: true,
                message: 'If that email address exists, a password reset code has been sent.',
            });
        }

        const resetCode = crypto.randomInt(100000, 1000000).toString();
        const hashedResetCode = await bcryptjs.hash(resetCode, 10);
        user.resetCode = hashedResetCode;
        user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
        await user.save();

        try {
            await sendEmail({
                to: user.email,
                subject: 'Reset Your Expensify Password',
                text: `You requested a password reset. Your 6-digit code is: ${resetCode}. It is valid for 15 minutes.`,
                html: `<p>Your password reset code is: <strong>${resetCode}</strong></p>
                       <p>This code will expire in 15 minutes.</p>`,
            });
        } catch (emailError) {
            // Clear the reset code since email wasn't sent
            user.resetCode = null;
            user.resetCodeExpires = null;
            await user.save();
            logger.error(`Failed to send password reset email to ${user.email}: ${emailError.message}`);
            return res.status(503).json({
                success: false,
                message: 'Unable to send password reset email. Please try again later.',
            });
        }

        logger.info(`Password reset requested for: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'If that email address exists, a password reset code has been sent.',
        });
    } catch (error) {
        logger.error('Error in forgotPassword:', error);
        res.status(500).json({ success: false, message: 'Error initiating password reset' });
    }
};

// Reset Password Submission
exports.resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body || {};
        if (!email || !code || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, verification code, and new password',
            });
        }

        if (!isValidPassword(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long and contain both letters and numbers',
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (!user.resetCode || !user.resetCodeExpires || Date.now() > user.resetCodeExpires) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
        }

        // Compare hashed reset code
        const isCodeValid = await bcryptjs.compare(code, user.resetCode);
        if (!isCodeValid) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset code' });
        }

        user.password = newPassword;
        user.resetCode = null;
        user.resetCodeExpires = null;
        user.failedLoginAttempts = 0; // Unlock if locked
        user.lockUntil = null;
        await user.save();

        logger.info(`Password reset completed successfully for: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Password reset successful! You can now log in.',
        });
    } catch (error) {
        logger.error('Error in resetPassword:', error);
        res.status(500).json({ success: false, message: 'Error resetting password' });
    }
};

// Logout User
exports.logoutUser = async (req, res) => {
    try {
        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
        });
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Error logging out' });
    }
};

// Get User Info
exports.getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        logger.error('Error fetching user info:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user info',
            error: error.message,
        });
    }
};

// Update Profile
exports.updateProfile = async (req, res) => {
    try {
        const { fullname, profileImageUrl } = req.body || {};

        const updateData = {};
        if (fullname) updateData.fullname = fullname.trim();
        if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user,
        });
    } catch (error) {
        logger.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message,
        });
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body || {};

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password',
            });
        }

        if (!isValidPassword(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters long and contain both letters and numbers',
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        user.password = newPassword;
        await user.save();

        logger.info(`Password changed for: ${user.email}`);

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        });
    } catch (error) {
        logger.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message,
        });
    }
};

// GDPR Compliance: Export User Data in JSON
exports.exportUserData = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).select('-password -verificationCode -resetCode');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Fetch user data (excluding soft-deleted)
        const incomes = await Income.find({ userId, isDeleted: { $ne: true } }).sort({ date: -1 });
        const expenses = await Expense.find({ userId, isDeleted: { $ne: true } }).sort({ date: -1 });

        const exportedData = {
            profile: {
                fullname: user.fullname,
                email: user.email,
                profileImageUrl: user.profileImageUrl,
                createdAt: user.createdAt,
            },
            incomes: incomes.map(item => ({
                source: item.source,
                amount: item.amount,
                date: item.date,
                icon: item.icon
            })),
            expenses: expenses.map(item => ({
                category: item.category,
                amount: item.amount,
                date: item.date,
                icon: item.icon
            })),
            exportedAt: new Date().toISOString()
        };

        logger.info(`GDPR: User data exported for ${user.email}`);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=expensify_data_export.json');
        res.send(JSON.stringify(exportedData, null, 2));
    } catch (error) {
        logger.error('Error exporting user data:', error);
        res.status(500).json({ success: false, message: 'Failed to export your data' });
    }
};

// GDPR Compliance: Delete Account Permenantly
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        const email = req.user.email;

        // Perform hard delete of all related records
        await Income.deleteMany({ userId });
        await Expense.deleteMany({ userId });
        await User.findByIdAndDelete(userId);

        logger.warn(`GDPR: Account permanently deleted for ${email}`);

        // Clear session cookies
        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax',
        });

        res.status(200).json({
            success: true,
            message: 'Your account and all related data have been permanently deleted.'
        });
    } catch (error) {
        logger.error('Error deleting account:', error);
        res.status(500).json({ success: false, message: 'Failed to permanently delete your account' });
    }
};

// Resend Verification OTP
exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body || {};

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email address',
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this email. Please sign up first.',
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified. Please login.',
            });
        }

        // Generate cryptographically secure 6-digit OTP
        const verificationCode = crypto.randomInt(100000, 1000000).toString();
        const verificationCodeExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Hash OTP before storing
        const hashedOtp = await bcryptjs.hash(verificationCode, 10);

        user.verificationCode = hashedOtp;
        user.verificationCodeExpires = verificationCodeExpires;
        user.otpAttempts = 0; // Reset attempt counter on resend
        await user.save();

        // Send Email — throw on failure
        try {
            await sendEmail({
                to: user.email,
                subject: 'Verify Your Expensify Account',
                text: `Your new Expensify verification code is: ${verificationCode}. It is valid for ${OTP_EXPIRY_MINUTES} minutes.`,
                html: getOtpEmailHtml(verificationCode, 'Verify Your Expensify Account'),
            });

            logger.info(`Verification OTP resent successfully to: ${user.email}`);

            res.status(200).json({
                success: true,
                message: 'A new verification code has been sent to your email.',
            });
        } catch (emailError) {
            logger.error(`Failed to resend OTP to ${user.email}: ${emailError.message}`);
            return res.status(503).json({
                success: false,
                message: 'Unable to send verification email. Please try again later.',
            });
        }
    } catch (error) {
        logger.error('Error resending OTP:', error);
        res.status(500).json({
            success: false,
            message: 'An unexpected error occurred. Please try again.',
        });
    }
};
