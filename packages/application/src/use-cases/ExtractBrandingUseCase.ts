import { BrandingInfo, IBrandingRepository } from '@repo/domain';
import { ExtractBrandingFromUrlDTO, ExtractBrandingFromFileDTO } from '../dtos/BrandingDTO.js';
import { IBrandingExtractor } from '../interfaces/IBrandingExtractor.js';

export interface IExtractBrandingUseCase {
  executeFromUrl(dto: ExtractBrandingFromUrlDTO): Promise<BrandingInfo>;
  executeFromFile(dto: ExtractBrandingFromFileDTO): Promise<BrandingInfo>;
}

export class ExtractBrandingUseCase implements IExtractBrandingUseCase {
  constructor(
    private readonly brandingExtractor: IBrandingExtractor,
    private readonly brandingRepository: IBrandingRepository
  ) {}

  async executeFromUrl(dto: ExtractBrandingFromUrlDTO): Promise<BrandingInfo> {
    const result = await this.brandingExtractor.extractFromUrl(dto.url);
    await this.brandingRepository.save(result.branding);
    return result.branding;
  }

  async executeFromFile(dto: ExtractBrandingFromFileDTO): Promise<BrandingInfo> {
    const result = await this.brandingExtractor.extractFromFile(dto.file, dto.mimeType);
    await this.brandingRepository.save(result.branding);
    return result.branding;
  }
}


