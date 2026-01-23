import { ChatSession } from '../entities/ChatSession.js';
import { Message } from '../entities/Message.js';

export interface IChatSessionRepository {
  save(session: ChatSession): Promise<void>;
  findById(id: string): Promise<ChatSession | null>;
  findByUserId(userId: string, limit?: number): Promise<ChatSession[]>;
  delete(id: string): Promise<void>;
  
  saveMessage(message: Message): Promise<void>;
  findMessagesBySessionId(sessionId: string): Promise<Message[]>;
}


