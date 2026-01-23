import { BaseDomainEvent } from './DomainEvent.js';

export class SessionStarted extends BaseDomainEvent {
  constructor(
    sessionId: string,
    public readonly userId?: string
  ) {
    super(sessionId, 'SessionStarted');
  }
}


