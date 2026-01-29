import { z } from 'zod';

export const MessageRoleSchema = z.enum(['user', 'agent', 'system']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const MessageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  role: MessageRoleSchema,
  content: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export type MessageData = z.infer<typeof MessageSchema>;

export class Message {
  private constructor(
    private readonly id: string,
    private readonly sessionId: string,
    private readonly role: MessageRole,
    private readonly content: string,
    private readonly timestamp: Date,
    private readonly metadata?: Record<string, unknown> | null
  ) {}

  static create(data: Omit<MessageData, 'id' | 'timestamp'>): Message {
    return new Message(
      crypto.randomUUID(),
      data.sessionId,
      data.role,
      data.content,
      new Date(),
      data.metadata
    );
  }

  static fromData(data: MessageData): Message {
    MessageSchema.parse(data);
    return new Message(
      data.id,
      data.sessionId,
      data.role,
      data.content,
      data.timestamp,
      data.metadata
    );
  }

  getId(): string {
    return this.id;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getRole(): MessageRole {
    return this.role;
  }

  getContent(): string {
    return this.content;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  getMetadata(): Record<string, unknown> | undefined | null {
    return this.metadata;
  }

  isUserMessage(): boolean {
    return this.role === 'user';
  }

  isAgentMessage(): boolean {
    return this.role === 'agent';
  }

  /**
   * Get formatted timestamp
   * Examples: "2:30 PM", "Yesterday at 3:45 PM"
   */
  getFormattedTimestamp(): string {
    // Import inline to avoid circular dependencies
    const { Timestamp } = require('../value-objects/Timestamp');
    const ts = new Timestamp(this.timestamp);
    return ts.format();
  }

  /**
   * Get relative timestamp
   * Examples: "5 minutes ago", "2 hours ago"
   */
  getRelativeTime(): string {
    const { Timestamp } = require('../value-objects/Timestamp');
    const ts = new Timestamp(this.timestamp);
    return ts.toRelative();
  }

  toJSON(): MessageData {
    return {
      id: this.id,
      sessionId: this.sessionId,
      role: this.role,
      content: this.content,
      timestamp: this.timestamp,
      metadata: this.metadata,
    };
  }
}

