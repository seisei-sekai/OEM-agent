import { z } from 'zod';

export const SessionIdSchema = z.string().uuid();

export class SessionId {
  private constructor(private readonly value: string) {}

  static create(value?: string): SessionId {
    const id = value || crypto.randomUUID();
    SessionIdSchema.parse(id);
    return new SessionId(id);
  }

  static fromString(value: string): SessionId {
    SessionIdSchema.parse(value);
    return new SessionId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: SessionId): boolean {
    return this.value === other.value;
  }
}


