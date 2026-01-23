import { Product, ProductFilters } from '@repo/domain';

export interface IVectorSearch {
  searchProducts(
    query: string,
    filters?: ProductFilters,
    limit?: number
  ): Promise<Product[]>;
  
  indexProduct(product: Product): Promise<void>;
  indexProducts(products: Product[]): Promise<void>;
}


