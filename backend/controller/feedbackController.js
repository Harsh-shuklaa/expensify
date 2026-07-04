const Feedback = require('../models/Feedback');
const crypto = require('crypto');
const logger = require('../utils/logger');
const {
    sendContactMessageNotification,
    sendFeedbackNotification,
    sendBugReportNotification,
    sendFeatureRequestNotification,
    sendAccountIssueNotification,
} = require('../utils/emailService');

// Helper to generate ticket ID
const generateTicketId = (feedbackId) => {
    return `EXP-${feedbackId.toString().substring(18).toUpperCase()}`;
};

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
        const allowedTypes = ['contact', 'bug', 'feedback', 'feature', 'account'];
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

        const ticketId = generateTicketId(feedback._id);
        const submittedAt = new Date(feedback.createdAt).toLocaleString();

        const emailParams = {
            to: email,
            userName: fullname,
            email: email.toLowerCase(),
            ticketId,
            subject,
            message,
            submittedAt,
        };

        // Send user confirmation + admin notification based on type
        try {
            if (type === 'bug') {
                await sendBugReportNotification(emailParams);
            } else if (type === 'feedback') {
                await sendFeedbackNotification(emailParams);
            } else if (type === 'feature') {
                await sendFeatureRequestNotification(emailParams);
            } else if (type === 'account') {
                await sendAccountIssueNotification(emailParams);
            } else {
                // 'contact' type
                await sendContactMessageNotification(emailParams);
            }
            logger.info(`Notification emails sent for [${type}] ticket ${ticketId}`);
        } catch (mailError) {
            // Log but don't fail the feedback submission
            logger.error(`Failed to send notification emails for ticket ${ticketId}: ${mailError.message}`);
        }

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
