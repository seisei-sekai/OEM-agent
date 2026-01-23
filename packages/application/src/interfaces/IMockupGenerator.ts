export interface MockupGenerationOptions {
  productId: string;
  productName?: string;
  logo: string;
  companyName?: string;
  placement?: 'center' | 'left-chest' | 'back' | 'full';
  colorVariant?: string;
}

export interface MockupResult {
  mockupUrl: string;
  previewUrl: string;
  generatedAt: Date;
}

export interface IMockupGenerator {
  generate(options: MockupGenerationOptions): Promise<MockupResult>;
  generateBatch(options: MockupGenerationOptions[]): Promise<MockupResult[]>;
}

