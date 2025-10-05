-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'agent', 'admin')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to INTEGER,
    created_by INTEGER NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    sla_due_date DATETIME,
    sla_breached BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Comments table (threaded communication)
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id)
);

-- Ticket history table (for audit trail)
CREATE TABLE IF NOT EXISTS ticket_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Idempotency tracking table
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key VARCHAR(255) UNIQUE NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_sla_due_date ON tickets(sla_due_date);
CREATE INDEX IF NOT EXISTS idx_comments_ticket_id ON comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket_id ON ticket_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_key ON idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_keys(expires_at);

-- Full-text search indexes
CREATE VIRTUAL TABLE IF NOT EXISTS tickets_fts USING fts5(
    title, 
    description, 
    content=tickets, 
    content_rowid=id
);

CREATE VIRTUAL TABLE IF NOT EXISTS comments_fts USING fts5(
    content, 
    content=comments, 
    content_rowid=id
);
