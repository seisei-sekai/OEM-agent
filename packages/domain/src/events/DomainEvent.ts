export interface DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly eventType: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  readonly eventType: string;

  constructor(
    readonly aggregateId: string,
    eventType: string
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date();
    this.eventType = eventType;
  }
}


