require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const helmet = require('helmet');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { verifyEmailConnection, sendEmail } = require('./utils/emailService');

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
        email: process.env.RESEND_API_KEY ? 'configured' : 'not configured',
    });
});

// ─── Diagnostic Email Test — ADMIN ONLY ──────────────────────────────────────
app.get('/api/v1/health/test-email', async (req, res) => {
    const adminSecret = process.env.ADMIN_SECRET;
    const providedSecret = req.headers['x-admin-secret'];

    if (!adminSecret || providedSecret !== adminSecret) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    try {
        const result = await sendEmail({
            to: process.env.ADMIN_EMAIL || 'expensifya@gmail.com',
            subject: 'Expensify — Email Delivery Test',
            text: 'This is a test email to verify Resend API is configured correctly.',
            html: '<p>This is a test email to verify <strong>Resend API</strong> is configured correctly.</p>',
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
        // Step 0: Verify required environment variables
        const requiredVars = ['RESEND_API_KEY', 'JWT_SECRET', 'FRONTEND_URL', 'BACKEND_URL'];
        const missingVars = requiredVars.filter(v => !process.env[v]);
        const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        
        if (!dbUri) {
            missingVars.push('MONGODB_URI/MONGO_URI');
        }

        if (missingVars.length > 0) {
            const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
            if (isProduction) {
                logger.error(`FATAL: ${errorMsg}`);
                process.exit(1);
            } else {
                logger.warn(`WARNING: ${errorMsg}`);
            }
        }

        // Step 1: Connect to MongoDB (exits on failure via connectDB)
        await connectDB();

        // Step 2: Verify Resend API connectivity
        if (process.env.RESEND_API_KEY) {
            const emailOk = await verifyEmailConnection();

            if (isProduction && !emailOk) {
                logger.error('FATAL: Resend API connection failed in production. Server cannot start without working email delivery.');
                process.exit(1);
            } else if (!emailOk) {
                logger.warn('WARNING: Resend API verification failed. Email delivery may not work.');
            }
        } else {
            const msg = 'RESEND_API_KEY not configured. Email delivery will fail.';
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
