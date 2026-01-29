/**
 * Timestamp Value Object
 * 
 * Validation Rules:
 * - Must be a valid Date object or ISO string
 * - Cannot be in the future (more than 1 minute ahead)
 * - Cannot be before year 2000
 * 
 * Immutable: Yes
 */
export class Timestamp {
  private readonly _value: Date;

  constructor(value: Date | string) {
    this._value = this.parseAndValidate(value);
  }

  private parseAndValidate(value: Date | string): Date {
    // Parse to Date
    let date: Date;
    
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      date = new Date(value);
    } else {
      throw new Error('Invalid Timestamp: value must be a Date or ISO string');
    }

    // Validate it's a valid date
    if (isNaN(date.getTime())) {
      throw new Error('Invalid Timestamp: invalid date value');
    }

    // Validate not too far in the future (allow 1 minute clock skew)
    const oneMinuteFromNow = new Date(Date.now() + 60000);
    if (date > oneMinuteFromNow) {
      throw new Error('Invalid Timestamp: cannot be in the future');
    }

    // Validate not before year 2000
    const year2000 = new Date('2000-01-01');
    if (date < year2000) {
      throw new Error('Invalid Timestamp: cannot be before year 2000');
    }

    return date;
  }

  get value(): Date {
    return new Date(this._value); // Return copy to maintain immutability
  }

  /**
   * Format timestamp to human-readable string
   * Examples: "2:30 PM", "Yesterday at 3:45 PM", "Jan 25 at 4:20 PM"
   */
  public format(): string {
    const now = new Date();
    const diff = now.getTime() - this._value.getTime();
    const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Same day - just show time
    if (this.isSameDay(this._value, now)) {
      return this.formatTime(this._value);
    }

    // Yesterday
    if (daysDiff === 1) {
      return `Yesterday at ${this.formatTime(this._value)}`;
    }

    // This week
    if (daysDiff < 7) {
      const dayName = this._value.toLocaleDateString('en-US', { weekday: 'long' });
      return `${dayName} at ${this.formatTime(this._value)}`;
    }

    // Older - show date
    const monthDay = this._value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${monthDay} at ${this.formatTime(this._value)}`;
  }

  /**
   * Get relative time string
   * Examples: "just now", "5 minutes ago", "2 hours ago"
   */
  public toRelative(): string {
    const now = new Date();
    const diffMs = now.getTime() - this._value.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 10) return 'just now';
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffMin === 1) return '1 minute ago';
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour === 1) return '1 hour ago';
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay === 1) return '1 day ago';
    return `${diffDay} days ago`;
  }

  /**
   * Get full timestamp with timezone
   * Example: "January 29, 2026 at 2:30:45 PM PST"
   */
  public toFull(): string {
    const date = this._value.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const time = this._value.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
    return `${date} at ${time}`;
  }

  public equals(other: Timestamp): boolean {
    return this._value.getTime() === other._value.getTime();
  }

  public toString(): string {
    return this._value.toISOString();
  }

  public toISO(): string {
    return this._value.toISOString();
  }

  // Helper methods
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}
