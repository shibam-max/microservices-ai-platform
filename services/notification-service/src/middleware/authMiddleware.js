/**
 * Authentication middleware for notification service
 */

const jwt = require('jsonwebtoken');
const logger = require('../services/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Access token required'
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        logger.error('Token verification failed:', error);
        return res.status(403).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
};

const validateInput = (req, res, next) => {
    // Sanitize request body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    
    next();
};

const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return sanitizeString(obj);
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = sanitizeString(value);
        }
    }
    return sanitized;
};

const sanitizeString = (str) => {
    if (typeof str !== 'string') {
        return str;
    }
    
    // Remove potentially dangerous characters
    return str.replace(/[<>\"'%;()&+]/g, '')
              .replace(/[\r\n]/g, ' ')
              .trim()
              .substring(0, 1000);
};

const rateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const clientId = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        if (!requests.has(clientId)) {
            requests.set(clientId, { count: 1, resetTime: now + windowMs });
            return next();
        }
        
        const clientData = requests.get(clientId);
        
        if (now > clientData.resetTime) {
            clientData.count = 1;
            clientData.resetTime = now + windowMs;
            return next();
        }
        
        if (clientData.count >= max) {
            return res.status(429).json({
                success: false,
                error: 'Too many requests'
            });
        }
        
        clientData.count++;
        next();
    };
};

module.exports = {
    authenticateToken,
    validateInput,
    rateLimiter
};