const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            error: 'Too Many Requests',
            message: message || 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            res.status(429).json({
                error: 'Too Many Requests',
                message: message || 'Rate limit exceeded. Please try again later.',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};

// General rate limiter: 60 requests per minute
const generalLimiter = createRateLimiter(
    parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 60,
    'Too many requests from this IP, please try again later.'
);

// Stricter limiter for authentication endpoints
const authLimiter = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts per 15 minutes
    'Too many authentication attempts, please try again later.'
);

// Moderate limiter for ticket creation
const ticketCreationLimiter = createRateLimiter(
    60 * 1000, // 1 minute
    10, // 10 ticket creations per minute
    'Too many ticket creation attempts, please slow down.'
);

module.exports = {
    generalLimiter,
    authLimiter,
    ticketCreationLimiter
};

