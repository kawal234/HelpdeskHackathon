require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const db = require('./database/connection');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));

// CORS configuration
app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Requested-With']
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
const path = require('path');
const staticPath = process.env.NODE_ENV === 'production' 
    ? path.join(__dirname, '../../frontend/public')
    : path.join(__dirname, '../../../frontend/public');
app.use(express.static(staticPath));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'HelpDesk Mini API',
        version: '1.0.0',
        description: 'A robust ticketing system API with SLA tracking and RBAC',
        endpoints: {
            auth: {
                'POST /api/auth/register': 'Register a new user',
                'POST /api/auth/login': 'Login user',
                'GET /api/auth/profile': 'Get user profile',
                'PUT /api/auth/profile': 'Update user profile',
                'PUT /api/auth/change-password': 'Change user password'
            },
            tickets: {
                'POST /api/tickets': 'Create a new ticket',
                'GET /api/tickets': 'Get all tickets (with filtering)',
                'GET /api/tickets/search': 'Search tickets',
                'GET /api/tickets/sla-breached': 'Get SLA breached tickets',
                'GET /api/tickets/:id': 'Get specific ticket',
                'PATCH /api/tickets/:id': 'Update ticket',
                'POST /api/tickets/:id/comments': 'Add comment to ticket',
                'GET /api/tickets/:id/history': 'Get ticket history'
            },
            users: {
                'GET /api/users': 'Get all users (admin only)',
                'GET /api/users/:id': 'Get specific user (admin only)',
                'PATCH /api/users/:id/role': 'Update user role (admin only)',
                'DELETE /api/users/:id': 'Delete user (admin only)'
            }
        },
        features: [
            'Role-based access control (RBAC)',
            'SLA tracking and breach detection',
            'Optimistic locking for concurrent updates',
            'Threaded comments system',
            'Full-text search',
            'Rate limiting (60 requests/minute)',
            'Idempotency support for POST requests',
            'Pagination for list endpoints',
            'Comprehensive audit trail'
        ]
    });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
    
    try {
        await db.close();
        console.log('Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
    try {
        await db.connect();
        app.listen(PORT, () => {
            console.log(`🚀 HelpDesk Mini API server running on port ${PORT}`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
            console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
