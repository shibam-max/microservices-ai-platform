/**
 * Notification Service for managing notifications
 */

const logger = require('./logger');

class NotificationService {
    constructor() {
        this.notifications = new Map(); // In-memory storage for demo
    }
    
    async createNotification(notification) {
        try {
            const id = Date.now().toString();
            const savedNotification = {
                id,
                ...notification,
                createdAt: new Date().toISOString(),
                read: false
            };
            
            this.notifications.set(id, savedNotification);
            logger.info(`Notification created with ID: ${id}`);
            
            return savedNotification;
            
        } catch (error) {
            logger.error('Failed to create notification:', error);
            throw error;
        }
    }
    
    async getNotificationsByUserId(userId, limit = 50) {
        try {
            const userNotifications = Array.from(this.notifications.values())
                .filter(notification => notification.userId === userId)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, limit);
            
            return userNotifications;
            
        } catch (error) {
            logger.error(`Failed to get notifications for user ${userId}:`, error);
            return [];
        }
    }
    
    async markAsRead(notificationId) {
        try {
            const notification = this.notifications.get(notificationId);
            if (notification) {
                notification.read = true;
                notification.readAt = new Date().toISOString();
                this.notifications.set(notificationId, notification);
                logger.info(`Notification ${notificationId} marked as read`);
                return notification;
            }
            return null;
            
        } catch (error) {
            logger.error(`Failed to mark notification ${notificationId} as read:`, error);
            throw error;
        }
    }
    
    async sendExternalNotification(notification) {
        try {
            // Simulate external notification sending (email, push, SMS)
            logger.info(`External notification sent: ${notification.type} to user ${notification.userId}`);
            
            // Here you would integrate with:
            // - Email service (SendGrid, AWS SES)
            // - Push notification service (Firebase, AWS SNS)
            // - SMS service (Twilio, AWS SNS)
            
        } catch (error) {
            logger.error('Failed to send external notification:', error);
        }
    }
}

module.exports = new NotificationService();