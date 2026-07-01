const logger = require('../utils/logger');

// In-memory store to keep track of requests by key (IP)
const store = new Map();

// Periodic cleanup of expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
        if (now > record.resetTime) {
            store.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * Custom Rate Limiter Middleware Creator
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 mins)
 * @param {number} options.max - Max number of requests allowed in the windowMs window (default: 100)
 * @param {string} options.message - Error message to return (default: Too many requests)
 */
const rateLimiter = (options = {}) => {
    const windowMs = options.windowMs || 15 * 60 * 1000;
    const max = options.max || 100;
    const message = options.message || 'Too many requests from this IP, please try again later.';

    return (req, res, next) => {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
        const route = req.originalUrl || req.url;
        const key = `${ip}:${route}`;
        const now = Date.now();

        let record = store.get(key);

        if (!record) {
            // First request in the time window
            record = {
                count: 1,
                resetTime: now + windowMs
            };
            store.set(key, record);
        } else {
            // Check if window is expired
            if (now > record.resetTime) {
                record.count = 1;
                record.resetTime = now + windowMs;
            } else {
                record.count += 1;
            }
        }

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
        res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

        if (record.count > max) {
            logger.warn(`Rate limit exceeded for IP: ${ip} on route: ${route}`, { count: record.count, limit: max });
            return res.status(429).json({
                success: false,
                message
            });
        }

        next();
    };
};

module.exports = rateLimiter;
