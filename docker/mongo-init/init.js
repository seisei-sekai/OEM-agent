// MongoDB Initialization Script
// This script runs when the MongoDB container is first created

db = db.getSiblingDB('oem_agent');

// Create collections with validation
db.createCollection('chat_sessions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'userId', 'createdAt', 'updatedAt'],
      properties: {
        _id: { bsonType: 'string' },
        userId: { bsonType: 'string' },
        title: { bsonType: 'string' },
        messageCount: { bsonType: 'int' },
        createdAt: { bsonType: 'date' },
        updatedAt: { bsonType: 'date' },
        context: { bsonType: 'object' }
      }
    }
  }
});

db.createCollection('messages', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'sessionId', 'role', 'content', 'timestamp'],
      properties: {
        _id: { bsonType: 'string' },
        sessionId: { bsonType: 'string' },
        role: { enum: ['user', 'agent', 'system'] },
        content: { bsonType: 'string' },
        timestamp: { bsonType: 'date' },
        metadata: { bsonType: 'object' }
      }
    }
  }
});

db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'name', 'category', 'priceFrom'],
      properties: {
        _id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        category: { bsonType: 'string' },
        priceFrom: { bsonType: 'object' },
        minQuantity: { bsonType: 'int' },
        imageUrl: { bsonType: 'string' }
      }
    }
  }
});

db.createCollection('branding_info', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['_id', 'url', 'extractedAt'],
      properties: {
        _id: { bsonType: 'string' },
        url: { bsonType: 'string' },
        companyName: { bsonType: 'string' },
        primaryColor: { bsonType: 'string' },
        secondaryColor: { bsonType: 'string' },
        logoUrl: { bsonType: 'string' },
        extractedAt: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes for better query performance
db.chat_sessions.createIndex({ userId: 1, createdAt: -1 });
db.chat_sessions.createIndex({ updatedAt: -1 });

db.messages.createIndex({ sessionId: 1, timestamp: 1 });
db.messages.createIndex({ timestamp: -1 });

db.products.createIndex({ category: 1 });
db.products.createIndex({ name: 'text', description: 'text' });

db.branding_info.createIndex({ url: 1 }, { unique: true });
db.branding_info.createIndex({ extractedAt: -1 });

print('✅ MongoDB initialization completed successfully');
print('📊 Collections created: chat_sessions, messages, products, branding_info');
print('📇 Indexes created for optimal query performance');



