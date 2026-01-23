import { Collection } from 'mongodb';
import { Product, IProductCatalogRepository, ProductFilters, ProductData, ProductCategory } from '@repo/domain';
import { getDB } from '../database/mongodb.js';

export class MongoProductCatalogRepository implements IProductCatalogRepository {
  private get collection(): Collection<ProductData> {
    return getDB().collection<ProductData>('products');
  }

  async findById(id: string): Promise<Product | null> {
    const data = await this.collection.findOne({ id });
    if (!data) return null;
    return Product.fromData(data);
  }

  async findAll(filters?: ProductFilters): Promise<Product[]> {
    const query = this.buildQuery(filters);
    const docs = await this.collection.find(query).limit(100).toArray();
    return docs.map(doc => Product.fromData(doc));
  }

  async search(query: string, filters?: ProductFilters, limit: number = 20): Promise<Product[]> {
    const searchQuery = {
      ...this.buildQuery(filters),
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    };

    const docs = await this.collection
      .find(searchQuery)
      .limit(limit)
      .toArray();

    return docs.map(doc => Product.fromData(doc));
  }

  async findByCategory(category: ProductCategory, limit: number = 20): Promise<Product[]> {
    const docs = await this.collection
      .find({ category })
      .limit(limit)
      .toArray();

    return docs.map(doc => Product.fromData(doc));
  }

  private buildQuery(filters?: ProductFilters): any {
    const query: any = {};

    if (filters?.category) {
      query.category = filters.category;
    }

    if (filters?.minPrice || filters?.maxPrice) {
      query['priceFrom.amount'] = {};
      if (filters.minPrice) {
        query['priceFrom.amount'].$gte = filters.minPrice;
      }
      if (filters.maxPrice) {
        query['priceFrom.amount'].$lte = filters.maxPrice;
      }
    }

    if (filters?.minQuantity) {
      query.minQuantity = { $lte: filters.minQuantity };
    }

    return query;
  }
}


