import { Product } from '../entities/Product.js';
import { ProductCategory } from '../value-objects/ProductCategory.js';

export interface ProductFilters {
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
}

export interface IProductCatalogRepository {
  findById(id: string): Promise<Product | null>;
  findAll(filters?: ProductFilters): Promise<Product[]>;
  search(query: string, filters?: ProductFilters, limit?: number): Promise<Product[]>;
  findByCategory(category: ProductCategory, limit?: number): Promise<Product[]>;
}



