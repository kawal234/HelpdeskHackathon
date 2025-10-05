const User = require('../models/User');
const { updateIdempotencyResource } = require('../middleware/idempotency');

const register = async (req, res) => {
    try {
        const { username, email, password, role = 'user' } = req.body;

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'User with this email already exists'
            });
        }

        const existingUsername = await User.findByUsername(username);
        if (existingUsername) {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Username already taken'
            });
        }

        const user = await User.create({ username, email, password, role });
        const token = user.generateToken();

        // Update idempotency resource if applicable
        await updateIdempotencyResource(req, user.id);

        res.status(201).json({
            message: 'User registered successfully',
            user: user.toJSON(),
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to register user'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid credentials'
            });
        }

        const isValidPassword = await user.validatePassword(password);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid credentials'
            });
        }

        const token = user.generateToken();

        res.json({
            message: 'Login successful',
            user: user.toJSON(),
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to login'
        });
    }
};

const getProfile = async (req, res) => {
    try {
        res.json({
            user: req.user.toJSON()
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to get user profile'
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        const userId = req.user.id;

        // Check if email is already taken by another user
        if (email && email !== req.user.email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== userId) {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Email already taken by another user'
                });
            }
        }

        // Check if username is already taken by another user
        if (username && username !== req.user.username) {
            const existingUser = await User.findByUsername(username);
            if (existingUser && existingUser.id !== userId) {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Username already taken by another user'
                });
            }
        }

        // Update user profile
        const db = require('../database/connection');
        
        if (username) {
            await db.run(
                'UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [username, userId]
            );
        }

        if (email) {
            await db.run(
                'UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [email, userId]
            );
        }

        const updatedUser = await User.findById(userId);

        res.json({
            message: 'Profile updated successfully',
            user: updatedUser.toJSON()
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to update profile'
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = req.user;

        // Verify current password
        const isValidPassword = await user.validatePassword(currentPassword);
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Current password is incorrect'
            });
        }

        // Update password
        await user.updatePassword(newPassword);

        res.json({
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to change password'
        });
    }
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword
};
