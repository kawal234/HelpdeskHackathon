const db = require('../database/connection');

class Ticket {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.description = data.description;
        this.status = data.status;
        this.priority = data.priority;
        this.assignedTo = data.assigned_to;
        this.createdBy = data.created_by;
        this.version = data.version;
        this.slaDueDate = data.sla_due_date;
        this.slaBreached = data.sla_breached;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    static async create({ title, description, priority = 'medium', createdBy, assignedTo = null }) {
        const slaHours = this.getSLAHours(priority);
        const slaDueDate = new Date();
        slaDueDate.setHours(slaDueDate.getHours() + slaHours);

        const result = await db.run(
            `INSERT INTO tickets (title, description, priority, created_by, assigned_to, sla_due_date) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [title, description, priority, createdBy, assignedTo, slaDueDate.toISOString()]
        );

        // Log ticket creation
        await db.run(
            'INSERT INTO ticket_history (ticket_id, user_id, action, new_value) VALUES (?, ?, ?, ?)',
            [result.id, createdBy, 'created', JSON.stringify({ title, description, priority })]
        );

        return this.findById(result.id);
    }

    static async findById(id) {
        const ticket = await db.get('SELECT * FROM tickets WHERE id = ?', [id]);
        return ticket ? new Ticket(ticket) : null;
    }

    static async findAll(filters = {}, limit = 50, offset = 0) {
        let query = 'SELECT * FROM tickets WHERE 1=1';
        const params = [];

        if (filters.status) {
            query += ' AND status = ?';
            params.push(filters.status);
        }

        if (filters.priority) {
            query += ' AND priority = ?';
            params.push(filters.priority);
        }

        if (filters.assignedTo) {
            query += ' AND assigned_to = ?';
            params.push(filters.assignedTo);
        }

        if (filters.createdBy) {
            query += ' AND created_by = ?';
            params.push(filters.createdBy);
        }

        if (filters.slaBreached !== undefined) {
            query += ' AND sla_breached = ?';
            params.push(filters.slaBreached);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const tickets = await db.query(query, params);
        return tickets.map(ticket => new Ticket(ticket));
    }

    static async search(query, limit = 50, offset = 0) {
        const searchQuery = `
            SELECT t.* FROM tickets t
            LEFT JOIN comments c ON t.id = c.ticket_id
            WHERE t.title LIKE ? OR t.description LIKE ? OR c.content LIKE ?
            GROUP BY t.id
            ORDER BY t.created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const searchTerm = `%${query}%`;
        const tickets = await db.query(searchQuery, [searchTerm, searchTerm, searchTerm, limit, offset]);
        return tickets.map(ticket => new Ticket(ticket));
    }

    static async findSlaBreached() {
        const now = new Date().toISOString();
        const tickets = await db.query(
            'SELECT * FROM tickets WHERE sla_due_date < ? AND status NOT IN ("resolved", "closed")',
            [now]
        );
        return tickets.map(ticket => new Ticket(ticket));
    }

    async update(updates, userId) {
        const allowedFields = ['title', 'description', 'status', 'priority', 'assigned_to'];
        const updateFields = [];
        const params = [];

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key) && value !== undefined) {
                updateFields.push(`${key} = ?`);
                params.push(value);
            }
        }

        if (updateFields.length === 0) {
            throw new Error('No valid fields to update');
        }

        // Add version check and increment
        updateFields.push('version = version + 1');
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(this.version, this.id);

        const result = await db.run(
            `UPDATE tickets SET ${updateFields.join(', ')} WHERE id = ? AND version = ?`,
            params
        );

        if (result.changes === 0) {
            throw new Error('Ticket was modified by another user. Please refresh and try again.');
        }

        // Log changes
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key) && value !== undefined) {
                await db.run(
                    'INSERT INTO ticket_history (ticket_id, user_id, action, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
                    [this.id, userId, `updated_${key}`, this[key], value]
                );
            }
        }

        // Update SLA if priority changed
        if (updates.priority) {
            const slaHours = Ticket.getSLAHours(updates.priority);
            const slaDueDate = new Date();
            slaDueDate.setHours(slaDueDate.getHours() + slaHours);
            
            await db.run(
                'UPDATE tickets SET sla_due_date = ? WHERE id = ?',
                [slaDueDate.toISOString(), this.id]
            );
        }

        // Check for SLA breach
        await this.checkSlaBreach();

        return this.findById(this.id);
    }

    async checkSlaBreach() {
        const now = new Date();
        const dueDate = new Date(this.slaDueDate);
        
        if (now > dueDate && !['resolved', 'closed'].includes(this.status)) {
            await db.run(
                'UPDATE tickets SET sla_breached = TRUE WHERE id = ?',
                [this.id]
            );
            this.slaBreached = true;
        }
    }

    static getSLAHours(priority) {
        const slaConfig = {
            urgent: parseInt(process.env.PRIORITY_SLA_HOURS_HIGH) || 4,
            high: parseInt(process.env.PRIORITY_SLA_HOURS_HIGH) || 4,
            medium: parseInt(process.env.PRIORITY_SLA_HOURS_MEDIUM) || 12,
            low: parseInt(process.env.PRIORITY_SLA_HOURS_LOW) || 48
        };
        return slaConfig[priority] || parseInt(process.env.DEFAULT_SLA_HOURS) || 24;
    }

    async getComments() {
        const comments = await db.query(
            'SELECT * FROM comments WHERE ticket_id = ? ORDER BY created_at ASC',
            [this.id]
        );
        return comments;
    }

    async addComment(content, userId, parentCommentId = null) {
        const result = await db.run(
            'INSERT INTO comments (ticket_id, user_id, content, parent_comment_id) VALUES (?, ?, ?, ?)',
            [this.id, userId, content, parentCommentId]
        );

        // Log comment addition
        await db.run(
            'INSERT INTO ticket_history (ticket_id, user_id, action, new_value) VALUES (?, ?, ?, ?)',
            [this.id, userId, 'commented', JSON.stringify({ commentId: result.id, content })]
        );

        return result.id;
    }

    async getHistory() {
        const history = await db.query(
            `SELECT th.*, u.username 
             FROM ticket_history th 
             JOIN users u ON th.user_id = u.id 
             WHERE th.ticket_id = ? 
             ORDER BY th.created_at ASC`,
            [this.id]
        );
        return history;
    }

    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            status: this.status,
            priority: this.priority,
            assignedTo: this.assignedTo,
            createdBy: this.createdBy,
            version: this.version,
            slaDueDate: this.slaDueDate,
            slaBreached: this.slaBreached,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Ticket;

