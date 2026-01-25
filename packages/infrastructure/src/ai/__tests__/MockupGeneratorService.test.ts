import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockupGeneratorService } from '../MockupGeneratorService.js';
import { OpenAIService } from '../OpenAIService.js';

describe('MockupGeneratorService', () => {
  let service: MockupGeneratorService;
  let mockOpenAI: OpenAIService;

  beforeEach(() => {
    mockOpenAI = {
      generateImage: vi.fn().mockResolvedValue('https://oaidalleapiprodscus.blob.core.windows.net/private/mockup.png'),
    } as any;

    service = new MockupGeneratorService(mockOpenAI);
  });

  describe('generate', () => {
    it('should call OpenAI generateImage with correct prompt', async () => {
      const options = {
        productId: 'ceramic-mug',
        productName: 'Ceramic Mug',
        logo: 'https://monoya.com/logo.png',
        companyName: 'monoya',
        placement: 'center' as const,
      };

      await service.generate(options);

      expect(mockOpenAI.generateImage).toHaveBeenCalled();
      const prompt = (mockOpenAI.generateImage as any).mock.calls[0][0];
      
      // Verify prompt contains key elements
      expect(prompt).toContain('Ceramic Mug');
      expect(prompt).toContain('monoya');
      expect(prompt).toContain('center');
      expect(prompt).toContain('realistic');
      expect(prompt).toContain('professional');
    });

    it('should return mockup URL from OpenAI', async () => {
      const options = {
        productId: 'mug',
        logo: 'https://test.com/logo.png',
        companyName: 'Test',
      };

      const result = await service.generate(options);

      expect(result.mockupUrl).toBe('https://oaidalleapiprodscus.blob.core.windows.net/private/mockup.png');
      expect(result.previewUrl).toBe('https://oaidalleapiprodscus.blob.core.windows.net/private/mockup.png');
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should use default values for missing optional params', async () => {
      const options = {
        productId: 'mug',
        logo: 'https://test.com/logo.png',
      };

      await service.generate(options);

      const prompt = (mockOpenAI.generateImage as any).mock.calls[0][0];
      expect(prompt).toContain('mug'); // Uses productId as productName
      expect(prompt).toContain('brand'); // Default company name
      expect(prompt).toContain('center'); // Default placement
    });

    it('should return placeholder URL on error', async () => {
      (mockOpenAI.generateImage as any).mockRejectedValue(new Error('API Error'));

      const options = {
        productId: 'test-mug',
        productName: 'Test Mug',
        logo: 'https://test.com/logo.png',
        companyName: 'Test Company',
      };

      const result = await service.generate(options);

      // Should return fallback placeholder
      expect(result.mockupUrl).toContain('placeholder');
      expect(result.mockupUrl).toContain('Test+Mug');
      expect(result.mockupUrl).toContain('Test+Company');
    });

    it('should handle different placements', async () => {
      const placements: Array<'center' | 'left-chest' | 'back' | 'full'> = [
        'center',
        'left-chest',
        'back',
        'full',
      ];

      for (const placement of placements) {
        const options = {
          productId: 'mug',
          logo: 'https://test.com/logo.png',
          companyName: 'Test',
          placement,
        };

        await service.generate(options);

        const prompt = (mockOpenAI.generateImage as any).mock.calls[
          (mockOpenAI.generateImage as any).mock.calls.length - 1
        ][0];
        expect(prompt).toContain(placement);
      }
    });
  });

  describe('generateBatch', () => {
    it('should generate multiple mockups in parallel', async () => {
      const options = [
        {
          productId: 'mug1',
          logo: 'https://test.com/logo1.png',
          companyName: 'Test1',
        },
        {
          productId: 'mug2',
          logo: 'https://test.com/logo2.png',
          companyName: 'Test2',
        },
      ];

      const results = await service.generateBatch(options);

      expect(results).toHaveLength(2);
      expect(mockOpenAI.generateImage).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures in batch', async () => {
      (mockOpenAI.generateImage as any)
        .mockResolvedValueOnce('https://example.com/mockup1.png')
        .mockRejectedValueOnce(new Error('API Error'));

      const options = [
        {
          productId: 'mug1',
          logo: 'https://test.com/logo1.png',
          companyName: 'Test1',
        },
        {
          productId: 'mug2',
          logo: 'https://test.com/logo2.png',
          companyName: 'Test2',
        },
      ];

      const results = await service.generateBatch(options);

      // First should succeed, second should use fallback
      expect(results[0].mockupUrl).toBe('https://example.com/mockup1.png');
      expect(results[1].mockupUrl).toContain('placeholder');
    });
  });
});


