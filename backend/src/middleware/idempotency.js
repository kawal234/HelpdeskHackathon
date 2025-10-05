const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');

const idempotencyMiddleware = (resourceType) => {
    return async (req, res, next) => {
        // Only apply to POST requests
        if (req.method !== 'POST') {
            return next();
        }

        const idempotencyKey = req.headers['idempotency-key'];
        
        if (!idempotencyKey) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Idempotency-Key header is required for POST requests'
            });
        }

        try {
            // Check if this key already exists
            const existing = await db.get(
                'SELECT * FROM idempotency_keys WHERE key = ? AND resource_type = ?',
                [idempotencyKey, resourceType]
            );

            if (existing) {
                // Check if the key has expired
                const now = new Date();
                const expiresAt = new Date(existing.expires_at);
                
                if (now > expiresAt) {
                    // Key expired, delete it and allow the request
                    await db.run('DELETE FROM idempotency_keys WHERE key = ?', [idempotencyKey]);
                } else {
                    // Key is still valid, return the existing resource
                    return res.status(200).json({
                        message: 'Request already processed',
                        resourceId: existing.resource_id,
                        processedAt: existing.created_at
                    });
                }
            }

            // Store the idempotency key
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiration

            await db.run(
                'INSERT INTO idempotency_keys (key, resource_type, expires_at) VALUES (?, ?, ?)',
                [idempotencyKey, resourceType, expiresAt.toISOString()]
            );

            // Store the key in the request for later use
            req.idempotencyKey = idempotencyKey;
            req.resourceType = resourceType;

            next();
        } catch (error) {
            console.error('Idempotency middleware error:', error);
            return res.status(500).json({
                error: 'Internal Server Error',
                message: 'Failed to process idempotency check'
            });
        }
    };
};

const updateIdempotencyResource = async (req, resourceId) => {
    if (req.idempotencyKey && req.resourceType) {
        try {
            await db.run(
                'UPDATE idempotency_keys SET resource_id = ? WHERE key = ?',
                [resourceId, req.idempotencyKey]
            );
        } catch (error) {
            console.error('Failed to update idempotency resource ID:', error);
        }
    }
};

module.exports = {
    idempotencyMiddleware,
    updateIdempotencyResource
};

