import { describe, it, expect } from 'vitest';
import { Price } from '../Price';

describe('Price Value Object', () => {
  describe('create', () => {
    it('should create a valid Price instance', () => {
      const price = Price.create({ amount: 100, currency: 'USD' });
      
      expect(price.getAmount()).toBe(100);
      expect(price.getCurrency()).toBe('USD');
    });

    it('should accept different currencies', () => {
      const currencies = ['USD', 'EUR', 'JPY', 'CNY'] as const;
      
      currencies.forEach(currency => {
        const price = Price.create({ amount: 50, currency });
        expect(price.getCurrency()).toBe(currency);
      });
    });

    it('should throw error for negative amount', () => {
      expect(() => 
        Price.create({ amount: -10, currency: 'USD' })
      ).toThrow();
    });

    it('should throw error for zero amount', () => {
      expect(() => 
        Price.create({ amount: 0, currency: 'USD' })
      ).toThrow();
    });

    it('should throw error for invalid currency', () => {
      expect(() => 
        Price.create({ amount: 100, currency: 'INVALID' } as any)
      ).toThrow();
    });
  });

  describe('format', () => {
    it('should format USD correctly', () => {
      const price = Price.create({ amount: 1234.56, currency: 'USD' });
      const formatted = price.format();
      
      expect(formatted).toContain('1,234.56');
      expect(formatted).toContain('$');
    });

    it('should format EUR correctly', () => {
      const price = Price.create({ amount: 999.99, currency: 'EUR' });
      const formatted = price.format();
      
      expect(formatted).toContain('999.99');
      expect(formatted).toContain('€');
    });

    it('should format JPY correctly (no decimals)', () => {
      const price = Price.create({ amount: 10000, currency: 'JPY' });
      const formatted = price.format();
      
      expect(formatted).toContain('10,000');
      expect(formatted).toContain('¥');
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const price = Price.create({ amount: 100, currency: 'USD' });
      const json = price.toJSON();
      
      expect(json).toEqual({
        amount: 100,
        currency: 'USD',
      });
    });

    it('should maintain precision in JSON', () => {
      const price = Price.create({ amount: 99.99, currency: 'EUR' });
      const json = price.toJSON();
      
      expect(json.amount).toBe(99.99);
    });
  });

  describe('edge cases', () => {
    it('should handle very small amounts', () => {
      const price = Price.create({ amount: 0.01, currency: 'USD' });
      expect(price.getAmount()).toBe(0.01);
    });

    it('should handle very large amounts', () => {
      const price = Price.create({ amount: 999999.99, currency: 'USD' });
      expect(price.getAmount()).toBe(999999.99);
    });

    it('should handle decimal precision', () => {
      const price = Price.create({ amount: 123.456, currency: 'USD' });
      expect(price.getAmount()).toBe(123.456);
    });
  });
});


