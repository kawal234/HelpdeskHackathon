const User = require('../models/User');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'No valid authorization header provided'
            });
        }

        const token = authHeader.substring(7);
        const decoded = User.verifyToken(token);
        
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'User not found'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid token'
        });
    }
};

const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

const requireAdmin = requireRole(['admin']);
const requireAgent = requireRole(['admin', 'agent']);
const requireUser = requireRole(['admin', 'agent', 'user']);

module.exports = {
    authenticate,
    requireRole,
    requireAdmin,
    requireAgent,
    requireUser
};

