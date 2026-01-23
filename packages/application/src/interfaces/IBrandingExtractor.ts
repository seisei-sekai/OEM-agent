import { BrandingInfo } from '@repo/domain';

export interface BrandingExtractionResult {
  branding: BrandingInfo;
  confidence: number;
}

export interface IBrandingExtractor {
  extractFromUrl(url: string): Promise<BrandingExtractionResult>;
  extractFromFile(file: Buffer, mimeType: string): Promise<BrandingExtractionResult>;
}


