import { z } from 'zod';

export const ColorCodeSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export class ColorCode {
  private constructor(private readonly value: string) {}

  static create(hex: string): ColorCode {
    const normalized = hex.startsWith('#') ? hex : `#${hex}`;
    ColorCodeSchema.parse(normalized);
    return new ColorCode(normalized.toUpperCase());
  }

  toString(): string {
    return this.value;
  }

  toRGB(): { r: number; g: number; b: number } {
    const hex = this.value.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  equals(other: ColorCode): boolean {
    return this.value === other.value;
  }
}


