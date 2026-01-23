import { IMockupGenerator, MockupGenerationOptions, MockupResult } from '@repo/application';
import { OpenAIService } from './OpenAIService.js';

export class MockupGeneratorService implements IMockupGenerator {
  constructor(private readonly openAIService: OpenAIService) {}

  async generate(options: MockupGenerationOptions): Promise<MockupResult> {
    const productName = options.productName || options.productId;
    const companyName = options.companyName || 'brand';
    const placement = options.placement || 'center';
    
    const prompt = `A realistic, high-quality product photograph showing a ${productName} with the "${companyName}" company logo clearly visible on the ${placement} of the product. Professional studio lighting, clean white background, photorealistic rendering, commercial product photography style, sharp focus, no additional text or watermarks. The logo should be clearly integrated into the product design as if it was professionally printed or embroidered.`;

    try {
      const imageUrl = await this.openAIService.generateImage(prompt);
      return {
        mockupUrl: imageUrl,
        previewUrl: imageUrl,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Image generation failed:', error);
      const fallbackText = encodeURIComponent(`${productName} with ${companyName} logo`);
      return {
        mockupUrl: `https://via.placeholder.com/800x800.png?text=${fallbackText}`,
        previewUrl: `https://via.placeholder.com/400x400.png?text=${fallbackText}`,
        generatedAt: new Date(),
      };
    }
  }

  async generateBatch(options: MockupGenerationOptions[]): Promise<MockupResult[]> {
    // Generate mockups in parallel
    const promises = options.map(opt => this.generate(opt));
    return Promise.all(promises);
  }
}

