// Test setup file
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_PATH = './database/test.db';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = '1000'; // Higher limit for tests

