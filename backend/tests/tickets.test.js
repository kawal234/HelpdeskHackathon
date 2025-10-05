const request = require('supertest');
const app = require('../src/server');
const db = require('../src/database/connection');

describe('Ticket Endpoints', () => {
    let authToken;
    let ticketId;

    beforeAll(async () => {
        // Connect to test database
        await db.connect();
        
        // Register and login a test user
        const userData = {
            username: 'tickettest',
            email: 'tickettest@example.com',
            password: 'Test123!',
            role: 'user'
        };

        await request(app)
            .post('/api/auth/register')
            .set('Idempotency-Key', 'test-user-register')
            .send(userData);

        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: userData.email,
                password: userData.password
            });

        authToken = loginResponse.body.token;
    });

    afterAll(async () => {
        // Clean up test database
        await db.close();
    });

    describe('POST /api/tickets', () => {
        it('should create a new ticket successfully', async () => {
            const ticketData = {
                title: 'Test Ticket',
                description: 'This is a test ticket description',
                priority: 'medium'
            };

            const response = await request(app)
                .post('/api/tickets')
                .set('Authorization', `Bearer ${authToken}`)
                .set('Idempotency-Key', 'test-ticket-1')
                .send(ticketData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Ticket created successfully');
            expect(response.body).toHaveProperty('ticket');
            expect(response.body.ticket.title).toBe(ticketData.title);
            expect(response.body.ticket.description).toBe(ticketData.description);
            expect(response.body.ticket.priority).toBe(ticketData.priority);
            expect(response.body.ticket.status).toBe('open');

            ticketId = response.body.ticket.id;
        });

        it('should fail without authentication', async () => {
            const ticketData = {
                title: 'Test Ticket 2',
                description: 'This is a test ticket description',
                priority: 'medium'
            };

            const response = await request(app)
                .post('/api/tickets')
                .set('Idempotency-Key', 'test-ticket-2')
                .send(ticketData);

            expect(response.status).toBe(401);
        });

        it('should fail with invalid data', async () => {
            const ticketData = {
                title: 'Short', // Too short
                description: 'Short', // Too short
                priority: 'invalid' // Invalid priority
            };

            const response = await request(app)
                .post('/api/tickets')
                .set('Authorization', `Bearer ${authToken}`)
                .set('Idempotency-Key', 'test-ticket-3')
                .send(ticketData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Validation Error');
        });
    });

    describe('GET /api/tickets', () => {
        it('should get all tickets', async () => {
            const response = await request(app)
                .get('/api/tickets')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('tickets');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.tickets)).toBe(true);
        });

        it('should filter tickets by status', async () => {
            const response = await request(app)
                .get('/api/tickets?status=open')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.tickets.every(ticket => ticket.status === 'open')).toBe(true);
        });

        it('should filter tickets by priority', async () => {
            const response = await request(app)
                .get('/api/tickets?priority=medium')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.tickets.every(ticket => ticket.priority === 'medium')).toBe(true);
        });

        it('should support pagination', async () => {
            const response = await request(app)
                .get('/api/tickets?limit=1&offset=0')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.pagination.limit).toBe(1);
            expect(response.body.pagination.offset).toBe(0);
        });
    });

    describe('GET /api/tickets/:id', () => {
        it('should get a specific ticket', async () => {
            const response = await request(app)
                .get(`/api/tickets/${ticketId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('ticket');
            expect(response.body).toHaveProperty('comments');
            expect(response.body).toHaveProperty('history');
            expect(response.body.ticket.id).toBe(ticketId);
        });

        it('should return 404 for non-existent ticket', async () => {
            const response = await request(app)
                .get('/api/tickets/99999')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error', 'Not Found');
        });
    });

    describe('PATCH /api/tickets/:id', () => {
        it('should update a ticket successfully', async () => {
            const updateData = {
                title: 'Updated Test Ticket',
                status: 'in_progress',
                version: 1
            };

            const response = await request(app)
                .patch(`/api/tickets/${ticketId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Ticket updated successfully');
            expect(response.body.ticket.title).toBe(updateData.title);
            expect(response.body.ticket.status).toBe(updateData.status);
        });

        it('should fail with version conflict', async () => {
            const updateData = {
                title: 'Another Update',
                version: 1 // Wrong version
            };

            const response = await request(app)
                .patch(`/api/tickets/${ticketId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(409);
            expect(response.body).toHaveProperty('error', 'Conflict');
        });
    });

    describe('POST /api/tickets/:id/comments', () => {
        it('should add a comment to a ticket', async () => {
            const commentData = {
                content: 'This is a test comment'
            };

            const response = await request(app)
                .post(`/api/tickets/${ticketId}/comments`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(commentData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Comment added successfully');
            expect(response.body).toHaveProperty('commentId');
        });

        it('should add a reply comment', async () => {
            // First get the ticket to see existing comments
            const ticketResponse = await request(app)
                .get(`/api/tickets/${ticketId}`)
                .set('Authorization', `Bearer ${authToken}`);

            const comments = ticketResponse.body.comments;
            const parentCommentId = comments[0].id;

            const commentData = {
                content: 'This is a reply to the first comment',
                parentCommentId: parentCommentId
            };

            const response = await request(app)
                .post(`/api/tickets/${ticketId}/comments`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(commentData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Comment added successfully');
        });
    });

    describe('GET /api/tickets/search', () => {
        it('should search tickets by query', async () => {
            const response = await request(app)
                .get('/api/tickets/search?q=test')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('tickets');
            expect(Array.isArray(response.body.tickets)).toBe(true);
        });
    });
});
