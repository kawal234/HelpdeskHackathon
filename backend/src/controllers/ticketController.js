const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { updateIdempotencyResource } = require('../middleware/idempotency');

const createTicket = async (req, res) => {
    try {
        const { title, description, priority, assignedTo } = req.body;
        const createdBy = req.user.id;

        // Validate assigned user if provided
        if (assignedTo) {
            const assignedUser = await User.findById(assignedTo);
            if (!assignedUser) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Assigned user not found'
                });
            }
        }

        const ticket = await Ticket.create({
            title,
            description,
            priority,
            createdBy,
            assignedTo
        });

        // Update idempotency resource if applicable
        await updateIdempotencyResource(req, ticket.id);

        res.status(201).json({
            message: 'Ticket created successfully',
            ticket: ticket.toJSON()
        });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create ticket'
        });
    }
};

const getTickets = async (req, res) => {
    try {
        const {
            status,
            priority,
            assignedTo,
            createdBy,
            slaBreached,
            search,
            limit = 50,
            offset = 0
        } = req.query;

        let tickets;

        if (search) {
            tickets = await Ticket.search(search, parseInt(limit), parseInt(offset));
        } else {
            const filters = {};
            if (status) filters.status = status;
            if (priority) filters.priority = priority;
            if (assignedTo) filters.assignedTo = parseInt(assignedTo);
            if (createdBy) filters.createdBy = parseInt(createdBy);
            if (slaBreached !== undefined) filters.slaBreached = slaBreached === 'true';

            tickets = await Ticket.findAll(filters, parseInt(limit), parseInt(offset));
        }

        // Filter tickets based on user permissions
        const user = req.user;
        const accessibleTickets = tickets.filter(ticket => user.canAccessTicket(ticket));

        res.json({
            tickets: accessibleTickets.map(ticket => ticket.toJSON()),
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                count: accessibleTickets.length
            }
        });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve tickets'
        });
    }
};

const getTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Ticket not found'
            });
        }

        // Check if user can access this ticket
        if (!req.user.canAccessTicket(ticket)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to view this ticket'
            });
        }

        // Get comments and history
        const comments = await ticket.getComments();
        const history = await ticket.getHistory();

        res.json({
            ticket: ticket.toJSON(),
            comments,
            history
        });
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve ticket'
        });
    }
};

const updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const user = req.user;

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Ticket not found'
            });
        }

        // Check if user can modify this ticket
        if (!user.canModifyTicket(ticket)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to modify this ticket'
            });
        }

        // Validate assigned user if provided
        if (updates.assignedTo) {
            const assignedUser = await User.findById(updates.assignedTo);
            if (!assignedUser) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Assigned user not found'
                });
            }
        }

        // Remove version from updates as it's handled separately
        const { version, ...updateData } = updates;

        const updatedTicket = await ticket.update(updateData, user.id);

        res.json({
            message: 'Ticket updated successfully',
            ticket: updatedTicket.toJSON()
        });
    } catch (error) {
        if (error.message.includes('modified by another user')) {
            return res.status(409).json({
                error: 'Conflict',
                message: error.message
            });
        }

        console.error('Update ticket error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update ticket'
        });
    }
};

const addComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, parentCommentId } = req.body;
        const userId = req.user.id;

        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Ticket not found'
            });
        }

        // Check if user can access this ticket
        if (!req.user.canAccessTicket(ticket)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to comment on this ticket'
            });
        }

        // Validate parent comment if provided
        if (parentCommentId) {
            const comments = await ticket.getComments();
            const parentComment = comments.find(c => c.id === parentCommentId);
            if (!parentComment) {
                return res.status(400).json({
                    error: 'Bad Request',
                    message: 'Parent comment not found'
                });
            }
        }

        const commentId = await ticket.addComment(content, userId, parentCommentId);

        res.status(201).json({
            message: 'Comment added successfully',
            commentId
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to add comment'
        });
    }
};

const getSlaBreachedTickets = async (req, res) => {
    try {
        const tickets = await Ticket.findSlaBreached();
        
        // Filter based on user permissions
        const user = req.user;
        const accessibleTickets = tickets.filter(ticket => user.canAccessTicket(ticket));

        res.json({
            tickets: accessibleTickets.map(ticket => ticket.toJSON()),
            count: accessibleTickets.length
        });
    } catch (error) {
        console.error('Get SLA breached tickets error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve SLA breached tickets'
        });
    }
};

const getTicketHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await Ticket.findById(id);

        if (!ticket) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Ticket not found'
            });
        }

        // Check if user can access this ticket
        if (!req.user.canAccessTicket(ticket)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You do not have permission to view this ticket history'
            });
        }

        const history = await ticket.getHistory();

        res.json({
            ticketId: ticket.id,
            history
        });
    } catch (error) {
        console.error('Get ticket history error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve ticket history'
        });
    }
};

module.exports = {
    createTicket,
    getTickets,
    getTicket,
    updateTicket,
    addComment,
    getSlaBreachedTickets,
    getTicketHistory
};

