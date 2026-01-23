import { z } from 'zod';

export const ExtractBrandingFromUrlDTOSchema = z.object({
  url: z.string().url(),
  sessionId: z.string().uuid(),
  userId: z.string().optional(),
});

export type ExtractBrandingFromUrlDTO = z.infer<typeof ExtractBrandingFromUrlDTOSchema>;

export const ExtractBrandingFromFileDTOSchema = z.object({
  file: z.instanceof(Buffer),
  mimeType: z.enum(['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']),
  sessionId: z.string().uuid(),
  userId: z.string().optional(),
});

export type ExtractBrandingFromFileDTO = z.infer<typeof ExtractBrandingFromFileDTOSchema>;


