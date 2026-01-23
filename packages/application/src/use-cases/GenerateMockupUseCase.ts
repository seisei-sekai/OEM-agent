import { GenerateMockupDTO } from '../dtos/ProductDTO.js';
import { IMockupGenerator, MockupResult } from '../interfaces/IMockupGenerator.js';

export interface IGenerateMockupUseCase {
  execute(dto: GenerateMockupDTO): Promise<MockupResult>;
  executeBatch(dtos: GenerateMockupDTO[]): Promise<MockupResult[]>;
}

export class GenerateMockupUseCase implements IGenerateMockupUseCase {
  constructor(
    private readonly mockupGenerator: IMockupGenerator
  ) { }

  async execute(dto: GenerateMockupDTO): Promise<MockupResult> {
    const logo = dto.logo || dto.logoUrl || '';
    if (!logo) {
      throw new Error('Logo URL is required for mockup generation');
    }

    return this.mockupGenerator.generate({
      productId: dto.productId,
      productName: dto.productName,
      logo,
      companyName: dto.companyName,
      placement: dto.placement,
      colorVariant: dto.colorVariant,
    });
  }

  async executeBatch(dtos: GenerateMockupDTO[]): Promise<MockupResult[]> {
    const options = dtos.map(dto => {
      const logo = dto.logo || dto.logoUrl || '';
      if (!logo) {
        throw new Error(`Logo URL is required for mockup generation of product ${dto.productId}`);
      }

      return {
        productId: dto.productId,
        productName: dto.productName,
        logo,
        companyName: dto.companyName,
        placement: dto.placement,
        colorVariant: dto.colorVariant,
      };
    });
    return this.mockupGenerator.generateBatch(options);
  }
}


