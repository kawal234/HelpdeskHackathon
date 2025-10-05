const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/connection');

class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.role = data.role;
        this.createdAt = data.created_at;
        this.updatedAt = data.updated_at;
    }

    static async create({ username, email, password, role = 'user' }) {
        const passwordHash = await bcrypt.hash(password, 12);
        
        const result = await db.run(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, passwordHash, role]
        );

        return this.findById(result.id);
    }

    static async findById(id) {
        const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
        return user ? new User(user) : null;
    }

    static async findByEmail(email) {
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        return user ? new User(user) : null;
    }

    static async findByUsername(username) {
        const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        return user ? new User(user) : null;
    }

    static async findAll(limit = 50, offset = 0) {
        const users = await db.query(
            'SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        return users.map(user => new User(user));
    }

    async validatePassword(password) {
        const user = await db.get('SELECT password_hash FROM users WHERE id = ?', [this.id]);
        return bcrypt.compare(password, user.password_hash);
    }

    async updatePassword(newPassword) {
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await db.run(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [passwordHash, this.id]
        );
    }

    async updateRole(newRole) {
        await db.run(
            'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newRole, this.id]
        );
        this.role = newRole;
    }

    generateToken() {
        return jwt.sign(
            { 
                id: this.id, 
                username: this.username, 
                email: this.email, 
                role: this.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
    }

    static verifyToken(token) {
        return jwt.verify(token, process.env.JWT_SECRET);
    }

    toJSON() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            role: this.role,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    // Check if user has permission for a specific action
    canAccessTicket(ticket) {
        if (this.role === 'admin' || this.role === 'agent') {
            return true;
        }
        return ticket.createdBy === this.id || ticket.created_by === this.id;
    }

    canModifyTicket(ticket) {
        if (this.role === 'admin') {
            return true;
        }
        if (this.role === 'agent') {
            return true;
        }
        return (ticket.createdBy === this.id || ticket.created_by === this.id) && ticket.status === 'open';
    }

    canAssignTicket() {
        return this.role === 'admin' || this.role === 'agent';
    }
}

module.exports = User;
