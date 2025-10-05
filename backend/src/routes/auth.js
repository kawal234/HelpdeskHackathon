const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { idempotencyMiddleware } = require('../middleware/idempotency');
const {
    validateUserRegistration,
    validateUserLogin,
    validatePagination
} = require('../middleware/validation');

// Public routes
router.post('/register', 
    authLimiter,
    idempotencyMiddleware('user'),
    validateUserRegistration,
    authController.register
);

router.post('/login', 
    authLimiter,
    validateUserLogin,
    authController.login
);

// Protected routes
router.get('/profile', 
    authenticate,
    authController.getProfile
);

router.put('/profile', 
    authenticate,
    validatePagination, // Reusing validation middleware for basic validation
    authController.updateProfile
);

router.put('/change-password', 
    authenticate,
    authController.changePassword
);

module.exports = router;

