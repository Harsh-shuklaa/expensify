const express = require('express');
const { createFeedback } = require('../controller/feedbackController');
const { optionalProtect } = require('../middleware/authMiddleware');
const rateLimiter = require('../middleware/rateLimiter');

const router = express.Router();

// Apply a rate limit of 5 requests per hour on feedback submission to prevent spam/abuse
const feedbackRateLimiter = rateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many feedback submissions. Please try again in an hour.'
});

router.post('/create', optionalProtect, feedbackRateLimiter, createFeedback);

module.exports = router;
