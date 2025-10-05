const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid input data',
            details: errors.array()
        });
    }
    next();
};

// User validation rules
const validateUserRegistration = [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('Username must be between 3 and 50 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    body('role')
        .optional()
        .isIn(['user', 'agent', 'admin'])
        .withMessage('Role must be user, agent, or admin'),
    handleValidationErrors
];

const validateUserLogin = [
    body('email')
        .isEmail()
        .withMessage('Must be a valid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    handleValidationErrors
];

// Ticket validation rules
const validateTicketCreation = [
    body('title')
        .isLength({ min: 5, max: 255 })
        .withMessage('Title must be between 5 and 255 characters'),
    body('description')
        .isLength({ min: 10 })
        .withMessage('Description must be at least 10 characters long'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be low, medium, high, or urgent'),
    body('assignedTo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Assigned user ID must be a positive integer'),
    handleValidationErrors
];

const validateTicketUpdate = [
    body('title')
        .optional()
        .isLength({ min: 5, max: 255 })
        .withMessage('Title must be between 5 and 255 characters'),
    body('description')
        .optional()
        .isLength({ min: 10 })
        .withMessage('Description must be at least 10 characters long'),
    body('status')
        .optional()
        .isIn(['open', 'in_progress', 'resolved', 'closed'])
        .withMessage('Status must be open, in_progress, resolved, or closed'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be low, medium, high, or urgent'),
    body('assignedTo')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Assigned user ID must be a positive integer'),
    body('version')
        .isInt({ min: 1 })
        .withMessage('Version number is required and must be a positive integer'),
    handleValidationErrors
];

// Comment validation rules
const validateCommentCreation = [
    body('content')
        .isLength({ min: 1 })
        .withMessage('Comment content cannot be empty')
        .isLength({ max: 5000 })
        .withMessage('Comment content must be less than 5000 characters'),
    body('parentCommentId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Parent comment ID must be a positive integer'),
    handleValidationErrors
];

// Parameter validation
const validateTicketId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Ticket ID must be a positive integer'),
    handleValidationErrors
];

const validateUserId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('User ID must be a positive integer'),
    handleValidationErrors
];

// Query validation
const validatePagination = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be a non-negative integer'),
    handleValidationErrors
];

const validateSearch = [
    query('q')
        .isLength({ min: 1 })
        .withMessage('Search query is required')
        .isLength({ max: 100 })
        .withMessage('Search query must be less than 100 characters'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateUserRegistration,
    validateUserLogin,
    validateTicketCreation,
    validateTicketUpdate,
    validateCommentCreation,
    validateTicketId,
    validateUserId,
    validatePagination,
    validateSearch
};

