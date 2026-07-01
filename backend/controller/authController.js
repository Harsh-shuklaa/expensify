const User = require('../models/User');
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
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
    });
};

// Helper to validate strong password
const isValidPassword = (password) => {
    // Min 8 chars, at least one letter, one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
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

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists',
            });
        }

        // Generate email verification code (6-digit)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create User (Unverified initially)
        const user = await User.create({
            fullname,
            email: email.toLowerCase(),
            password,
            profileImageUrl,
            isVerified: false,
            verificationCode,
            verificationCodeExpires,
        });

        // Send Email (Logged to sent_emails.log in dev)
        await sendEmail({
            to: user.email,
            subject: 'Verify Your Expensify Account',
            text: `Welcome to Expensify! Your email verification code is: ${verificationCode}. It is valid for 24 hours.`,
            html: `<h3>Welcome to Expensify!</h3>
                   <p>Your verification code is: <strong>${verificationCode}</strong></p>
                   <p>This code will expire in 24 hours.</p>`,
        });

        logger.info(`User registered successfully: ${user.email}`);

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please verify your email.',
            email: user.email,
            isVerified: false,
        });
    } catch (error) {
        logger.error('Error registering user:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message,
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

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified',
            });
        }

        if (user.verificationCode !== code || Date.now() > user.verificationCodeExpires) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification code',
            });
        }

        user.isVerified = true;
        user.verificationCode = null;
        user.verificationCodeExpires = null;
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
            message: 'Error verifying email',
            error: error.message,
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

        // Check if email is verified
        if (!user.isVerified) {
            // Regenerate code and resend verification email
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            user.verificationCode = verificationCode;
            user.verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await user.save();

            await sendEmail({
                to: user.email,
                subject: 'Verify Your Expensify Account',
                text: `Your email verification code is: ${verificationCode}. It is valid for 24 hours.`,
                html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>`,
            });

            return res.status(403).json({
                success: false,
                isVerified: false,
                message: 'Your email address is not verified. A verification code has been sent to your email.',
                email: user.email
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
            message: 'Error logging in user',
            error: error.message,
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

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetCode = resetCode;
        user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
        await user.save();

        await sendEmail({
            to: user.email,
            subject: 'Reset Your Expensify Password',
            text: `You requested a password reset. Your 6-digit code is: ${resetCode}. It is valid for 15 minutes.`,
            html: `<p>Your password reset code is: <strong>${resetCode}</strong></p>
                   <p>This code will expire in 15 minutes.</p>`,
        });

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

        if (user.resetCode !== code || Date.now() > user.resetCodeExpires) {
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
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
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
        const user = await User.findById(req.user.id).select('-password');
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
            req.user.id,
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

        const user = await User.findById(req.user.id);
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
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
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
