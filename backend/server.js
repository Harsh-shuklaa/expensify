require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const logger = require('./utils/logger');

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

// Trust reverse proxy (Render) to correctly identify client IPs and protocols (HTTP vs HTTPS)
app.set('trust proxy', 1);

// Ensure uploads and downloads directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir, { recursive: true });

// Enable CORS securely for multiple origins
const allowedOrigins = [
    'http://localhost:5173',
    'https://expensifyapp-h3qt.onrender.com'
];
if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ''));
}
const uniqueAllowedOrigins = [...new Set(allowedOrigins)];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps, postman, curl)
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

// Body Parsers & Cookie Parser
app.use(express.json({ limit: '10kb' })); // Rate limiting request body sizes
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser);

// Prevent NoSQL Injection & XSS attacks
app.use(sanitizeInput);

// Static uploads folder
app.use('/uploads', express.static(uploadsDir));

// Route handlers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/income', incomeRoutes);
app.use('/api/v1/expense', expenseRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/feedback', feedbackRoutes);

// Health Check Endpoint
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

// Diagnostic SMTP Email Test Endpoint
app.get('/api/v1/health/test-email', async (req, res) => {
    const { sendEmail } = require('./utils/emailService');
    try {
        const result = await sendEmail({
            to: process.env.SMTP_USER || 'expensifya@gmail.com',
            subject: 'Expensify - SMTP Test Email',
            text: 'This is a test email to verify that SMTP is configured correctly on Render.',
            html: '<p>This is a test email to verify that SMTP is configured correctly on Render.</p>',
        });
        res.status(200).json({
            success: true,
            message: 'Test email request processed.',
            result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to execute test email call',
            error: error.message,
            stack: error.stack
        });
    }
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    logger.error(`Unhandled Error: ${err.message}`, err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

const PORT = process.env.PORT || 8000;

connectDB();

app.listen(PORT, () => {
    logger.info(`Server is running in production readiness mode on port ${PORT}`);
});
