/**
 * Custom middleware to sanitize incoming data against NoSQL Injection and basic XSS attacks.
 */

// Helper to recursively remove keys starting with '$' or containing '.' (NoSQL Injection)
const sanitizeNoSQL = (obj) => {
    if (obj instanceof Array) {
        for (let i = 0; i < obj.length; i++) {
            if (typeof obj[i] === 'object' && obj[i] !== null) {
                sanitizeNoSQL(obj[i]);
            }
        }
    } else if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach((key) => {
            if (key.startsWith('$') || key.includes('.')) {
                delete obj[key];
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeNoSQL(obj[key]);
            }
        }
        );
    }
    return obj;
};

// Helper to escape simple HTML characters from strings to prevent basic XSS
const sanitizeXSSString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

const sanitizeXSS = (obj) => {
    if (obj instanceof Array) {
        for (let i = 0; i < obj.length; i++) {
            if (typeof obj[i] === 'string') {
                obj[i] = sanitizeXSSString(obj[i]);
            } else if (typeof obj[i] === 'object' && obj[i] !== null) {
                sanitizeXSS(obj[i]);
            }
        }
    } else if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach((key) => {
            if (typeof obj[key] === 'string') {
                obj[key] = sanitizeXSSString(obj[key]);
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                sanitizeXSS(obj[key]);
            }
        });
    }
    return obj;
};

const sanitizeInput = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeNoSQL(req.body);
        req.body = sanitizeXSS(req.body);
    }
    if (req.query) {
        req.query = sanitizeNoSQL(req.query);
        req.query = sanitizeXSS(req.query);
    }
    if (req.params) {
        req.params = sanitizeNoSQL(req.params);
        req.params = sanitizeXSS(req.params);
    }
    next();
};

module.exports = { sanitizeInput };
