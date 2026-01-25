import { Hono } from 'hono';
import { container } from '../di/container.js';
import {
  IExtractBrandingUseCase,
  ExtractBrandingFromUrlDTOSchema,
} from '@repo/application';

const brandingRoute = new Hono();

// Extract branding from URL
brandingRoute.post('/extract-url', async (c) => {
  try {
    const body = await c.req.json();
    const dto = ExtractBrandingFromUrlDTOSchema.parse(body);

    const useCase = container.resolve<IExtractBrandingUseCase>('IExtractBrandingUseCase');
    const branding = await useCase.executeFromUrl(dto);

    return c.json({
      branding: branding.toJSON(),
    });
  } catch (error) {
    return c.json({
      error: 'Failed to extract branding',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Extract branding from file upload
brandingRoute.post('/extract-upload', async (c) => {
  try {
    // Note: File upload handling would be implemented with multipart/form-data parser
    // This is a simplified version
    const body = await c.req.parseBody();
    
    return c.json({
      error: 'File upload not yet implemented',
      message: 'Use extract-url endpoint for now',
    }, 501);
  } catch (error) {
    return c.json({
      error: 'Failed to process upload',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default brandingRoute;



