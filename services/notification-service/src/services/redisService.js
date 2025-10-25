/**
 * Redis Service for caching and session management
 */

const redis = require('redis');
const logger = require('./logger');

class RedisService {
    constructor() {
        this.client = null;
    }
    
    async connect() {
        try {
            this.client = redis.createClient({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                retry_strategy: (options) => {
                    if (options.error && options.error.code === 'ECONNREFUSED') {
                        return new Error('Redis server connection refused');
                    }
                    if (options.total_retry_time > 1000 * 60 * 60) {
                        return new Error('Retry time exhausted');
                    }
                    if (options.attempt > 10) {
                        return undefined;
                    }
                    return Math.min(options.attempt * 100, 3000);
                }
            });
            
            await this.client.connect();
            logger.info('Redis connected successfully');
            
        } catch (error) {
            logger.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    
    async disconnect() {
        if (this.client) {
            await this.client.disconnect();
            logger.info('Redis disconnected');
        }
    }
    
    async set(key, value, expireInSeconds = null) {
        try {
            const serializedValue = JSON.stringify(value);
            if (expireInSeconds) {
                await this.client.setEx(key, expireInSeconds, serializedValue);
            } else {
                await this.client.set(key, serializedValue);
            }
        } catch (error) {
            logger.error(`Failed to set key ${key}:`, error);
            throw error;
        }
    }
    
    async get(key) {
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            logger.error(`Failed to get key ${key}:`, error);
            return null;
        }
    }
    
    async delete(key) {
        try {
            await this.client.del(key);
        } catch (error) {
            logger.error(`Failed to delete key ${key}:`, error);
        }
    }
}

module.exports = new RedisService();