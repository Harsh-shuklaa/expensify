const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const logsDir = path.join(__dirname, '../logs');
const emailLogPath = path.join(logsDir, 'sent_emails.log');

// Ensure log directory exists
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// SMTP credentials check
const isSmtpConfigured = () => {
    return !!(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
    );
};

// Try loading nodemailer dynamically
let nodemailer = null;
try {
    nodemailer = require('nodemailer');
} catch (e) {
    logger.info('Nodemailer is not installed locally. Email service will run in simulated mode.');
}

/**
 * Send real email via SMTP if configured, or fall back to local log simulation
 */
const sendEmail = async ({ to, subject, html, text }) => {
    // Case 1: Nodemailer is installed and SMTP environment variables are configured
    if (nodemailer && isSmtpConfigured()) {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT),
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            const mailOptions = {
                from: process.env.SMTP_FROM || '"Expensify Support" <expensifya@gmail.com>',
                to,
                subject,
                text,
                html,
            };

            const info = await transporter.sendMail(mailOptions);
            logger.info(`Email sent successfully via SMTP to ${to}`, { messageId: info.messageId });
            return { success: true, messageId: info.messageId };
        } catch (error) {
            logger.error(`Failed to send email via SMTP to ${to}. Attempting fallback simulation...`, error);
            // Fall back to simulation if SMTP fails so user registration is not blocked
        }
    }

    // Case 2: Fallback simulated mode (logs to file)
    try {
        const timestamp = new Date().toISOString();
        const border = '='.repeat(80);
        const emailRecord = `
${border}
Date: ${timestamp}
To: ${to}
Subject: ${subject}
${border}
Text Content:
${text || 'N/A'}

HTML Content:
${html}
${border}
\n`;

        fs.appendFileSync(emailLogPath, emailRecord, 'utf8');
        logger.info(`[Simulation Mode] Email logged to sent_emails.log for ${to}`, { subject });
        return { success: true, messageId: `simulated-id-${Date.now()}` };
    } catch (error) {
        logger.error('Failed to log simulated email:', error);
        throw error;
    }
};

module.exports = { sendEmail };
