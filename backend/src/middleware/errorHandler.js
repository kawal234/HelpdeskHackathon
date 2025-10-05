const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error response
    let status = 500;
    let message = 'Internal Server Error';
    let details = null;

    // Handle specific error types
    if (err.name === 'ValidationError') {
        status = 400;
        message = 'Validation Error';
        details = err.details || err.message;
    } else if (err.name === 'UnauthorizedError') {
        status = 401;
        message = 'Unauthorized';
    } else if (err.name === 'ForbiddenError') {
        status = 403;
        message = 'Forbidden';
    } else if (err.name === 'NotFoundError') {
        status = 404;
        message = 'Not Found';
    } else if (err.name === 'ConflictError') {
        status = 409;
        message = 'Conflict';
    } else if (err.name === 'TooManyRequestsError') {
        status = 429;
        message = 'Too Many Requests';
    } else if (err.code === 'SQLITE_CONSTRAINT') {
        status = 409;
        message = 'Database constraint violation';
        if (err.message.includes('UNIQUE')) {
            message = 'Resource already exists';
        }
    } else if (err.code === 'SQLITE_BUSY') {
        status = 503;
        message = 'Service temporarily unavailable';
    }

    // Handle custom error objects
    if (err.status) {
        status = err.status;
    }
    if (err.message) {
        message = err.message;
    }
    if (err.details) {
        details = err.details;
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && status === 500) {
        message = 'Internal Server Error';
        details = null;
    }

    const errorResponse = {
        error: message,
        message: message,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    };

    if (details) {
        errorResponse.details = details;
    }

    res.status(status).json(errorResponse);
};

const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};

