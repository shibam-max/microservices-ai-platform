/**
 * Notification Routes
 */

const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const logger = require('../services/logger');
const { authenticateToken, validateInput, rateLimiter } = require('../middleware/authMiddleware');

// Apply rate limiting and input validation to all routes
router.use(rateLimiter());
router.use(validateInput);

// Send notification
router.post('/send', authenticateToken, async (req, res) => {
    try {
        const notification = await notificationService.createNotification(req.body);
        
        // Send real-time notification via WebSocket
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${req.body.userId}`).emit('notification', notification);
        }
        
        res.status(201).json({
            success: true,
            notification
        });
        
    } catch (error) {
        logger.error('Failed to send notification:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get user notifications
router.get('/user/:userId', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;
        
        const notifications = await notificationService.getNotificationsByUserId(userId, parseInt(limit));
        
        res.json({
            success: true,
            notifications,
            count: notifications.length
        });
        
    } catch (error) {
        logger.error('Failed to get user notifications:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await notificationService.markAsRead(id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                error: 'Notification not found'
            });
        }
        
        res.json({
            success: true,
            notification
        });
        
    } catch (error) {
        logger.error('Failed to mark notification as read:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;