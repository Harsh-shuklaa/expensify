const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const appLogPath = path.join(logDir, 'app.log');
const errorLogPath = path.join(logDir, 'error.log');

const writeLog = (level, message, meta = '') => {
    const timestamp = new Date().toISOString();
    const metaString = meta ? (meta instanceof Error ? `\n${meta.stack}` : ` | Meta: ${JSON.stringify(meta)}`) : '';
    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}\n`;

    // Console output
    if (level === 'error') {
        console.error(logLine.trim());
    } else if (level === 'warn') {
        console.warn(logLine.trim());
    } else {
        console.log(logLine.trim());
    }

    // Write to app.log
    fs.appendFile(appLogPath, logLine, (err) => {
        if (err) console.error('Failed to write to app.log:', err);
    });

    // Write to error.log
    if (level === 'error') {
        fs.appendFile(errorLogPath, logLine, (err) => {
            if (err) console.error('Failed to write to error.log:', err);
        });
    }
};

const logger = {
    info: (message, meta) => writeLog('info', message, meta),
    warn: (message, meta) => writeLog('warn', message, meta),
    error: (message, meta) => writeLog('error', message, meta),
    debug: (message, meta) => writeLog('debug', message, meta)
};

module.exports = logger;
