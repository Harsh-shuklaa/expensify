/**
 * Custom Cookie Parser Middleware to extract cookies from headers.
 * Populates req.cookies object.
 */
const cookieParser = (req, res, next) => {
    req.cookies = {};
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
        cookieHeader.split(';').forEach((cookie) => {
            const parts = cookie.split('=');
            if (parts.length >= 2) {
                const name = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                req.cookies[name] = decodeURIComponent(value);
            }
        });
    }
    next();
};

module.exports = cookieParser;
