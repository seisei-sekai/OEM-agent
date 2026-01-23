import { z } from 'zod';
import { Price, PriceSchema } from '../value-objects/Price.js';
import { ProductCategorySchema, type ProductCategory } from '../value-objects/ProductCategory.js';

export const ColorOptionSchema = z.object({
  name: z.string(),
  hex: z.string(),
  imageUrl: z.string().url().optional(),
});

export type ColorOption = z.infer<typeof ColorOptionSchema>;

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: ProductCategorySchema,
  priceFrom: PriceSchema,
  minQuantity: z.number().int().positive(),
  imageUrl: z.string().url(),
  colors: z.array(ColorOptionSchema),
  specs: z.record(z.unknown()),
  printMethods: z.array(z.string()),
  leadTimeDays: z.number().int().positive(),
  supplierId: z.string().optional(),
});

export type ProductData = z.infer<typeof ProductSchema>;

export class Product {
  private constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly description: string,
    private readonly category: ProductCategory,
    private readonly priceFrom: Price,
    private readonly minQuantity: number,
    private readonly imageUrl: string,
    private readonly colors: ColorOption[],
    private readonly specs: Record<string, unknown>,
    private readonly printMethods: string[],
    private readonly leadTimeDays: number,
    private readonly supplierId?: string
  ) {}

  static fromData(data: ProductData): Product {
    ProductSchema.parse(data);
    return new Product(
      data.id,
      data.name,
      data.description,
      data.category,
      Price.create(data.priceFrom),
      data.minQuantity,
      data.imageUrl,
      data.colors,
      data.specs,
      data.printMethods,
      data.leadTimeDays,
      data.supplierId
    );
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getCategory(): ProductCategory {
    return this.category;
  }

  getPriceFrom(): Price {
    return this.priceFrom;
  }

  getMinQuantity(): number {
    return this.minQuantity;
  }

  getImageUrl(): string {
    return this.imageUrl;
  }

  getColors(): ColorOption[] {
    return this.colors;
  }

  getSpecs(): Record<string, unknown> {
    return this.specs;
  }

  getPrintMethods(): string[] {
    return this.printMethods;
  }

  getLeadTimeDays(): number {
    return this.leadTimeDays;
  }

  toJSON(): ProductData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      priceFrom: this.priceFrom.toJSON(),
      minQuantity: this.minQuantity,
      imageUrl: this.imageUrl,
      colors: this.colors,
      specs: this.specs,
      printMethods: this.printMethods,
      leadTimeDays: this.leadTimeDays,
      supplierId: this.supplierId,
    };
  }
}


