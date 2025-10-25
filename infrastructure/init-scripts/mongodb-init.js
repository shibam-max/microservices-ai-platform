// MongoDB Initialization Script for Microservices AI Platform

// Switch to the microservices database
db = db.getSiblingDB('microservices_ai_platform');

// Create collections with validation schemas
db.createCollection('notifications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'type', 'title', 'message', 'createdAt'],
      properties: {
        userId: { bsonType: 'string' },
        type: { enum: ['INFO', 'WARNING', 'ERROR', 'SUCCESS'] },
        title: { bsonType: 'string', maxLength: 100 },
        message: { bsonType: 'string', maxLength: 500 },
        isRead: { bsonType: 'bool' },
        priority: { enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
        metadata: { bsonType: 'object' },
        createdAt: { bsonType: 'date' },
        readAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('analytics_data', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['dataType', 'source', 'timestamp', 'data'],
      properties: {
        dataType: { bsonType: 'string' },
        source: { bsonType: 'string' },
        timestamp: { bsonType: 'date' },
        data: { bsonType: 'object' },
        processed: { bsonType: 'bool' },
        tags: { bsonType: 'array', items: { bsonType: 'string' } }
      }
    }
  }
});

db.createCollection('ml_training_data', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['modelId', 'features', 'target', 'createdAt'],
      properties: {
        modelId: { bsonType: 'string' },
        features: { bsonType: 'object' },
        target: { bsonType: 'string' },
        datasetName: { bsonType: 'string' },
        quality: { bsonType: 'double', minimum: 0, maximum: 1 },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('user_sessions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'sessionId', 'createdAt'],
      properties: {
        userId: { bsonType: 'string' },
        sessionId: { bsonType: 'string' },
        ipAddress: { bsonType: 'string' },
        userAgent: { bsonType: 'string' },
        isActive: { bsonType: 'bool' },
        lastActivity: { bsonType: 'date' },
        createdAt: { bsonType: 'date' },
        expiresAt: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('system_metrics', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['service', 'metricType', 'value', 'timestamp'],
      properties: {
        service: { bsonType: 'string' },
        metricType: { enum: ['CPU', 'MEMORY', 'DISK', 'NETWORK', 'RESPONSE_TIME', 'ERROR_RATE'] },
        value: { bsonType: 'double' },
        unit: { bsonType: 'string' },
        timestamp: { bsonType: 'date' },
        tags: { bsonType: 'object' }
      }
    }
  }
});

// Create indexes for performance
db.notifications.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ type: 1, isRead: 1 });
db.notifications.createIndex({ createdAt: -1 });

db.analytics_data.createIndex({ dataType: 1, timestamp: -1 });
db.analytics_data.createIndex({ source: 1, processed: 1 });
db.analytics_data.createIndex({ timestamp: -1 });
db.analytics_data.createIndex({ tags: 1 });

db.ml_training_data.createIndex({ modelId: 1, createdAt: -1 });
db.ml_training_data.createIndex({ datasetName: 1 });
db.ml_training_data.createIndex({ quality: -1 });

db.user_sessions.createIndex({ userId: 1, isActive: 1 });
db.user_sessions.createIndex({ sessionId: 1 }, { unique: true });
db.user_sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

db.system_metrics.createIndex({ service: 1, metricType: 1, timestamp: -1 });
db.system_metrics.createIndex({ timestamp: -1 });

// Insert sample data
db.notifications.insertMany([
  {
    userId: '1',
    type: 'INFO',
    title: 'Welcome to Microservices AI Platform',
    message: 'Your account has been successfully created and activated.',
    isRead: false,
    priority: 'MEDIUM',
    metadata: { source: 'system', category: 'welcome' },
    createdAt: new Date()
  },
  {
    userId: '1',
    type: 'SUCCESS',
    title: 'ML Model Training Complete',
    message: 'Your classification model has been successfully trained with 95% accuracy.',
    isRead: false,
    priority: 'HIGH',
    metadata: { modelId: '1', accuracy: 0.95 },
    createdAt: new Date()
  }
]);

db.analytics_data.insertMany([
  {
    dataType: 'user_activity',
    source: 'web_app',
    timestamp: new Date(),
    data: {
      action: 'login',
      userId: '1',
      duration: 1250,
      success: true
    },
    processed: false,
    tags: ['authentication', 'web']
  },
  {
    dataType: 'api_request',
    source: 'api_gateway',
    timestamp: new Date(),
    data: {
      endpoint: '/api/v1/users/profile',
      method: 'GET',
      responseTime: 45,
      statusCode: 200
    },
    processed: false,
    tags: ['api', 'performance']
  }
]);

db.system_metrics.insertMany([
  {
    service: 'api-gateway',
    metricType: 'CPU',
    value: 25.5,
    unit: 'percent',
    timestamp: new Date(),
    tags: { environment: 'production', region: 'us-east-1' }
  },
  {
    service: 'user-service',
    metricType: 'MEMORY',
    value: 512.0,
    unit: 'MB',
    timestamp: new Date(),
    tags: { environment: 'production', region: 'us-east-1' }
  }
]);

// Create user for application access
db.createUser({
  user: 'platform_user',
  pwd: 'secure_mongo_pass_2024',
  roles: [
    { role: 'readWrite', db: 'microservices_ai_platform' }
  ]
});

print('MongoDB initialization completed successfully!');