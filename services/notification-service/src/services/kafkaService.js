/**
 * Kafka Service for real-time event processing
 * 
 * Demonstrates event-driven architecture with NodeJS:
 * - Kafka consumer for processing events
 * - Real-time notification delivery
 * - Event routing and processing
 */

const { Kafka } = require('kafkajs');
const logger = require('./logger');
const notificationService = require('./notificationService');

class KafkaService {
    constructor() {
        this.kafka = new Kafka({
            clientId: 'notification-service',
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092']
        });
        
        this.consumer = this.kafka.consumer({ 
            groupId: 'notification-service-group',
            sessionTimeout: 30000,
            heartbeatInterval: 3000
        });
        
        this.producer = this.kafka.producer();
        this.io = null;
    }
    
    async connect() {
        try {
            await this.consumer.connect();
            await this.producer.connect();
            logger.info('Kafka service connected successfully');
        } catch (error) {
            logger.error('Failed to connect to Kafka:', error);
            throw error;
        }
    }
    
    async disconnect() {
        try {
            await this.consumer.disconnect();
            await this.producer.disconnect();
            logger.info('Kafka service disconnected');
        } catch (error) {
            logger.error('Error disconnecting from Kafka:', error);
            throw error;
        }
    }
    
    async startConsumers(io) {
        this.io = io;
        
        try {
            // Subscribe to relevant topics
            await this.consumer.subscribe({ 
                topics: [
                    'user-events',
                    'ml-events', 
                    'data-events',
                    'system-alerts'
                ],
                fromBeginning: false 
            });
            
            // Start consuming messages
            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        const event = JSON.parse(message.value.toString());
                        logger.info(`Received event from topic ${topic}:`, event);
                        
                        // Route event to appropriate handler
                        await this.handleEvent(topic, event);
                        
                    } catch (error) {
                        logger.error(`Error processing message from topic ${topic}:`, error);
                    }
                }
            });
            
            logger.info('Kafka consumers started successfully');
            
        } catch (error) {
            logger.error('Failed to start Kafka consumers:', error);
            throw error;
        }
    }
    
    async handleEvent(topic, event) {
        try {
            switch (topic) {
                case 'user-events':
                    await this.handleUserEvent(event);
                    break;
                    
                case 'ml-events':
                    await this.handleMLEvent(event);
                    break;
                    
                case 'data-events':
                    await this.handleDataEvent(event);
                    break;
                    
                case 'system-alerts':
                    await this.handleSystemAlert(event);
                    break;
                    
                default:
                    logger.warn(`Unknown topic: ${topic}`);
            }
        } catch (error) {
            logger.error(`Error handling event from topic ${topic}:`, error);
        }
    }
    
    async handleUserEvent(event) {
        try {
            const { eventType, userId, username } = event;
            
            let notification = null;
            
            switch (eventType) {
                case 'USER_CREATED':
                    notification = {
                        userId,
                        type: 'welcome',
                        title: 'Welcome to the Platform!',
                        message: `Hello ${username}, welcome to our AI-powered platform!`,
                        priority: 'normal'
                    };
                    break;
                    
                case 'USER_UPDATED':
                    notification = {
                        userId,
                        type: 'profile_update',
                        title: 'Profile Updated',
                        message: 'Your profile has been successfully updated.',
                        priority: 'low'
                    };
                    break;
                    
                case 'USER_DELETED':
                    notification = {
                        userId,
                        type: 'account_deletion',
                        title: 'Account Deactivated',
                        message: 'Your account has been deactivated.',
                        priority: 'high'
                    };
                    break;
            }
            
            if (notification) {
                await this.sendNotification(notification);
            }
            
        } catch (error) {
            logger.error('Error handling user event:', error);
        }
    }
    
    async handleMLEvent(event) {
        try {
            const { eventType, data } = event;
            
            switch (eventType) {
                case 'prediction_made':
                    if (data.userId) {
                        const notification = {
                            userId: data.userId,
                            type: 'ml_prediction',
                            title: 'Prediction Complete',
                            message: `Your ${data.model_name} prediction is ready!`,
                            priority: 'normal',
                            data: {
                                modelName: data.model_name,
                                confidence: data.prediction?.confidence
                            }
                        };
                        
                        await this.sendNotification(notification);
                    }
                    break;
                    
                case 'recommendations_generated':
                    const notification = {
                        userId: data.user_id,
                        type: 'recommendations',
                        title: 'New Recommendations',
                        message: `We have ${data.recommendations_count} new recommendations for you!`,
                        priority: 'normal'
                    };
                    
                    await this.sendNotification(notification);
                    break;
            }
            
        } catch (error) {
            logger.error('Error handling ML event:', error);
        }
    }
    
    async handleDataEvent(event) {
        try {
            const { eventType, data } = event;
            
            if (eventType === 'data_processing_complete' && data.userId) {
                const notification = {
                    userId: data.userId,
                    type: 'data_processing',
                    title: 'Data Processing Complete',
                    message: `Your ${data.dataType} data has been processed successfully.`,
                    priority: 'normal'
                };
                
                await this.sendNotification(notification);
            }
            
        } catch (error) {
            logger.error('Error handling data event:', error);
        }
    }
    
    async handleSystemAlert(event) {
        try {
            const { alertType, message, severity, affectedUsers } = event;
            
            // Send system-wide notifications
            if (affectedUsers && affectedUsers.length > 0) {
                for (const userId of affectedUsers) {
                    const notification = {
                        userId,
                        type: 'system_alert',
                        title: `System Alert: ${alertType}`,
                        message,
                        priority: severity || 'normal'
                    };
                    
                    await this.sendNotification(notification);
                }
            } else {
                // Broadcast to all connected users
                this.io.emit('system_alert', {
                    type: alertType,
                    message,
                    severity,
                    timestamp: new Date().toISOString()
                });
            }
            
        } catch (error) {
            logger.error('Error handling system alert:', error);
        }
    }
    
    async sendNotification(notification) {
        try {
            // Save notification to database
            const savedNotification = await notificationService.createNotification(notification);
            
            // Send real-time notification via WebSocket
            if (this.io) {
                this.io.to(`user_${notification.userId}`).emit('notification', savedNotification);
                logger.info(`Real-time notification sent to user ${notification.userId}`);
            }
            
            // Send push notification, email, etc. based on user preferences
            await notificationService.sendExternalNotification(savedNotification);
            
        } catch (error) {
            logger.error('Error sending notification:', error);
        }
    }
    
    async publishEvent(topic, event) {
        try {
            await this.producer.send({
                topic,
                messages: [{
                    key: event.eventType || 'notification',
                    value: JSON.stringify(event),
                    timestamp: Date.now().toString()
                }]
            });
            
            logger.info(`Event published to topic ${topic}:`, event);
            
        } catch (error) {
            logger.error(`Error publishing event to topic ${topic}:`, error);
            throw error;
        }
    }
}

module.exports = new KafkaService();