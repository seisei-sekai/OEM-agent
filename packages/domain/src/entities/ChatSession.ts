import { z } from 'zod';
import { SessionId } from '../value-objects/SessionId.js';

export const ChatSessionSchema = z.object({
  id: z.string(),
  userId: z.string().optional().nullable(),
  title: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  messageCount: z.number().int().nonnegative(),
  context: z.record(z.unknown()).optional(),
});

export type ChatSessionData = z.infer<typeof ChatSessionSchema>;

export class ChatSession {
  private constructor(
    private readonly id: SessionId,
    private userId: string | undefined | null,
    private title: string,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private messageCount: number,
    private context?: Record<string, unknown>
  ) {}

  static create(userId?: string): ChatSession {
    const id = SessionId.create();
    const now = new Date();
    return new ChatSession(
      id,
      userId,
      'New conversation',
      now,
      now,
      0,
      {}
    );
  }

  static fromData(data: ChatSessionData): ChatSession {
    ChatSessionSchema.parse(data);
    return new ChatSession(
      SessionId.fromString(data.id),
      data.userId,
      data.title,
      data.createdAt,
      data.updatedAt,
      data.messageCount,
      data.context
    );
  }

  getId(): string {
    return this.id.toString();
  }

  getUserId(): string | undefined | null {
    return this.userId;
  }

  getTitle(): string {
    return this.title;
  }

  updateTitle(title: string): void {
    this.title = title;
    this.touch();
  }

  incrementMessageCount(): void {
    this.messageCount++;
    this.touch();
  }

  getMessageCount(): number {
    return this.messageCount;
  }

  getContext(): Record<string, unknown> | undefined {
    return this.context;
  }

  updateContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context };
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  toJSON(): ChatSessionData {
    return {
      id: this.id.toString(),
      userId: this.userId,
      title: this.title,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      messageCount: this.messageCount,
      context: this.context,
    };
  }
}

