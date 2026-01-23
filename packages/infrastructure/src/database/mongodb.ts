import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongoDB(uri: string = process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017'): Promise<Db> {
  if (db) {
    return db;
  }

  client = new MongoClient(uri);
  await client.connect();
  
  const dbName = new URL(uri).pathname.slice(1) || 'oem-agent';
  db = client.db(dbName);

  // Create indexes
  await createIndexes(db);

  return db;
}

async function createIndexes(db: Db): Promise<void> {
  await db.collection('chat_sessions').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('chat_sessions').createIndex({ id: 1 }, { unique: true });
  
  await db.collection('messages').createIndex({ sessionId: 1, timestamp: 1 });
  await db.collection('messages').createIndex({ id: 1 }, { unique: true });
  
  await db.collection('branding_info').createIndex({ sessionId: 1 });
  await db.collection('branding_info').createIndex({ userId: 1 });
  await db.collection('branding_info').createIndex({ id: 1 }, { unique: true });
  
  await db.collection('products').createIndex({ category: 1 });
  await db.collection('products').createIndex({ id: 1 }, { unique: true });
}

export async function disconnectMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error('MongoDB not connected. Call connectMongoDB() first.');
  }
  return db;
}

