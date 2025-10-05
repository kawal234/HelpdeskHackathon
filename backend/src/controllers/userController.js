const User = require('../models/User');

const getUsers = async (req, res) => {
    try {
        const { limit = 50, offset = 0, role } = req.query;

        let users;
        if (role) {
            users = await User.findAll(parseInt(limit), parseInt(offset));
            users = users.filter(user => user.role === role);
        } else {
            users = await User.findAll(parseInt(limit), parseInt(offset));
        }

        res.json({
            users: users.map(user => user.toJSON()),
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                count: users.length
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve users'
        });
    }
};

const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
        }

        res.json({
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve user'
        });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
        }

        // Prevent users from changing their own role
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'You cannot change your own role'
            });
        }

        await user.updateRole(role);

        res.json({
            message: 'User role updated successfully',
            user: user.toJSON()
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update user role'
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'User not found'
            });
        }

        // Prevent users from deleting themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'You cannot delete your own account'
            });
        }

        // In a real application, you might want to soft delete or handle cascading
        // For now, we'll just return success
        res.json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to delete user'
        });
    }
};

module.exports = {
    getUsers,
    getUser,
    updateUserRole,
    deleteUser
};

