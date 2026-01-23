import { z } from 'zod';

export const SendMessageDTOSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(2000),
  context: z.object({
    pageUrl: z.string().optional(),
    pageType: z.enum(['landing', 'catalog', 'product', 'marketplace']).optional(),
    viewedProducts: z.array(z.string()).optional(),
    cartItems: z.array(z.string()).optional(),
    // Agent state control fields
    selectedTransition: z.string().optional(), // Force specific state transition
    brandingConfirmed: z.boolean().optional(), // User confirmed branding
    brandingInfo: z.any().optional(), // Branding info from session
    recommendedProducts: z.array(z.any()).optional(), // Recommended products from session
  }).passthrough().optional(), // 🔑 Allow unknown keys to pass through
});

export type SendMessageDTO = z.infer<typeof SendMessageDTOSchema>;

export const CreateSessionDTOSchema = z.object({
  userId: z.string().optional(),
});

export type CreateSessionDTO = z.infer<typeof CreateSessionDTOSchema>;

export const LoadChatHistoryDTOSchema = z.object({
  userId: z.string(),
  limit: z.number().int().positive().optional(),
});

export type LoadChatHistoryDTO = z.infer<typeof LoadChatHistoryDTOSchema>;


