import { Product, IProductCatalogRepository, IBrandingRepository } from '@repo/domain';
import { RecommendProductsDTO } from '../dtos/ProductDTO.js';
import { IVectorSearch } from '../interfaces/IVectorSearch.js';

export interface IRecommendProductsUseCase {
  execute(dto: RecommendProductsDTO): Promise<Product[]>;
}

export class RecommendProductsUseCase implements IRecommendProductsUseCase {
  constructor(
    private readonly productRepository: IProductCatalogRepository,
    private readonly brandingRepository: IBrandingRepository,
    private readonly vectorSearch: IVectorSearch
  ) {}

  async execute(dto: RecommendProductsDTO): Promise<Product[]> {
    const limit = dto.limit || 20;

    // If branding provided, use context-aware search
    if (dto.brandingId) {
      const branding = await this.brandingRepository.findById(dto.brandingId);
      if (branding) {
        const companyName = branding.getCompanyName() || '';
        const query = `${dto.intent} products for ${companyName}`;
        return this.vectorSearch.searchProducts(query, dto.filters, limit);
      }
    }

    // Fallback to semantic search based on intent
    const intentQueries: Record<string, string> = {
      branded_merch: 'promotional merchandise apparel drinkware accessories',
      custom: 'custom manufactured unique specialized products',
      general: 'popular merchandise products',
    };

    const query = intentQueries[dto.intent] || intentQueries.general;
    return this.vectorSearch.searchProducts(query, dto.filters, limit);
  }
}



