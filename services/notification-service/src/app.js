/**
 * Notification Service - NodeJS Express Application
 * 
 * Demonstrates XYZ Dev Foundation requirements:
 * - NodeJS with Express framework
 * - Real-time WebSocket communication
 * - Kafka integration for event processing
 * - Redis for session management
 * - MongoDB for notification storage
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const logger = require('./services/logger');
const kafkaService = require('./services/kafkaService');
const redisService = require('./services/redisService');
const notificationRoutes = require('./routes/notifications');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});

// Routes
app.use('/api/v1/notifications', notificationRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'notification-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Notification Service is running',
        version: '1.0.0',
        endpoints: [
            'GET /health',
            'POST /api/v1/notifications/send',
            'GET /api/v1/notifications/user/:userId',
            'WebSocket /socket.io'
        ]
    });
});

// WebSocket connection handling
io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);
    
    // Join user-specific room
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
        logger.info(`User ${userId} joined room`);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });
});

// Make io available to other modules
app.set('io', io);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl
    });
});

const PORT = process.env.PORT || 8084;

// Initialize services and start server
async function startServer() {
    try {
        // Initialize Redis
        await redisService.connect();
        logger.info('Redis connected successfully');
        
        // Initialize Kafka
        await kafkaService.connect();
        logger.info('Kafka connected successfully');
        
        // Start Kafka consumers
        await kafkaService.startConsumers(io);
        logger.info('Kafka consumers started');
        
        // Start server
        server.listen(PORT, () => {
            logger.info(`Notification Service running on port ${PORT}`);
            logger.info(`WebSocket server ready for connections`);
        });
        
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    
    try {
        await kafkaService.disconnect();
        await redisService.disconnect();
        server.close(() => {
            logger.info('Server closed');
            process.exit(0);
        });
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    
    try {
        await kafkaService.disconnect();
        await redisService.disconnect();
        server.close(() => {
            logger.info('Server closed');
            process.exit(0);
        });
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
});

// Start the server
startServer();

module.exports = app;