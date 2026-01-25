import { Collection } from 'mongodb';
import { ChatSession, Message, IChatSessionRepository, ChatSessionData, MessageData } from '@repo/domain';
import { getDB } from '../database/mongodb.js';

export class MongoChatSessionRepository implements IChatSessionRepository {
  private get sessionsCollection(): Collection<ChatSessionData> {
    return getDB().collection<ChatSessionData>('chat_sessions');
  }

  private get messagesCollection(): Collection<MessageData> {
    return getDB().collection<MessageData>('messages');
  }

  async save(session: ChatSession): Promise<void> {
    const data = session.toJSON();
    await this.sessionsCollection.updateOne(
      { id: data.id },
      { $set: data },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<ChatSession | null> {
    const data = await this.sessionsCollection.findOne({ id });
    if (!data) return null;
    return ChatSession.fromData(data);
  }

  async findByUserId(userId: string, limit: number = 50): Promise<ChatSession[]> {
    const docs = await this.sessionsCollection
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .toArray();
    
    return docs.map(doc => ChatSession.fromData(doc));
  }

  async delete(id: string): Promise<void> {
    await this.sessionsCollection.deleteOne({ id });
    await this.messagesCollection.deleteMany({ sessionId: id });
  }

  async saveMessage(message: Message): Promise<void> {
    const data = message.toJSON();
    await this.messagesCollection.insertOne(data);
  }

  async findMessagesBySessionId(sessionId: string): Promise<Message[]> {
    const docs = await this.messagesCollection
      .find({ sessionId })
      .sort({ timestamp: 1 })
      .toArray();
    
    return docs.map(doc => Message.fromData(doc));
  }
}



