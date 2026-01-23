import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenerateMockupUseCase } from '../GenerateMockupUseCase.js';
import { IMockupGenerator, MockupResult } from '../../interfaces/IMockupGenerator.js';

describe('GenerateMockupUseCase', () => {
  let useCase: GenerateMockupUseCase;
  let mockGenerator: IMockupGenerator;

  beforeEach(() => {
    mockGenerator = {
      generate: vi.fn().mockResolvedValue({
        mockupUrl: 'https://example.com/mockup.png',
        previewUrl: 'https://example.com/preview.png',
        generatedAt: new Date(),
      }),
      generateBatch: vi.fn(),
    };

    useCase = new GenerateMockupUseCase(mockGenerator);
  });

  describe('execute', () => {
    it('should call mockupGenerator with logo URL', async () => {
      const dto = {
        productId: 'ceramic-mug',
        productName: 'Ceramic Mug',
        logo: 'https://monoya.com/logo.png',
        companyName: 'monoya',
        placement: 'center' as const,
      };

      await useCase.execute(dto);

      expect(mockGenerator.generate).toHaveBeenCalledWith({
        productId: 'ceramic-mug',
        productName: 'Ceramic Mug',
        logo: 'https://monoya.com/logo.png',
        companyName: 'monoya',
        placement: 'center',
        colorVariant: undefined,
      });
    });

    it('should use logoUrl if logo is not provided', async () => {
      const dto = {
        productId: 'mug',
        logoUrl: 'https://test.com/logo.png',
        companyName: 'Test',
      };

      await useCase.execute(dto);

      const callArgs = (mockGenerator.generate as any).mock.calls[0][0];
      expect(callArgs.logo).toBe('https://test.com/logo.png');
    });

    it('should throw error if no logo URL provided', async () => {
      const dto = {
        productId: 'mug',
        companyName: 'Test',
      };

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Logo URL is required for mockup generation'
      );
    });

    it('should return mockup result with URL', async () => {
      const dto = {
        productId: 'mug',
        logo: 'https://test.com/logo.png',
        companyName: 'Test',
      };

      const result = await useCase.execute(dto);

      expect(result).toEqual({
        mockupUrl: 'https://example.com/mockup.png',
        previewUrl: 'https://example.com/preview.png',
        generatedAt: expect.any(Date),
      });
    });
  });

  describe('executeBatch', () => {
    it('should generate multiple mockups', async () => {
      const dtos = [
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

      mockGenerator.generateBatch = vi.fn().mockResolvedValue([
        {
          mockupUrl: 'https://example.com/mockup1.png',
          previewUrl: 'https://example.com/preview1.png',
          generatedAt: new Date(),
        },
        {
          mockupUrl: 'https://example.com/mockup2.png',
          previewUrl: 'https://example.com/preview2.png',
          generatedAt: new Date(),
        },
      ]);

      const results = await useCase.executeBatch(dtos);

      expect(results).toHaveLength(2);
      expect(mockGenerator.generateBatch).toHaveBeenCalled();
    });

    it('should throw error if any DTO missing logo', async () => {
      const dtos = [
        {
          productId: 'mug1',
          logo: 'https://test.com/logo1.png',
          companyName: 'Test1',
        },
        {
          productId: 'mug2',
          // Missing logo!
          companyName: 'Test2',
        },
      ];

      await expect(useCase.executeBatch(dtos)).rejects.toThrow(
        'Logo URL is required'
      );
    });
  });
});

