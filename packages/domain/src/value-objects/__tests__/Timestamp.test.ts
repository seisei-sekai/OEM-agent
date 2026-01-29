import { describe, it, expect } from 'vitest';
import { Timestamp } from '../Timestamp';

describe('Timestamp', () => {
  describe('Creation and Validation', () => {
    it('should create with valid Date', () => {
      // Arrange
      const validDate = new Date('2026-01-29T14:30:00Z');

      // Act
      const vo = new Timestamp(validDate);

      // Assert
      expect(vo).toBeDefined();
      expect(vo.value.getTime()).toBe(validDate.getTime());
    });

    it('should create with valid ISO string', () => {
      // Arrange
      const validISOString = '2026-01-29T14:30:00Z';

      // Act
      const vo = new Timestamp(validISOString);

      // Assert
      expect(vo).toBeDefined();
      expect(vo.toISO()).toContain('2026-01-29T14:30:00');
    });

    it('should reject invalid date string', () => {
      // Arrange
      const invalidValue = 'not a date';

      // Act & Assert
      expect(() => new Timestamp(invalidValue)).toThrow('invalid date value');
    });

    it('should reject future dates', () => {
      // Arrange
      const futureDate = new Date(Date.now() + 2 * 60000); // 2 minutes in future

      // Act & Assert
      expect(() => new Timestamp(futureDate)).toThrow('cannot be in the future');
    });

    it('should reject dates before year 2000', () => {
      // Arrange
      const oldDate = new Date('1999-12-31');

      // Act & Assert
      expect(() => new Timestamp(oldDate)).toThrow('cannot be before year 2000');
    });
  });

  describe('Equality', () => {
    it('should be equal to another Timestamp with same value', () => {
      // Arrange
      const date = new Date('2026-01-29T14:30:00Z');
      const vo1 = new Timestamp(date);
      const vo2 = new Timestamp(date);

      // Act & Assert
      expect(vo1.equals(vo2)).toBe(true);
    });

    it('should not be equal to Timestamp with different value', () => {
      // Arrange
      const vo1 = new Timestamp('2026-01-29T14:30:00Z');
      const vo2 = new Timestamp('2026-01-29T15:30:00Z');

      // Act & Assert
      expect(vo1.equals(vo2)).toBe(false);
    });
  });

  describe('Immutability', () => {
    it('should return a copy of the date value', () => {
      // Arrange
      const originalDate = new Date('2026-01-29T14:30:00Z');
      const vo = new Timestamp(originalDate);

      // Act
      const returnedDate = vo.value;
      returnedDate.setHours(20); // Try to modify

      // Assert
      expect(vo.value.getHours()).toBe(originalDate.getHours()); // Should be unchanged
    });
  });

  describe('Formatting', () => {
    it('should format timestamp to human-readable string', () => {
      // Arrange
      const timestamp = new Timestamp(new Date());

      // Act
      const formatted = timestamp.format();

      // Assert
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('should provide relative time string', () => {
      // Arrange
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
      const timestamp = new Timestamp(fiveMinutesAgo);

      // Act
      const relative = timestamp.toRelative();

      // Assert
      expect(relative).toContain('minutes ago');
    });

    it('should provide full timestamp with timezone', () => {
      // Arrange
      const date = new Date('2026-01-29T14:30:45Z');
      const timestamp = new Timestamp(date);

      // Act
      const full = timestamp.toFull();

      // Assert
      expect(full).toContain('January');
      expect(full).toContain('2026');
      expect(full).toContain('at');
    });
  });
});
