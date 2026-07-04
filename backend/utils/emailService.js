const { Resend } = require('resend');
const logger = require('./logger');

// ─── Initialize Resend Client ────────────────────────────────────────────────
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Expensify <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'expensifya@gmail.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

let resend = null;

const getResendClient = () => {
  if (!resend) {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not configured');
    }
    resend = new Resend(RESEND_API_KEY);
  }
  return resend;
};

/**
 * Verify Resend API connectivity at startup
 */
const verifyEmailConnection = async () => {
  if (!RESEND_API_KEY) {
    logger.error('RESEND_API_KEY is not configured. Email delivery will fail.');
    return false;
  }

  try {
    const client = getResendClient();
    // Send a minimal API call to verify the key is valid
    await client.apiKeys.list();
    logger.info('Resend API connection verified successfully');
    return true;
  } catch (error) {
    logger.error(`Resend API verification failed: ${error.message}`);
    return false;
  }
};

// ─── Base Email Layout ───────────────────────────────────────────────────────
const baseLayout = ({ title, previewText, bodyContent }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
  ${previewText ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}</span>` : ''}
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #f4f4f7;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      color: #1a1a2e;
      line-height: 1.6;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f4f4f7;
      padding: 40px 16px;
    }
    .email-container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
    }
    .email-header {
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .email-header .logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .email-header .logo-icon {
      background: rgba(255,255,255,0.2);
      color: #fff;
      font-weight: 800;
      font-size: 20px;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .email-header .logo-text {
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .email-body {
      padding: 40px;
    }
    .email-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    .email-subtitle {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 24px;
    }
    .greeting {
      font-size: 15px;
      color: #334155;
      margin-bottom: 20px;
    }
    .content-text {
      font-size: 15px;
      line-height: 1.7;
      color: #334155;
      margin-bottom: 24px;
    }
    .otp-container {
      background: linear-gradient(135deg, #f8f7ff 0%, #f1f0ff 100%);
      border: 2px solid #e2ddff;
      border-radius: 14px;
      padding: 28px;
      text-align: center;
      margin: 28px 0;
    }
    .otp-label {
      font-size: 12px;
      font-weight: 700;
      color: #7c3aed;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 12px;
    }
    .otp-code {
      font-size: 36px;
      font-weight: 800;
      color: #1a1a2e;
      letter-spacing: 8px;
      font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
      margin: 8px 0;
    }
    .otp-expiry {
      font-size: 13px;
      color: #ef4444;
      font-weight: 600;
      margin-top: 12px;
    }
    .info-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 13px;
      border-bottom: 1px solid #f1f5f9;
    }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; font-weight: 600; }
    .info-value { color: #0f172a; font-weight: 700; text-align: right; }
    .message-block {
      border-left: 4px solid #7c3aed;
      background-color: #faf9ff;
      padding: 16px 20px;
      border-radius: 0 12px 12px 0;
      margin: 20px 0;
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      font-style: italic;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
      color: #ffffff !important;
      padding: 14px 32px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      text-align: center;
      margin: 16px 0;
    }
    .security-note {
      background-color: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 10px;
      padding: 14px 18px;
      font-size: 12px;
      color: #92400e;
      margin: 24px 0;
      line-height: 1.5;
    }
    .security-note strong { color: #78350f; }
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 24px 0;
    }
    .email-signature {
      font-size: 14px;
      color: #334155;
      padding-top: 8px;
    }
    .email-signature .name {
      font-weight: 700;
      color: #0f172a;
    }
    .email-footer {
      background-color: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .footer-text a {
      color: #7c3aed;
      text-decoration: none;
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-new { background: #dcfce7; color: #166534; }
    .badge-urgent { background: #fee2e2; color: #991b1b; }
    .badge-info { background: #dbeafe; color: #1e40af; }
    @media only screen and (max-width: 600px) {
      .email-body { padding: 24px 20px; }
      .email-header { padding: 24px 20px; }
      .email-footer { padding: 20px; }
      .otp-code { font-size: 28px; letter-spacing: 6px; }
      .email-title { font-size: 19px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="logo">
          <span class="logo-icon">E</span>
          <span class="logo-text">Expensify</span>
        </div>
      </div>
      <div class="email-body">
        ${bodyContent}
      </div>
      <div class="email-footer">
        <p class="footer-text">
          &copy; ${new Date().getFullYear()} Expensify. All rights reserved.<br>
          <a href="${FRONTEND_URL}/privacy-policy">Privacy Policy</a> &middot;
          <a href="${FRONTEND_URL}/terms-of-service">Terms of Service</a><br>
          <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// ─── Email Template Builders ─────────────────────────────────────────────────

/**
 * A. Email Verification OTP Template
 */
const verificationOtpTemplate = ({ userName, otp, expiryMinutes }) => baseLayout({
  title: 'Verify Your Expensify Account',
  previewText: `Your verification code is ${otp}. Valid for ${expiryMinutes} minutes.`,
  bodyContent: `
    <h1 class="email-title">Verify Your Email Address</h1>
    <p class="email-subtitle">One more step to get started with Expensify</p>
    <p class="greeting">Hi ${userName},</p>
    <p class="content-text">
      Thank you for signing up! Please use the verification code below to confirm your email address and activate your account.
    </p>
    <div class="otp-container">
      <div class="otp-label">Verification Code</div>
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">⏰ Expires in ${expiryMinutes} minutes</div>
    </div>
    <div class="security-note">
      🔒 <strong>Security Note:</strong> Never share this code with anyone. Expensify staff will never ask for your verification code. If you did not create an account, please ignore this email.
    </div>
    <div class="divider"></div>
    <div class="email-signature">
      Welcome aboard,<br>
      <span class="name">The Expensify Team</span>
    </div>
  `
});

/**
 * B. Password Reset OTP Template
 */
const passwordResetTemplate = ({ userName, otp, expiryMinutes }) => baseLayout({
  title: 'Reset Your Expensify Password',
  previewText: `Your password reset code is ${otp}. Valid for ${expiryMinutes} minutes.`,
  bodyContent: `
    <h1 class="email-title">Password Reset Request</h1>
    <p class="email-subtitle">Use the code below to reset your password</p>
    <p class="greeting">Hi ${userName},</p>
    <p class="content-text">
      We received a request to reset your Expensify account password. Use the code below to proceed. If you didn't make this request, you can safely ignore this email — your password will remain unchanged.
    </p>
    <div class="otp-container">
      <div class="otp-label">Reset Code</div>
      <div class="otp-code">${otp}</div>
      <div class="otp-expiry">⏰ Expires in ${expiryMinutes} minutes</div>
    </div>
    <div class="security-note">
      🔒 <strong>Security Instructions:</strong>
      <ul style="margin: 8px 0 0 16px; padding: 0;">
        <li>Do not share this code with anyone</li>
        <li>Choose a strong password with letters, numbers, and symbols</li>
        <li>If you did not request this reset, secure your account immediately</li>
      </ul>
    </div>
    <div class="divider"></div>
    <div class="email-signature">
      Stay secure,<br>
      <span class="name">Expensify Security Team</span>
    </div>
  `
});

/**
 * C. Contact Form — User Confirmation
 */
const contactConfirmationTemplate = ({ userName, ticketId, subject, submittedAt }) => baseLayout({
  title: 'We Received Your Message',
  previewText: `Your support request [${ticketId}] has been received.`,
  bodyContent: `
    <h1 class="email-title">Message Received ✓</h1>
    <p class="email-subtitle">We'll get back to you shortly</p>
    <p class="greeting">Hi ${userName},</p>
    <p class="content-text">
      Thank you for reaching out! We have received your message and our support team will review it shortly. Our typical response time is under 24 hours.
    </p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Ticket ID</span>
        <span class="info-value">${ticketId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Subject</span>
        <span class="info-value">${subject}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Submitted</span>
        <span class="info-value">${submittedAt}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="badge badge-new">Received</span></span>
      </div>
    </div>
    <a href="${FRONTEND_URL}/dashboard" class="cta-button">Open Expensify Dashboard</a>
    <div class="divider"></div>
    <div class="email-signature">
      Warm regards,<br>
      <span class="name">Expensify Support Team</span>
    </div>
  `
});

/**
 * D. Contact Form — Admin Notification
 */
const contactAdminTemplate = ({ userName, email, ticketId, subject, message, submittedAt }) => baseLayout({
  title: `New Contact: ${subject}`,
  previewText: `New contact submission from ${userName} (${email})`,
  bodyContent: `
    <h1 class="email-title">New Contact Submission</h1>
    <p class="email-subtitle"><span class="badge badge-info">Contact</span></p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Ticket ID</span>
        <span class="info-value">${ticketId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">From</span>
        <span class="info-value">${userName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value">${email}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Subject</span>
        <span class="info-value">${subject}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Submitted</span>
        <span class="info-value">${submittedAt}</span>
      </div>
    </div>
    <p style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Message</p>
    <div class="message-block">${message}</div>
  `
});

/**
 * E. Feedback — User Confirmation
 */
const feedbackConfirmationTemplate = ({ userName, ticketId, submittedAt }) => baseLayout({
  title: 'Feedback Received — Thank You!',
  previewText: `Your feedback [${ticketId}] has been logged.`,
  bodyContent: `
    <h1 class="email-title">Thank You for Your Feedback!</h1>
    <p class="email-subtitle">Your input helps us build a better product</p>
    <p class="greeting">Hi ${userName},</p>
    <p class="content-text">
      We've received your feedback and it has been forwarded to our product team. Your suggestions are reviewed to shape upcoming releases and improvements to Expensify.
    </p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Ticket ID</span>
        <span class="info-value">${ticketId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type</span>
        <span class="info-value">Feedback</span>
      </div>
      <div class="info-row">
        <span class="info-label">Submitted</span>
        <span class="info-value">${submittedAt}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="badge badge-new">Received</span></span>
      </div>
    </div>
    <a href="${FRONTEND_URL}/dashboard" class="cta-button">Back to Dashboard</a>
    <div class="divider"></div>
    <div class="email-signature">
      Thank you,<br>
      <span class="name">Expensify Product Team</span>
    </div>
  `
});

/**
 * F. Feedback — Admin Notification
 */
const feedbackAdminTemplate = ({ userName, email, ticketId, subject, message, submittedAt }) => baseLayout({
  title: `New Feedback: ${subject}`,
  previewText: `New feedback from ${userName} (${email})`,
  bodyContent: `
    <h1 class="email-title">New Feedback Submission</h1>
    <p class="email-subtitle"><span class="badge badge-info">Feedback</span></p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Ticket ID</span>
        <span class="info-value">${ticketId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">From</span>
        <span class="info-value">${userName} (${email})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Subject</span>
        <span class="info-value">${subject}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Submitted</span>
        <span class="info-value">${submittedAt}</span>
      </div>
    </div>
    <p style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Feedback</p>
    <div class="message-block">${message}</div>
  `
});

/**
 * G. Bug Report — User Confirmation
 */
const bugReportConfirmationTemplate = ({ userName, ticketId, submittedAt }) => baseLayout({
  title: 'Bug Report Received',
  previewText: `Your bug report [${ticketId}] has been logged.`,
  bodyContent: `
    <h1 class="email-title">Bug Report Received 🐛</h1>
    <p class="email-subtitle">Our engineering team is on it</p>
    <p class="greeting">Hi ${userName},</p>
    <p class="content-text">
      Thank you for reporting this issue! Our engineering team has been notified and will investigate. We'll update you when there's progress on this ticket. If we need additional information, we'll reach out directly.
    </p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Ticket ID</span>
        <span class="info-value">${ticketId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type</span>
        <span class="info-value">Bug Report</span>
      </div>
      <div class="info-row">
        <span class="info-label">Submitted</span>
        <span class="info-value">${submittedAt}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="badge badge-urgent">Under Investigation</span></span>
      </div>
    </div>
    <a href="${FRONTEND_URL}/dashboard" class="cta-button">Back to Dashboard</a>
    <div class="divider"></div>
    <div class="email-signature">
      Thank you for helping us improve,<br>
      <span class="name">Expensify Engineering Team</span>
    </div>
  `
});

/**
 * H. Bug Report — Admin Notification
 */
const bugReportAdminTemplate = ({ userName, email, ticketId, subject, message, submittedAt }) => baseLayout({
  title: `🐛 Bug Report: ${subject}`,
  previewText: `New bug report from ${userName} (${email})`,
  bodyContent: `
    <h1 class="email-title">🐛 New Bug Report</h1>
    <p class="email-subtitle"><span class="badge badge-urgent">Bug</span></p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Ticket ID</span>
        <span class="info-value">${ticketId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Reported By</span>
        <span class="info-value">${userName} (${email})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Subject</span>
        <span class="info-value">${subject}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Submitted</span>
        <span class="info-value">${submittedAt}</span>
      </div>
    </div>
    <p style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Bug Description</p>
    <div class="message-block">${message}</div>
  `
});

/**
 * I. Feature Request — User Confirmation
 */
const featureRequestConfirmationTemplate = ({ userName, ticketId, submittedAt }) => baseLayout({
  title: 'Feature Request Logged',
  previewText: `Your feature request [${ticketId}] has been recorded.`,
  bodyContent: `
    <h1 class="email-title">Feature Request Noted! 💡</h1>
    <p class="email-subtitle">Added to our product roadmap backlog</p>
    <p class="greeting">Hi ${userName},</p>
    <p class="content-text">
      Your feature suggestion has been logged and shared with our product team! We review community requests regularly to prioritize new features and improvements for Expensify.
    </p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Ticket ID</span>
        <span class="info-value">${ticketId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type</span>
        <span class="info-value">Feature Request</span>
      </div>
      <div class="info-row">
        <span class="info-label">Submitted</span>
        <span class="info-value">${submittedAt}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="badge badge-new">Logged</span></span>
      </div>
    </div>
    <a href="${FRONTEND_URL}/dashboard" class="cta-button">Back to Dashboard</a>
    <div class="divider"></div>
    <div class="email-signature">
      Thank you for your ideas,<br>
      <span class="name">Expensify Product Team</span>
    </div>
  `
});

/**
 * J. Feature Request — Admin Notification
 */
const featureRequestAdminTemplate = ({ userName, email, ticketId, subject, message, submittedAt }) => baseLayout({
  title: `💡 Feature Request: ${subject}`,
  previewText: `New feature request from ${userName} (${email})`,
  bodyContent: `
    <h1 class="email-title">💡 New Feature Request</h1>
    <p class="email-subtitle"><span class="badge badge-info">Feature</span></p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Ticket ID</span>
        <span class="info-value">${ticketId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">From</span>
        <span class="info-value">${userName} (${email})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Subject</span>
        <span class="info-value">${subject}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Submitted</span>
        <span class="info-value">${submittedAt}</span>
      </div>
    </div>
    <p style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Feature Description</p>
    <div class="message-block">${message}</div>
  `
});

/**
 * Account Issue — User Confirmation
 */
const accountIssueConfirmationTemplate = ({ userName, ticketId, submittedAt }) => baseLayout({
  title: 'Account Request Logged',
  previewText: `Your account request [${ticketId}] has been received.`,
  bodyContent: `
    <h1 class="email-title">Account Request Received 🔐</h1>
    <p class="email-subtitle">Our team is reviewing your request</p>
    <p class="greeting">Hi ${userName},</p>
    <p class="content-text">
      We've received your account-related request. To protect your data, our support team may request identity verification before making any changes to your account configuration.
    </p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Ticket ID</span>
        <span class="info-value">${ticketId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Type</span>
        <span class="info-value">Account Issue</span>
      </div>
      <div class="info-row">
        <span class="info-label">Submitted</span>
        <span class="info-value">${submittedAt}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="badge badge-new">Under Review</span></span>
      </div>
    </div>
    <a href="${FRONTEND_URL}/dashboard" class="cta-button">Open Dashboard</a>
    <div class="divider"></div>
    <div class="email-signature">
      Stay secure,<br>
      <span class="name">Expensify Support Team</span>
    </div>
  `
});

/**
 * Account Issue — Admin Notification
 */
const accountIssueAdminTemplate = ({ userName, email, ticketId, subject, message, submittedAt }) => baseLayout({
  title: `🔐 Account Issue: ${subject}`,
  previewText: `New account issue from ${userName} (${email})`,
  bodyContent: `
    <h1 class="email-title">🔐 Account Issue Report</h1>
    <p class="email-subtitle"><span class="badge badge-urgent">Account</span></p>
    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Ticket ID</span>
        <span class="info-value">${ticketId}</span>
      </div>
      <div class="info-row">
        <span class="info-label">From</span>
        <span class="info-value">${userName} (${email})</span>
      </div>
      <div class="info-row">
        <span class="info-label">Subject</span>
        <span class="info-value">${subject}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Submitted</span>
        <span class="info-value">${submittedAt}</span>
      </div>
    </div>
    <p style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Issue Description</p>
    <div class="message-block">${message}</div>
  `
});

// ─── Core Send Function (Resend Only) ────────────────────────────────────────

/**
 * Send email using Resend API.
 * THROWS on failure — no simulation, no fallback.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const client = getResendClient();

  logger.info(`Sending email via Resend to ${to} | Subject: "${subject}"`);

  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text,
    });

    if (error) {
      logger.error(`Resend API returned error for ${to}: Name=${error.name} | Message=${error.message} | Code=${error.code} | Status=${error.statusCode} | Full Payload=${JSON.stringify(error)}`);
      
      const err = new Error(`Email delivery failed: ${error.message || JSON.stringify(error)}`);
      err.name = error.name || 'ResendError';
      err.code = error.code;
      err.statusCode = error.statusCode;
      err.isEmailDeliveryError = true;
      throw err;
    }

    logger.info(`Email sent successfully to ${to} | ID: ${data?.id}`);
    return { success: true, messageId: data?.id, mode: 'resend' };
  } catch (error) {
    if (error.isEmailDeliveryError) throw error;

    logger.error(`Resend SDK execution threw an error for ${to}: Name=${error.name || 'N/A'} | Message=${error.message} | Code=${error.code || 'N/A'} | Status=${error.statusCode || error.status || 'N/A'} | Response=${JSON.stringify(error.response || null)} | Stack=${error.stack}`);
    
    const err = new Error(`Email delivery failed to ${to}: ${error.message}`);
    err.name = error.name || 'ResendException';
    err.code = error.code;
    err.statusCode = error.statusCode || error.status;
    err.stack = error.stack;
    err.isEmailDeliveryError = true;
    throw err;
  }
};

// ─── Centralized Email Service Functions ─────────────────────────────────────

/**
 * Send Verification OTP Email
 */
const sendVerificationOTP = async ({ to, userName, otp, expiryMinutes = 10 }) => {
  logger.info(`Sending verification OTP to ${to}`);
  return sendEmail({
    to,
    subject: 'Verify Your Expensify Account',
    html: verificationOtpTemplate({ userName, otp, expiryMinutes }),
    text: `Hi ${userName}, your Expensify verification code is: ${otp}. It expires in ${expiryMinutes} minutes. Do not share this code.`,
  });
};

/**
 * Send Password Reset OTP Email
 */
const sendPasswordResetOTP = async ({ to, userName, otp, expiryMinutes = 15 }) => {
  logger.info(`Sending password reset OTP to ${to}`);
  return sendEmail({
    to,
    subject: 'Reset Your Expensify Password',
    html: passwordResetTemplate({ userName, otp, expiryMinutes }),
    text: `Hi ${userName}, your Expensify password reset code is: ${otp}. It expires in ${expiryMinutes} minutes. If you didn't request this, ignore this email.`,
  });
};

/**
 * Send Contact Message Confirmation (to user) + Admin Notification
 */
const sendContactMessageNotification = async ({ to, userName, email, ticketId, subject, message, submittedAt }) => {
  // Send user confirmation
  await sendEmail({
    to,
    subject: `Message Received: [${ticketId}]`,
    html: contactConfirmationTemplate({ userName, ticketId, subject, submittedAt }),
    text: `Hi ${userName}, we received your message. Ticket: ${ticketId}. Subject: ${subject}. We'll respond within 24 hours.`,
  });

  // Send admin notification
  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[New Contact] ${subject} — ${userName}`,
    html: contactAdminTemplate({ userName, email, ticketId, subject, message, submittedAt }),
    text: `New contact from ${userName} (${email}). Ticket: ${ticketId}. Subject: ${subject}. Message: ${message}`,
  });
};

/**
 * Send Feedback Confirmation (to user) + Admin Notification
 */
const sendFeedbackNotification = async ({ to, userName, email, ticketId, subject, message, submittedAt }) => {
  await sendEmail({
    to,
    subject: `Feedback Received: [${ticketId}]`,
    html: feedbackConfirmationTemplate({ userName, ticketId, submittedAt }),
    text: `Hi ${userName}, thank you for your feedback! Ticket: ${ticketId}. Your input helps us improve.`,
  });

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Feedback] ${subject} — ${userName}`,
    html: feedbackAdminTemplate({ userName, email, ticketId, subject, message, submittedAt }),
    text: `New feedback from ${userName} (${email}). Ticket: ${ticketId}. Message: ${message}`,
  });
};

/**
 * Send Bug Report Confirmation (to user) + Admin Notification
 */
const sendBugReportNotification = async ({ to, userName, email, ticketId, subject, message, submittedAt }) => {
  await sendEmail({
    to,
    subject: `Bug Report Logged: [${ticketId}]`,
    html: bugReportConfirmationTemplate({ userName, ticketId, submittedAt }),
    text: `Hi ${userName}, your bug report has been logged. Ticket: ${ticketId}. Our team is investigating.`,
  });

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Bug Report] ${subject} — ${userName}`,
    html: bugReportAdminTemplate({ userName, email, ticketId, subject, message, submittedAt }),
    text: `New bug report from ${userName} (${email}). Ticket: ${ticketId}. Message: ${message}`,
  });
};

/**
 * Send Feature Request Confirmation (to user) + Admin Notification
 */
const sendFeatureRequestNotification = async ({ to, userName, email, ticketId, subject, message, submittedAt }) => {
  await sendEmail({
    to,
    subject: `Feature Request Logged: [${ticketId}]`,
    html: featureRequestConfirmationTemplate({ userName, ticketId, submittedAt }),
    text: `Hi ${userName}, your feature request has been logged. Ticket: ${ticketId}. Thanks for your ideas!`,
  });

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Feature Request] ${subject} — ${userName}`,
    html: featureRequestAdminTemplate({ userName, email, ticketId, subject, message, submittedAt }),
    text: `New feature request from ${userName} (${email}). Ticket: ${ticketId}. Message: ${message}`,
  });
};

/**
 * Send Account Issue Confirmation (to user) + Admin Notification
 */
const sendAccountIssueNotification = async ({ to, userName, email, ticketId, subject, message, submittedAt }) => {
  await sendEmail({
    to,
    subject: `Account Request Logged: [${ticketId}]`,
    html: accountIssueConfirmationTemplate({ userName, ticketId, submittedAt }),
    text: `Hi ${userName}, your account request has been received. Ticket: ${ticketId}. We'll review it shortly.`,
  });

  await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Account Issue] ${subject} — ${userName}`,
    html: accountIssueAdminTemplate({ userName, email, ticketId, subject, message, submittedAt }),
    text: `New account issue from ${userName} (${email}). Ticket: ${ticketId}. Message: ${message}`,
  });
};

// ─── Exports ─────────────────────────────────────────────────────────────────
module.exports = {
  sendEmail,
  verifyEmailConnection,
  sendVerificationOTP,
  sendPasswordResetOTP,
  sendContactMessageNotification,
  sendFeedbackNotification,
  sendBugReportNotification,
  sendFeatureRequestNotification,
  sendAccountIssueNotification,
};
