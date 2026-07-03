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
        await mongoose.connect(process.env.MONGO_URI, {});
        logger.info('MongoDB initial connection established successfully');
    } catch (error) {
        logger.error(`MongoDB connection failed: ${error.message}`);
        process.exit(1); // Exit the process with failure
    }
};

module.exports = connectDB;
