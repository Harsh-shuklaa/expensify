const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Strict protection middleware: Blocks requests without a valid token
exports.Protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                isVerified: false,
                message: 'Please verify your email address to access this resource.'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        logger.warn('Token authentication failed:', { error: error.message });
        res.status(401).json({
            success: false,
            message: 'Not authorized, token failed',
        });
    }
};

// Optional protection middleware: Identifies user if token is present, does not block if missing
exports.optionalProtect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
            req.user = user;
        }
        next();
    } catch (error) {
        // Soft fail - do not crash or block, just proceed as anonymous
        next();
    }
};
