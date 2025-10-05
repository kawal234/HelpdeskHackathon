const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');
const {
    validateUserId,
    validatePagination
} = require('../middleware/validation');

// Apply general rate limiting to all user routes
router.use(generalLimiter);

// All user management routes require admin access
router.use(authenticate);
router.use(requireAdmin);

// Get all users
router.get('/', 
    validatePagination,
    userController.getUsers
);

// Get specific user
router.get('/:id', 
    validateUserId,
    userController.getUser
);

// Update user role
router.patch('/:id/role', 
    validateUserId,
    userController.updateUserRole
);

// Delete user
router.delete('/:id', 
    validateUserId,
    userController.deleteUser
);

module.exports = router;

