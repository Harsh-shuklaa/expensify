const Feedback = require('../models/Feedback');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/emailService');

exports.createFeedback = async (req, res) => {
    try {
        const { type, fullname, email, subject, message } = req.body || {};

        if (!type || !fullname || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate type
        const allowedTypes = ['contact', 'bug', 'feedback', 'feature'];
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid feedback type'
            });
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address format'
            });
        }

        const userId = req.user ? req.user._id : null;

        const feedback = await Feedback.create({
            userId,
            type,
            fullname,
            email: email.toLowerCase(),
            subject,
            message,
            status: 'new'
        });

        logger.info(`Feedback submitted by ${email}: [${type}] ${subject}`);

        // Notify support/admin (simulated email)
        await sendEmail({
            to: 'support@expensify.com',
            subject: `[New ${type.toUpperCase()}] ${subject}`,
            text: `Feedback ID: ${feedback._id}\nFrom: ${fullname} (${email})\nMessage:\n${message}`,
            html: `<h3>New Support Submission</h3>
                   <p><strong>Type:</strong> ${type.toUpperCase()}</p>
                   <p><strong>From:</strong> ${fullname} (${email})</p>
                   <p><strong>Subject:</strong> ${subject}</p>
                   <p><strong>Message:</strong></p>
                   <p>${message}</p>`
        });

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully. Thank you!',
            data: feedback
        });
    } catch (error) {
        logger.error('Error creating feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback',
            error: error.message
        });
    }
};
