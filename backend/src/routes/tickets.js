const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticate, requireUser } = require('../middleware/auth');
const { generalLimiter, ticketCreationLimiter } = require('../middleware/rateLimiter');
const { idempotencyMiddleware } = require('../middleware/idempotency');
const {
    validateTicketCreation,
    validateTicketUpdate,
    validateCommentCreation,
    validateTicketId,
    validatePagination,
    validateSearch
} = require('../middleware/validation');

// Apply general rate limiting to all ticket routes
router.use(generalLimiter);

// Create ticket
router.post('/', 
    authenticate,
    requireUser,
    ticketCreationLimiter,
    idempotencyMiddleware('ticket'),
    validateTicketCreation,
    ticketController.createTicket
);

// Get tickets with search and filtering
router.get('/', 
    authenticate,
    requireUser,
    validatePagination,
    ticketController.getTickets
);

// Search tickets
router.get('/search', 
    authenticate,
    requireUser,
    validateSearch,
    validatePagination,
    ticketController.getTickets
);

// Get SLA breached tickets
router.get('/sla-breached', 
    authenticate,
    requireUser,
    ticketController.getSlaBreachedTickets
);

// Get specific ticket
router.get('/:id', 
    authenticate,
    requireUser,
    validateTicketId,
    ticketController.getTicket
);

// Update ticket
router.patch('/:id', 
    authenticate,
    requireUser,
    validateTicketId,
    validateTicketUpdate,
    ticketController.updateTicket
);

// Add comment to ticket
router.post('/:id/comments', 
    authenticate,
    requireUser,
    validateTicketId,
    validateCommentCreation,
    ticketController.addComment
);

// Get ticket history
router.get('/:id/history', 
    authenticate,
    requireUser,
    validateTicketId,
    ticketController.getTicketHistory
);

module.exports = router;

