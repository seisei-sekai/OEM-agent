import { describe, it, expect } from 'vitest';
import { Product, type ProductData } from '../Product';

describe('Product Entity', () => {
  const validProductData: ProductData = {
    id: 'prod-001',
    name: 'Premium T-Shirt',
    description: 'High quality cotton t-shirt',
    category: 'apparel',
    priceFrom: { amount: 15.99, currency: 'USD' },
    minQuantity: 50,
    imageUrl: 'https://example.com/tshirt.jpg',
    colors: [
      { name: 'White', hex: '#FFFFFF' },
      { name: 'Black', hex: '#000000' },
    ],
    specs: {
      material: '100% Cotton',
      weight: '180gsm',
    },
    printMethods: ['screen-print', 'embroidery'],
    leadTimeDays: 14,
    supplierId: 'supplier-123',
  };

  describe('fromData', () => {
    it('should create a Product from valid data', () => {
      const product = Product.fromData(validProductData);

      expect(product.getId()).toBe('prod-001');
      expect(product.getName()).toBe('Premium T-Shirt');
      expect(product.getDescription()).toBe('High quality cotton t-shirt');
      expect(product.getCategory()).toBe('apparel');
      expect(product.getMinQuantity()).toBe(50);
      expect(product.getLeadTimeDays()).toBe(14);
    });

    it('should create Price value object correctly', () => {
      const product = Product.fromData(validProductData);
      const price = product.getPriceFrom();

      expect(price.getAmount()).toBe(15.99);
      expect(price.getCurrency()).toBe('USD');
    });

    it('should store colors correctly', () => {
      const product = Product.fromData(validProductData);
      const colors = product.getColors();

      expect(colors).toHaveLength(2);
      expect(colors[0].name).toBe('White');
      expect(colors[0].hex).toBe('#FFFFFF');
    });

    it('should store specs correctly', () => {
      const product = Product.fromData(validProductData);
      const specs = product.getSpecs();

      expect(specs.material).toBe('100% Cotton');
      expect(specs.weight).toBe('180gsm');
    });

    it('should store print methods correctly', () => {
      const product = Product.fromData(validProductData);
      const methods = product.getPrintMethods();

      expect(methods).toEqual(['screen-print', 'embroidery']);
    });
  });

  describe('validation', () => {
    it('should throw error for invalid price', () => {
      const invalidData = {
        ...validProductData,
        priceFrom: { amount: -10, currency: 'USD' as const },
      };

      expect(() => Product.fromData(invalidData)).toThrow();
    });

    it('should throw error for invalid minQuantity', () => {
      const invalidData = {
        ...validProductData,
        minQuantity: 0,
      };

      expect(() => Product.fromData(invalidData)).toThrow();
    });

    it('should throw error for invalid imageUrl', () => {
      const invalidData = {
        ...validProductData,
        imageUrl: 'not-a-url',
      };

      expect(() => Product.fromData(invalidData)).toThrow();
    });

    it('should throw error for invalid leadTimeDays', () => {
      const invalidData = {
        ...validProductData,
        leadTimeDays: -5,
      };

      expect(() => Product.fromData(invalidData)).toThrow();
    });

    it('should throw error for invalid category', () => {
      const invalidData = {
        ...validProductData,
        category: 'invalid-category' as any,
      };

      expect(() => Product.fromData(invalidData)).toThrow();
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON correctly', () => {
      const product = Product.fromData(validProductData);
      const json = product.toJSON();

      expect(json).toEqual(validProductData);
    });

    it('should serialize and deserialize correctly', () => {
      const product1 = Product.fromData(validProductData);
      const json = product1.toJSON();
      const product2 = Product.fromData(json);

      expect(product2.getId()).toBe(product1.getId());
      expect(product2.getName()).toBe(product1.getName());
      expect(product2.getPriceFrom().getAmount()).toBe(product1.getPriceFrom().getAmount());
    });
  });

  describe('optional fields', () => {
    it('should handle missing supplierId', () => {
      const dataWithoutSupplier = { ...validProductData };
      delete dataWithoutSupplier.supplierId;

      const product = Product.fromData(dataWithoutSupplier);
      expect(product.toJSON().supplierId).toBeUndefined();
    });

    it('should handle color without imageUrl', () => {
      const dataWithSimpleColors: ProductData = {
        ...validProductData,
        colors: [{ name: 'Red', hex: '#FF0000' }],
      };

      const product = Product.fromData(dataWithSimpleColors);
      const colors = product.getColors();

      expect(colors[0].imageUrl).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty color array', () => {
      const data = { ...validProductData, colors: [] };
      const product = Product.fromData(data);

      expect(product.getColors()).toHaveLength(0);
    });

    it('should handle empty specs object', () => {
      const data = { ...validProductData, specs: {} };
      const product = Product.fromData(data);

      expect(product.getSpecs()).toEqual({});
    });

    it('should handle multiple print methods', () => {
      const data = {
        ...validProductData,
        printMethods: ['screen-print', 'embroidery', 'digital', 'sublimation'],
      };
      const product = Product.fromData(data);

      expect(product.getPrintMethods()).toHaveLength(4);
    });

    it('should handle large minQuantity', () => {
      const data = { ...validProductData, minQuantity: 10000 };
      const product = Product.fromData(data);

      expect(product.getMinQuantity()).toBe(10000);
    });
  });
});

