import { describe, it, expect } from 'vitest';
import { ColorCode } from '../ColorCode';

describe('ColorCode Value Object', () => {
  describe('create', () => {
    it('should create a valid ColorCode with hash prefix', () => {
      const color = ColorCode.create('#FF5733');
      expect(color.toString()).toBe('#FF5733');
    });

    it('should create a valid ColorCode without hash prefix', () => {
      const color = ColorCode.create('FF5733');
      expect(color.toString()).toBe('#FF5733');
    });

    it('should normalize to uppercase', () => {
      const color = ColorCode.create('#ff5733');
      expect(color.toString()).toBe('#FF5733');
    });

    it('should throw error for invalid format', () => {
      expect(() => ColorCode.create('INVALID')).toThrow();
      expect(() => ColorCode.create('#GG0000')).toThrow();
      expect(() => ColorCode.create('#FFF')).toThrow();
      expect(() => ColorCode.create('#FFFFFFF')).toThrow();
    });

    it('should accept valid hex colors', () => {
      const validColors = ['#000000', '#FFFFFF', '#123456', '#ABCDEF'];
      
      validColors.forEach(hex => {
        expect(() => ColorCode.create(hex)).not.toThrow();
      });
    });
  });

  describe('toRGB', () => {
    it('should convert white correctly', () => {
      const color = ColorCode.create('#FFFFFF');
      const rgb = color.toRGB();
      
      expect(rgb).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should convert black correctly', () => {
      const color = ColorCode.create('#000000');
      const rgb = color.toRGB();
      
      expect(rgb).toEqual({ r: 0, g: 0, b: 0 });
    });

    it('should convert red correctly', () => {
      const color = ColorCode.create('#FF0000');
      const rgb = color.toRGB();
      
      expect(rgb).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert green correctly', () => {
      const color = ColorCode.create('#00FF00');
      const rgb = color.toRGB();
      
      expect(rgb).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('should convert blue correctly', () => {
      const color = ColorCode.create('#0000FF');
      const rgb = color.toRGB();
      
      expect(rgb).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should convert mixed color correctly', () => {
      const color = ColorCode.create('#FF5733');
      const rgb = color.toRGB();
      
      expect(rgb).toEqual({ r: 255, g: 87, b: 51 });
    });
  });

  describe('equals', () => {
    it('should return true for identical colors', () => {
      const color1 = ColorCode.create('#FF5733');
      const color2 = ColorCode.create('#FF5733');
      
      expect(color1.equals(color2)).toBe(true);
    });

    it('should return true for same color with different case input', () => {
      const color1 = ColorCode.create('#ff5733');
      const color2 = ColorCode.create('#FF5733');
      
      expect(color1.equals(color2)).toBe(true);
    });

    it('should return false for different colors', () => {
      const color1 = ColorCode.create('#FF5733');
      const color2 = ColorCode.create('#000000');
      
      expect(color1.equals(color2)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle colors with and without hash consistently', () => {
      const color1 = ColorCode.create('#ABC123');
      const color2 = ColorCode.create('ABC123');
      
      expect(color1.equals(color2)).toBe(true);
    });

    it('should handle lowercase input', () => {
      const color = ColorCode.create('abcdef');
      expect(color.toString()).toBe('#ABCDEF');
    });
  });
});


