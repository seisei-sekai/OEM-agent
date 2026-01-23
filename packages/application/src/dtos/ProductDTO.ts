import { z } from 'zod';
import { ProductCategorySchema } from '@repo/domain';

export const RecommendProductsDTOSchema = z.object({
  sessionId: z.string().uuid(),
  intent: z.enum(['branded_merch', 'custom', 'general']),
  brandingId: z.string().optional(),
  filters: z.object({
    category: ProductCategorySchema.optional(),
    minPrice: z.number().positive().optional(),
    maxPrice: z.number().positive().optional(),
    minQuantity: z.number().int().positive().optional(),
  }).optional(),
  limit: z.number().int().positive().optional(),
});

export type RecommendProductsDTO = z.infer<typeof RecommendProductsDTOSchema>;

export const GenerateMockupDTOSchema = z.object({
  productId: z.string(),
  productName: z.string().optional(),
  logo: z.string().optional(),
  logoUrl: z.string().optional(),
  companyName: z.string().optional(),
  placement: z.enum(['center', 'left-chest', 'back', 'full']).optional(),
  colorVariant: z.string().optional(),
}).refine(data => data.logo || data.logoUrl, {
  message: "Either 'logo' or 'logoUrl' must be provided",
});

export type GenerateMockupDTO = z.infer<typeof GenerateMockupDTOSchema>;


