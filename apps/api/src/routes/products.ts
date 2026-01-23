import { Hono } from 'hono';
import { container } from '../di/container.js';
import {
  IRecommendProductsUseCase,
  RecommendProductsDTOSchema,
} from '@repo/application';
import { IProductCatalogRepository } from '@repo/domain';

const productsRoute = new Hono();

// Get product recommendations
productsRoute.post('/recommend', async (c) => {
  try {
    const body = await c.req.json();
    const dto = RecommendProductsDTOSchema.parse(body);

    const useCase = container.resolve<IRecommendProductsUseCase>('IRecommendProductsUseCase');
    const products = await useCase.execute(dto);

    return c.json({
      products: products.map(p => p.toJSON()),
      total: products.length,
    });
  } catch (error) {
    return c.json({
      error: 'Failed to recommend products',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Get product by ID
productsRoute.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const repo = container.resolve<IProductCatalogRepository>('IProductCatalogRepository');
    const product = await repo.findById(id);

    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }

    return c.json({
      product: product.toJSON(),
    });
  } catch (error) {
    return c.json({
      error: 'Failed to get product',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Search products
productsRoute.get('/search', async (c) => {
  try {
    const query = c.req.query('q') || '';
    const category = c.req.query('category');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 20;

    const repo = container.resolve<IProductCatalogRepository>('IProductCatalogRepository');
    const products = await repo.search(query, { category: category as any }, limit);

    return c.json({
      products: products.map(p => p.toJSON()),
      total: products.length,
    });
  } catch (error) {
    return c.json({
      error: 'Failed to search products',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default productsRoute;

