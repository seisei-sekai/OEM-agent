import { BaseDomainEvent } from './DomainEvent.js';
import { type MessageRole } from '../entities/Message.js';

export class MessageSent extends BaseDomainEvent {
  constructor(
    sessionId: string,
    public readonly messageId: string,
    public readonly role: MessageRole,
    public readonly content: string
  ) {
    super(sessionId, 'MessageSent');
  }
}


