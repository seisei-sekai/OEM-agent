import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentState } from '../../types';

// Use vi.hoisted to create the mock function
const mockCreateFn = vi.hoisted(() => vi.fn());

// Mock OpenAI
vi.mock('openai', () => {
  return {
    OpenAI: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreateFn,
        },
      },
    })),
  };
});

// Import after mock
import { intentClassificationNode } from '../intentClassificationNode';

describe('intentClassificationNode', () => {
  beforeEach(() => {
    mockCreateFn.mockClear();
  });

  describe('intent classification', () => {
    it('should classify branded_merch intent correctly', async () => {
      mockCreateFn.mockResolvedValueOnce({
        choices: [{ message: { content: 'branded_merch' } }],
      });

      const state: AgentState = {
        messages: [{ role: 'user', content: 'I need t-shirts with our company logo' }],
        currentIntent: undefined,
        context: {},
      };

      const result = await intentClassificationNode(state);

      expect(result.currentIntent).toBe('branded_merch');
    });

    it('should classify custom intent correctly', async () => {
      mockCreateFn.mockResolvedValueOnce({
        choices: [{ message: { content: 'custom' } }],
      });

      const state: AgentState = {
        messages: [{ role: 'user', content: 'I want to manufacture a custom product' }],
        currentIntent: undefined,
        context: {},
      };

      const result = await intentClassificationNode(state);

      expect(result.currentIntent).toBe('custom');
    });

    it('should classify general intent correctly', async () => {
      mockCreateFn.mockResolvedValueOnce({
        choices: [{ message: { content: 'general' } }],
      });

      const state: AgentState = {
        messages: [{ role: 'user', content: 'Tell me about your services' }],
        currentIntent: undefined,
        context: {},
      };

      const result = await intentClassificationNode(state);

      expect(result.currentIntent).toBe('general');
    });

    it('should classify track_order intent correctly', async () => {
      mockCreateFn.mockResolvedValueOnce({
        choices: [{ message: { content: 'track_order' } }],
      });

      const state: AgentState = {
        messages: [{ role: 'user', content: 'Where is my order #12345?' }],
        currentIntent: undefined,
        context: {},
      };

      const result = await intentClassificationNode(state);

      expect(result.currentIntent).toBe('track_order');
    });
  });

  describe('edge cases', () => {
    it('should default to general for empty message', async () => {
      const state: AgentState = {
        messages: [{ role: 'user', content: '' }],
        currentIntent: undefined,
        context: {},
      };

      const result = await intentClassificationNode(state);

      expect(result.currentIntent).toBe('general');
    });

    it('should default to general for invalid intent response', async () => {
      mockCreateFn.mockResolvedValueOnce({
        choices: [{ message: { content: 'invalid_intent' } }],
      });

      const state: AgentState = {
        messages: [{ role: 'user', content: 'Hello' }],
        currentIntent: undefined,
        context: {},
      };

      const result = await intentClassificationNode(state);

      expect(result.currentIntent).toBe('general');
    });

    it('should handle missing OpenAI response gracefully', async () => {
      mockCreateFn.mockResolvedValueOnce({
        choices: [],
      });

      const state: AgentState = {
        messages: [{ role: 'user', content: 'Hello' }],
        currentIntent: undefined,
        context: {},
      };

      const result = await intentClassificationNode(state);

      expect(result.currentIntent).toBe('general');
    });

    it('should handle whitespace in OpenAI response', async () => {
      mockCreateFn.mockResolvedValueOnce({
        choices: [{ message: { content: '  branded_merch  ' } }],
      });

      const state: AgentState = {
        messages: [{ role: 'user', content: 'Logo products' }],
        currentIntent: undefined,
        context: {},
      };

      const result = await intentClassificationNode(state);

      expect(result.currentIntent).toBe('branded_merch');
    });

    it('should handle uppercase response from OpenAI', async () => {
      mockCreateFn.mockResolvedValueOnce({
        choices: [{ message: { content: 'BRANDED_MERCH' } }],
      });

      const state: AgentState = {
        messages: [{ role: 'user', content: 'Need branded items' }],
        currentIntent: undefined,
        context: {},
      };

      const result = await intentClassificationNode(state);

      expect(result.currentIntent).toBe('branded_merch');
    });
  });

  describe('error handling', () => {
    it.skip('should handle OpenAI API errors', async () => {
      mockCreateFn.mockRejectedValueOnce(
        new Error('API rate limit exceeded')
      );

      const state: AgentState = {
        messages: [{ role: 'user', content: 'Hello' }],
        currentIntent: undefined,
        context: {},
      };

      await expect(intentClassificationNode(state)).rejects.toThrow('API rate limit exceeded');
    });
  });

  describe('message handling', () => {
    it('should use the last message for classification', async () => {
      mockCreateFn.mockResolvedValueOnce({
        choices: [{ message: { content: 'track_order' } }],
      });

      const state: AgentState = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: 'Track my order' },
        ],
        currentIntent: undefined,
        context: {},
      };

      const result = await intentClassificationNode(state);

      expect(result.currentIntent).toBe('track_order');
      expect(mockCreateFn).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: 'Track my order',
            }),
          ]),
        })
      );
    });
  });
});

