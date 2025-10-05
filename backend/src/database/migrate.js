const db = require('./connection');
const fs = require('fs');
const path = require('path');

const runMigrations = async () => {
    try {
        console.log('Starting database migration...');
        
        await db.connect();
        
        // Read and execute schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        await db.run(schema);
        
        console.log('Database migration completed successfully');
        
        // Create some sample data for testing
        await createSampleData();
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await db.close();
    }
};

const createSampleData = async () => {
    try {
        console.log('Creating sample data...');
        
        // Check if sample data already exists
        const existingUsers = await db.query('SELECT COUNT(*) as count FROM users');
        if (existingUsers[0].count > 0) {
            console.log('Sample data already exists, skipping...');
            return;
        }

        // Create sample users
        const users = [
            {
                username: 'admin',
                email: 'admin@helpdesk.com',
                password: 'Admin123!',
                role: 'admin'
            },
            {
                username: 'agent1',
                email: 'agent1@helpdesk.com',
                password: 'Agent123!',
                role: 'agent'
            },
            {
                username: 'user1',
                email: 'user1@helpdesk.com',
                password: 'User123!',
                role: 'user'
            },
            {
                username: 'user2',
                email: 'user2@helpdesk.com',
                password: 'User123!',
                role: 'user'
            }
        ];

        for (const userData of users) {
            const bcrypt = require('bcryptjs');
            const passwordHash = await bcrypt.hash(userData.password, 12);
            
            await db.run(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [userData.username, userData.email, passwordHash, userData.role]
            );
        }

        // Create sample tickets
        const tickets = [
            {
                title: 'Login issues with mobile app',
                description: 'Users are unable to login to the mobile application. Getting authentication error.',
                priority: 'high',
                created_by: 3, // user1
                assigned_to: 2  // agent1
            },
            {
                title: 'Database connection timeout',
                description: 'Application is experiencing database connection timeouts during peak hours.',
                priority: 'urgent',
                created_by: 4, // user2
                assigned_to: 2  // agent1
            },
            {
                title: 'Feature request: Dark mode',
                description: 'Would like to request a dark mode option for the web interface.',
                priority: 'low',
                created_by: 3, // user1
                assigned_to: null
            }
        ];

        for (const ticketData of tickets) {
            const slaHours = getSLAHours(ticketData.priority);
            const slaDueDate = new Date();
            slaDueDate.setHours(slaDueDate.getHours() + slaHours);

            const result = await db.run(
                'INSERT INTO tickets (title, description, priority, created_by, assigned_to, sla_due_date) VALUES (?, ?, ?, ?, ?, ?)',
                [ticketData.title, ticketData.description, ticketData.priority, ticketData.created_by, ticketData.assigned_to, slaDueDate.toISOString()]
            );

            // Add some sample comments
            const comments = [
                {
                    ticket_id: result.id,
                    user_id: ticketData.created_by,
                    content: 'This issue started happening yesterday after the latest update.'
                },
                {
                    ticket_id: result.id,
                    user_id: ticketData.assigned_to || ticketData.created_by,
                    content: 'I will investigate this issue and provide an update soon.'
                }
            ];

            for (const comment of comments) {
                await db.run(
                    'INSERT INTO comments (ticket_id, user_id, content) VALUES (?, ?, ?)',
                    [comment.ticket_id, comment.user_id, comment.content]
                );
            }

            // Add ticket history
            await db.run(
                'INSERT INTO ticket_history (ticket_id, user_id, action, new_value) VALUES (?, ?, ?, ?)',
                [result.id, ticketData.created_by, 'created', JSON.stringify({ title: ticketData.title, description: ticketData.description, priority: ticketData.priority })]
            );
        }

        console.log('Sample data created successfully');
        console.log('\nSample users created:');
        console.log('Admin: admin@helpdesk.com / Admin123!');
        console.log('Agent: agent1@helpdesk.com / Agent123!');
        console.log('User: user1@helpdesk.com / User123!');
        console.log('User: user2@helpdesk.com / User123!');
        
    } catch (error) {
        console.error('Error creating sample data:', error);
        throw error;
    }
};

const getSLAHours = (priority) => {
    const slaConfig = {
        urgent: 4,
        high: 4,
        medium: 12,
        low: 48
    };
    return slaConfig[priority] || 24;
};

// Run migrations if this file is executed directly
if (require.main === module) {
    runMigrations();
}

module.exports = { runMigrations };

