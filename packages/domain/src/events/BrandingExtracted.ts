import { BaseDomainEvent } from './DomainEvent.js';

export class BrandingExtracted extends BaseDomainEvent {
  constructor(
    sessionId: string,
    public readonly brandingId: string,
    public readonly logoCount: number,
    public readonly colorCount: number
  ) {
    super(sessionId, 'BrandingExtracted');
  }
}


