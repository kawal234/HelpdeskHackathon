const request = require('supertest');
const app = require('../src/server');
const db = require('../src/database/connection');

describe('Authentication Endpoints', () => {
    let authToken;
    let userId;

    beforeAll(async () => {
        await db.connect();
    });

    afterAll(async () => {
        await db.close();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const userData = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'Test123!',
                role: 'user'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .set('Idempotency-Key', 'test-register-1')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'User registered successfully');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user.email).toBe(userData.email);
            expect(response.body.user.username).toBe(userData.username);
            expect(response.body.user.role).toBe(userData.role);

            authToken = response.body.token;
            userId = response.body.user.id;
        });

        it('should fail with invalid email', async () => {
            const userData = {
                username: 'testuser2',
                email: 'invalid-email',
                password: 'Test123!'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .set('Idempotency-Key', 'test-register-2')
                .send(userData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Validation Error');
        });

        it('should fail with weak password', async () => {
            const userData = {
                username: 'testuser3',
                email: 'test3@example.com',
                password: 'weak'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .set('Idempotency-Key', 'test-register-3')
                .send(userData);

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error', 'Validation Error');
        });

        it('should fail with duplicate email', async () => {
            const userData = {
                username: 'testuser4',
                email: 'test@example.com', // Same email as first test
                password: 'Test123!'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .set('Idempotency-Key', 'test-register-4')
                .send(userData);

            expect(response.status).toBe(409);
            expect(response.body).toHaveProperty('error', 'Conflict');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'Test123!'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
        });

        it('should fail with invalid credentials', async () => {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });

        it('should fail with non-existent email', async () => {
            const loginData = {
                email: 'nonexistent@example.com',
                password: 'Test123!'
            };

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginData);

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });
    });

    describe('GET /api/auth/profile', () => {
        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.id).toBe(userId);
        });

        it('should fail without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });

        it('should fail with invalid token', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error', 'Unauthorized');
        });
    });
});
