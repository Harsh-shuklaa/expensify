const mongoose = require('mongoose');
const dotenv = require('dotenv').config();
const logger = require('../utils/logger');

// Setup connection event listeners
mongoose.connection.on('connected', () => {
    logger.info('Mongoose default connection open to Database');
});

mongoose.connection.on('error', (err) => {
    logger.error(`Mongoose default connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose default connection disconnected. Attempting to reconnect...');
});

const connectDB = async () => {
    try {
        const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!dbUri) {
            throw new Error('Database URI (MONGODB_URI or MONGO_URI) is not configured');
        }
        await mongoose.connect(dbUri, {});
        logger.info('MongoDB initial connection established successfully');
    } catch (error) {
        logger.error(`MongoDB connection failed: ${error.message}`);
        process.exit(1); // Exit the process with failure
    }
};

module.exports = connectDB;
