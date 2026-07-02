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
 * Send email via Resend API (HTTP POST) to bypass Render SMTP port blocking
 */
const sendViaResend = async ({ to, subject, html, text }) => {
    const https = require('https');
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.SMTP_FROM || 'Expensify <onboarding@resend.dev>';

    const postData = JSON.stringify({
        from: from.includes('onboarding@resend.dev') ? 'onboarding@resend.dev' : from,
        to: [to],
        subject,
        html,
        text
    });

    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'api.resend.com',
            port: 443,
            path: '/emails',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const parsed = JSON.parse(body);
                        resolve({ success: true, messageId: parsed.id, mode: 'resend' });
                    } catch (e) {
                        resolve({ success: true, messageId: `resend-id-${Date.now()}`, mode: 'resend' });
                    }
                } else {
                    reject(new Error(`Resend API returned status ${res.statusCode}: ${body}`));
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
};

/**
 * Send real email via SMTP if configured, or fall back to local log simulation
 */
const sendEmail = async ({ to, subject, html, text }) => {
    // 1. Try Resend HTTP API if configured (highly recommended for Render Free Tier)
    if (process.env.RESEND_API_KEY) {
        try {
            logger.info(`Attempting to send email via Resend HTTP API to ${to}...`);
            const result = await sendViaResend({ to, subject, html, text });
            logger.info(`Email sent successfully via Resend API to ${to}`, { messageId: result.messageId });
            return result;
        } catch (error) {
            logger.error(`Resend API sending failed to ${to}. Attempting SMTP/Simulation fallback...`, error);
            global.lastSmtpError = `Resend failed: ${error.message}`;
        }
    }

    // 2. Try Standard SMTP if configured
    if (nodemailer && isSmtpConfigured()) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
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
      return { success: true, messageId: info.messageId, mode: 'smtp' };
    } catch (error) {
      logger.error(`Failed to send email via SMTP to ${to}. Attempting fallback simulation...`, error);
      global.lastSmtpError = error.message || error;
    }
  }

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

    try {
      fs.appendFileSync(emailLogPath, emailRecord, 'utf8');
    } catch (fileError) {
      logger.error('Failed to log simulated email to file, falling back to console:', fileError.message);
    }
    logger.info(`[Simulation Mode] Email for ${to} | OTP/Content: ${text || 'N/A'}`);
    return { success: true, messageId: `simulated-id-${Date.now()}`, mode: 'simulation', smtpError: global.lastSmtpError };
  } catch (error) {
    logger.error('Failed to process simulated email:', error);
    return { success: true, messageId: `simulated-id-fallback-${Date.now()}`, mode: 'simulation_fallback', error: error.message };
  }
};

/**
 * Shared premium responsive email template layout generator
 */
const getEmailWrapperHTML = ({ title, bodyHtml, userName, ticketId, requestType, submittedAt, status, dashboardUrl, originalMessage }) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .wrapper {
      width: 100%;
      background-color: #f8fafc;
      padding: 40px 0;
    }
    .container {
      max-width: 540px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    .header {
      margin-bottom: 32px;
    }
    .logo-badge {
      background-color: #7c3aed;
      color: #ffffff;
      font-weight: 700;
      font-size: 16px;
      padding: 6px 12px;
      border-radius: 8px;
      margin-right: 8px;
      display: inline-block;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .logo-text {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      display: inline-block;
      vertical-align: middle;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 16px;
      letter-spacing: -0.02em;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .content {
      font-size: 15px;
      line-height: 1.6;
      color: #334155;
      margin-bottom: 24px;
    }
    .meta-grid {
      background-color: #f1f5f9;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      border: 1px solid #e2e8f0;
    }
    .meta-row {
      display: block;
      padding: 6px 0;
      font-size: 13px;
    }
    .meta-row:not(:last-child) {
      border-bottom: 1px solid #e2e8f0;
    }
    .meta-label {
      color: #64748b;
      font-weight: 600;
      display: inline-block;
      width: 120px;
    }
    .meta-value {
      color: #0f172a;
      font-weight: 700;
      display: inline-block;
    }
    .blockquote-title {
      font-size: 13px;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .blockquote {
      border-left: 4px solid #7c3aed;
      background-color: #f8fafc;
      padding: 16px;
      margin: 0 0 28px 0;
      border-radius: 0 12px 12px 0;
      font-size: 14px;
      line-height: 1.5;
      color: #475569;
    }
    .cta-container {
      margin-bottom: 32px;
    }
    .btn {
      background-color: #7c3aed;
      color: #ffffff !important;
      padding: 12px 28px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      display: inline-block;
    }
    .btn:hover {
      background-color: #6d28d9;
    }
    .signature {
      font-size: 14px;
      color: #334155;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      margin-top: 28px;
    }
    .signature-title {
      font-weight: 700;
      color: #0f172a;
    }
    .footer {
      max-width: 540px;
      margin: 24px auto 0 auto;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.5;
    }
    .footer a {
      color: #7c3aed;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="logo-badge">E</span>
        <span class="logo-text">Expensify</span>
      </div>
      
      <h2 class="title">${title}</h2>
      <div class="greeting">Hi ${userName},</div>
      
      <div class="content">
        ${bodyHtml}
      </div>
      
      <div class="meta-grid">
        <div class="meta-row">
          <span class="meta-label">Ticket ID</span>
          <span class="meta-value">${ticketId}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Request Type</span>
          <span class="meta-value">${requestType}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Submitted At</span>
          <span class="meta-value">${submittedAt}</span>
        </div>
        <div class="meta-row">
          <span class="meta-label">Status</span>
          <span class="meta-value" style="color: #10b981;">${status}</span>
        </div>
      </div>
      
      ${originalMessage ? `
        <div class="blockquote-title">Your Message</div>
        <div class="blockquote">
          "${originalMessage}"
        </div>
      ` : ''}
      
      <div class="cta-container">
        <a href="${dashboardUrl}" class="btn">Open Expensify</a>
      </div>
      
      <div class="signature">
        Warm regards,<br>
        <span class="signature-title">Expensify Support Team</span>
      </div>
    </div>
    
    <div class="footer">
      This is an automated receipt for your submission to Expensify Support.<br>
      To review privacy standards, check our <a href="${dashboardUrl.replace('/dashboard', '/privacy-policy')}">Privacy Policy</a>.
      Reach our admin desk at <a href="mailto:expensifya@gmail.com">expensifya@gmail.com</a>.
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * 1. Bug Report Confirmation Email
 */
const sendBugReportConfirmationEmail = async ({ to, userName, ticketId, submittedAt, message }) => {
  const ticket = ticketId || `EXP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const time = submittedAt || new Date().toLocaleString();
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;

  const html = getEmailWrapperHTML({
    title: "Bug Report Received",
    bodyHtml: "We have received your bug report. Our technical team is investigating the issue to understand what went wrong. We appreciate your patience as we diagnose this. If additional context is needed, one of our representatives will contact you directly on this ticket.",
    userName,
    ticketId: ticket,
    requestType: "Bug Report",
    submittedAt: time,
    status: "Received",
    dashboardUrl,
    originalMessage: message
  });

  return await sendEmail({
    to,
    subject: `Bug Report Logged: [${ticket}]`,
    text: `Hi ${userName},\n\nWe have received your bug report. Our engineering team is currently investigating. Ticket ID: ${ticket}.\n\nMessage:\n"${message}"`,
    html
  });
};

/**
 * 2. Feedback Confirmation Email
 */
const sendFeedbackConfirmationEmail = async ({ to, userName, ticketId, submittedAt, message }) => {
  const ticket = ticketId || `EXP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const time = submittedAt || new Date().toLocaleString();
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;

  const html = getEmailWrapperHTML({
    title: "Feedback Logged",
    bodyHtml: "Thank you for helping us improve Expensify! We have logged your feedback. Suggestions and notes from our community are reviewed directly by the product team to assist in shaping upcoming release versions.",
    userName,
    ticketId: ticket,
    requestType: "Feedback",
    submittedAt: time,
    status: "Received",
    dashboardUrl,
    originalMessage: message
  });

  return await sendEmail({
    to,
    subject: `Feedback Logged: [${ticket}]`,
    text: `Hi ${userName},\n\nThank you for your feedback! It has been successfully recorded. Ticket ID: ${ticket}.\n\nMessage:\n"${message}"`,
    html
  });
};

/**
 * 3. Feature Request Confirmation Email
 */
const sendFeatureRequestConfirmationEmail = async ({ to, userName, ticketId, submittedAt, message }) => {
  const ticket = ticketId || `EXP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const time = submittedAt || new Date().toLocaleString();
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;

  const html = getEmailWrapperHTML({
    title: "Feature Request Recorded",
    bodyHtml: "Your feature suggestion has been successfully logged! We constantly evaluate feature ideas to enhance our expense tracker. We have added this request to our backlog for consideration in future platform updates.",
    userName,
    ticketId: ticket,
    requestType: "Feature Request",
    submittedAt: time,
    status: "Received",
    dashboardUrl,
    originalMessage: message
  });

  return await sendEmail({
    to,
    subject: `Feature Request Logged: [${ticket}]`,
    text: `Hi ${userName},\n\nYour feature suggestion has been logged! Ticket ID: ${ticket}.\n\nMessage:\n"${message}"`,
    html
  });
};

/**
 * 4. Contact Support Confirmation Email
 */
const sendSupportConfirmationEmail = async ({ to, userName, ticketId, submittedAt, message }) => {
  const ticket = ticketId || `EXP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const time = submittedAt || new Date().toLocaleString();
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;

  const html = getEmailWrapperHTML({
    title: "Support Request Received",
    bodyHtml: "We have received your support request. Our customer support desk will review the details and get back to you shortly. Our typical response window is under 24 hours.",
    userName,
    ticketId: ticket,
    requestType: "Contact Support",
    submittedAt: time,
    status: "Received",
    dashboardUrl,
    originalMessage: message
  });

  return await sendEmail({
    to,
    subject: `Support Ticket Created: [${ticket}]`,
    text: `Hi ${userName},\n\nWe have received your support request. A support representative will respond shortly. Ticket ID: ${ticket}.\n\nMessage:\n"${message}"`,
    html
  });
};

/**
 * 5. Account Issue Confirmation Email
 */
const sendAccountIssueConfirmationEmail = async ({ to, userName, ticketId, submittedAt, message }) => {
  const ticket = ticketId || `EXP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const time = submittedAt || new Date().toLocaleString();
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`;

  const html = getEmailWrapperHTML({
    title: "Account Request Logged",
    bodyHtml: "We have received your account security/profile ticket. To protect your data, please be aware that our support team might request identity verification details before modifying configuration metrics or account details.",
    userName,
    ticketId: ticket,
    requestType: "Account Issue",
    submittedAt: time,
    status: "Received",
    dashboardUrl,
    originalMessage: message
  });

  return await sendEmail({
    to,
    subject: `Account Request Logged: [${ticket}]`,
    text: `Hi ${userName},\n\nWe have received your account request. Ticket ID: ${ticket}.\n\nMessage:\n"${message}"`,
    html
  });
};

module.exports = {
  sendEmail,
  sendBugReportConfirmationEmail,
  sendFeedbackConfirmationEmail,
  sendFeatureRequestConfirmationEmail,
  sendSupportConfirmationEmail,
  sendAccountIssueConfirmationEmail
};
