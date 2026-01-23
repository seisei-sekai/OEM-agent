import { BaseDomainEvent } from './DomainEvent.js';

export class ProductsRecommended extends BaseDomainEvent {
  constructor(
    sessionId: string,
    public readonly productIds: string[],
    public readonly intent: string
  ) {
    super(sessionId, 'ProductsRecommended');
  }
}


