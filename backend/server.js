require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const helmet = require('helmet');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { verifySmtpConnection, isSmtpConfigured } = require('./utils/emailService');

// Import Custom Middlewares
const cookieParser = require('./middleware/cookieParser');
const { sanitizeInput } = require('./middleware/sanitizeMiddleware');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

const app = express();

// Trust reverse proxy (Render/Railway/VPS) to correctly identify client IPs
app.set('trust proxy', 1);

// Ensure uploads and downloads directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

// ─── Helmet: HTTP Security Headers ───────────────────────────────────────────
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving uploaded images cross-origin
        contentSecurityPolicy: false, // Disabled — frontend handles its own CSP via Vite/meta tags
    })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = ['http://localhost:5173'];
if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ''));
}
const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (mobile apps, Postman, cURL)
            if (!origin) return callback(null, true);
            if (uniqueAllowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
                return callback(null, true);
            } else {
                return callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// ─── Body Parsers & Cookie Parser ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser);

// ─── Prevent NoSQL Injection & XSS ───────────────────────────────────────────
app.use(sanitizeInput);

// ─── Static uploads folder ────────────────────────────────────────────────────
app.use('/uploads', express.static(uploadsDir));

// ─── Route Handlers ───────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/income', incomeRoutes);
app.use('/api/v1/expense', expenseRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/feedback', feedbackRoutes);

// ─── Health Check Endpoint ────────────────────────────────────────────────────
app.get('/api/v1/health', async (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
    });
});

// ─── Diagnostic SMTP Test — ADMIN ONLY (dev/internal use) ────────────────────
// Protected: only accessible when a valid ADMIN_SECRET header is sent
app.get('/api/v1/health/test-email', async (req, res) => {
    const adminSecret = process.env.ADMIN_SECRET;
    const providedSecret = req.headers['x-admin-secret'];

    if (!adminSecret || providedSecret !== adminSecret) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { sendEmail } = require('./utils/emailService');
    try {
        const result = await sendEmail({
            to: process.env.SMTP_USER || 'expensifya@gmail.com',
            subject: 'Expensify - SMTP Test Email',
            text: 'This is a test email to verify that SMTP is configured correctly.',
            html: '<p>This is a test email to verify that SMTP is configured correctly.</p>',
        });
        res.status(200).json({ success: true, message: 'Test email sent successfully.', result });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Email delivery failed',
            error: error.message,
        });
    }
});

// ─── Centralized Error Handling Middleware ────────────────────────────────────
app.use((err, req, res, next) => {
    logger.error(`Unhandled Error: ${err.message}`, err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

// ─── Startup Sequence ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;
const isProduction = process.env.NODE_ENV === 'production';

const startServer = async () => {
    try {
        // Step 1: Connect to MongoDB (exits on failure)
        await connectDB();

        // Step 2: Verify SMTP connectivity
        if (isSmtpConfigured() || process.env.RESEND_API_KEY) {
            const smtpOk = await verifySmtpConnection();

            if (isProduction && !smtpOk && !process.env.RESEND_API_KEY) {
                // In production, if SMTP fails and no Resend fallback, refuse to start
                logger.error('FATAL: SMTP connection failed in production and no Resend API key configured. Server cannot start without working email delivery.');
                process.exit(1);
            } else if (!smtpOk) {
                logger.warn('WARNING: SMTP connection verification failed. Email delivery may not work. Check SMTP configuration.');
            }
        } else {
            const msg = 'No email provider configured (SMTP or Resend). Email delivery will fail.';
            if (isProduction) {
                logger.error(`FATAL: ${msg}`);
                process.exit(1);
            } else {
                logger.warn(msg);
            }
        }

        // Step 3: Start HTTP server
        app.listen(PORT, () => {
            logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });
    } catch (error) {
        logger.error(`Server startup failed: ${error.message}`, error);
        process.exit(1);
    }
};

startServer();
