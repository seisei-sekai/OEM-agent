import { describe, it, expect, beforeEach } from 'vitest';
import { CostCalculator } from '../CostCalculator';
import { Price } from '../../value-objects/Price';

describe('CostCalculator Service', () => {
  let calculator: CostCalculator;
  let basePrice: Price;

  beforeEach(() => {
    calculator = new CostCalculator();
    basePrice = Price.create({ amount: 10, currency: 'USD' });
  });

  describe('calculateTotalCost', () => {
    describe('base calculation without discounts', () => {
      it('should calculate total for small quantity', () => {
        const total = calculator.calculateTotalCost({
          basePrice,
          quantity: 50,
        });

        expect(total.getAmount()).toBe(500);
        expect(total.getCurrency()).toBe('USD');
      });

      it('should calculate total for quantity 1', () => {
        const total = calculator.calculateTotalCost({
          basePrice,
          quantity: 1,
        });

        expect(total.getAmount()).toBe(10);
      });
    });

    describe('volume discounts', () => {
      it('should apply 5% discount for 100+ items', () => {
        const total = calculator.calculateTotalCost({
          basePrice,
          quantity: 100,
        });

        // 10 * 100 * 0.95 = 950
        expect(total.getAmount()).toBe(950);
      });

      it('should apply 10% discount for 200+ items', () => {
        const total = calculator.calculateTotalCost({
          basePrice,
          quantity: 200,
        });

        // 10 * 200 * 0.90 = 1800
        expect(total.getAmount()).toBe(1800);
      });

      it('should apply 15% discount for 500+ items', () => {
        const total = calculator.calculateTotalCost({
          basePrice,
          quantity: 500,
        });

        // 10 * 500 * 0.85 = 4250
        expect(total.getAmount()).toBe(4250);
      });

      it('should apply correct discount at threshold boundary', () => {
        const at199 = calculator.calculateTotalCost({
          basePrice,
          quantity: 199,
        });
        const at200 = calculator.calculateTotalCost({
          basePrice,
          quantity: 200,
        });

        // 199 should get 5%, 200 should get 10%
        expect(at199.getAmount()).toBe(1890.5); // 1990 * 0.95
        expect(at200.getAmount()).toBe(1800); // 2000 * 0.90
      });
    });

    describe('print method costs', () => {
      it('should add embroidery cost', () => {
        const total = calculator.calculateTotalCost({
          basePrice,
          quantity: 100,
          printMethod: 'embroidery',
        });

        // (10 * 100 * 0.95) + (100 * 2.5) = 950 + 250 = 1200
        expect(total.getAmount()).toBe(1200);
      });

      it('should add screen-print cost', () => {
        const total = calculator.calculateTotalCost({
          basePrice,
          quantity: 100,
          printMethod: 'screen-print',
        });

        // (10 * 100 * 0.95) + (100 * 1.0) = 950 + 100 = 1050
        expect(total.getAmount()).toBe(1050);
      });

      it('should not add cost for unknown print method', () => {
        const total = calculator.calculateTotalCost({
          basePrice,
          quantity: 100,
          printMethod: 'digital',
        });

        // Just the discounted base: 10 * 100 * 0.95 = 950
        expect(total.getAmount()).toBe(950);
      });
    });

    describe('additional costs', () => {
      it('should add single additional cost', () => {
        const setupFee = Price.create({ amount: 50, currency: 'USD' });
        
        const total = calculator.calculateTotalCost({
          basePrice,
          quantity: 100,
          additionalCosts: [setupFee],
        });

        // (10 * 100 * 0.95) + 50 = 1000
        expect(total.getAmount()).toBe(1000);
      });

      it('should add multiple additional costs', () => {
        const setupFee = Price.create({ amount: 50, currency: 'USD' });
        const shippingFee = Price.create({ amount: 30, currency: 'USD' });
        
        const total = calculator.calculateTotalCost({
          basePrice,
          quantity: 100,
          additionalCosts: [setupFee, shippingFee],
        });

        // (10 * 100 * 0.95) + 50 + 30 = 1030
        expect(total.getAmount()).toBe(1030);
      });
    });

    describe('combined scenarios', () => {
      it('should apply discount, print method, and additional costs together', () => {
        const setupFee = Price.create({ amount: 100, currency: 'USD' });
        
        const total = calculator.calculateTotalCost({
          basePrice,
          quantity: 200,
          printMethod: 'embroidery',
          additionalCosts: [setupFee],
        });

        // (10 * 200 * 0.90) + (200 * 2.5) + 100 = 1800 + 500 + 100 = 2400
        expect(total.getAmount()).toBe(2400);
      });
    });

    describe('rounding', () => {
      it('should round to 2 decimal places', () => {
        const price = Price.create({ amount: 10.333, currency: 'USD' });
        
        const total = calculator.calculateTotalCost({
          basePrice: price,
          quantity: 3,
        });

        expect(total.getAmount()).toBe(31); // 30.999 rounds to 31
      });
    });
  });

  describe('calculateUnitPrice', () => {
    it('should calculate unit price correctly', () => {
      const totalCost = Price.create({ amount: 1000, currency: 'USD' });
      const unitPrice = calculator.calculateUnitPrice(totalCost, 100);

      expect(unitPrice.getAmount()).toBe(10);
      expect(unitPrice.getCurrency()).toBe('USD');
    });

    it('should round unit price to 2 decimal places', () => {
      const totalCost = Price.create({ amount: 100, currency: 'USD' });
      const unitPrice = calculator.calculateUnitPrice(totalCost, 3);

      expect(unitPrice.getAmount()).toBe(33.33);
    });

    it('should handle single quantity', () => {
      const totalCost = Price.create({ amount: 99.99, currency: 'USD' });
      const unitPrice = calculator.calculateUnitPrice(totalCost, 1);

      expect(unitPrice.getAmount()).toBe(99.99);
    });

    it('should maintain currency', () => {
      const totalCost = Price.create({ amount: 1000, currency: 'EUR' });
      const unitPrice = calculator.calculateUnitPrice(totalCost, 50);

      expect(unitPrice.getCurrency()).toBe('EUR');
    });
  });

  describe('error handling', () => {
    it('should throw error for zero quantity in unit price calculation', () => {
      const totalCost = Price.create({ amount: 1000, currency: 'USD' });
      
      expect(() => 
        calculator.calculateUnitPrice(totalCost, 0)
      ).toThrow('Quantity must be greater than zero');
    });

    it('should throw error for negative quantity in unit price calculation', () => {
      const totalCost = Price.create({ amount: 1000, currency: 'USD' });
      
      expect(() => 
        calculator.calculateUnitPrice(totalCost, -5)
      ).toThrow('Quantity must be greater than zero');
    });
  });
});

