import weaviate, { WeaviateClient } from 'weaviate-ts-client';
import { Product, ProductFilters } from '@repo/domain';
import { IVectorSearch } from '@repo/application';

export class WeaviateProductSearch implements IVectorSearch {
  private client: WeaviateClient;

  constructor(url: string = process.env.WEAVIATE_URL || 'http://localhost:8080') {
    this.client = weaviate.client({
      scheme: url.startsWith('https') ? 'https' : 'http',
      host: url.replace(/^https?:\/\//, ''),
    });
  }

  async searchProducts(
    query: string,
    filters?: ProductFilters,
    limit: number = 20
  ): Promise<Product[]> {
    try {
      let queryBuilder = this.client.graphql
        .get()
        .withClassName('Product')
        .withNearText({ concepts: [query] })
        .withLimit(limit)
        .withFields('id name description category priceFrom { amount currency } minQuantity imageUrl colors { name hex } specs printMethods leadTimeDays');

      // Apply filters
      if (filters?.category) {
        queryBuilder = queryBuilder.withWhere({
          path: ['category'],
          operator: 'Equal',
          valueString: filters.category,
        });
      }

      const result = await queryBuilder.do();
      const products = result?.data?.Get?.Product || [];

      return products.map((p: any) => Product.fromData(p));
    } catch (error) {
      console.error('Weaviate search error:', error);
      return [];
    }
  }

  async indexProduct(product: Product): Promise<void> {
    const data = product.toJSON();
    
    await this.client.data
      .creator()
      .withClassName('Product')
      .withProperties(data)
      .do();
  }

  async indexProducts(products: Product[]): Promise<void> {
    const batcher = this.client.batch.objectsBatcher();
    
    for (const product of products) {
      const data = product.toJSON();
      batcher.withObject({
        class: 'Product',
        properties: data,
      });
    }

    await batcher.do();
  }

  async initializeSchema(): Promise<void> {
    const schemaConfig = {
      class: 'Product',
      description: 'Product catalog for OEM manufacturing',
      vectorizer: 'text2vec-transformers',
      moduleConfig: {
        'text2vec-transformers': {
          poolingStrategy: 'masked_mean',
        },
      },
      properties: [
        {
          name: 'name',
          dataType: ['string'],
          description: 'Product name',
        },
        {
          name: 'description',
          dataType: ['string'],
          description: 'Product description',
        },
        {
          name: 'category',
          dataType: ['string'],
          description: 'Product category',
        },
        {
          name: 'id',
          dataType: ['string'],
          description: 'Product ID',
        },
      ],
    };

    try {
      await this.client.schema.classCreator().withClass(schemaConfig).do();
    } catch (error) {
      // Schema might already exist
      console.log('Schema creation skipped (may already exist)');
    }
  }
}


