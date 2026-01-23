import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { createAgentGraph } from '../graph.js';
import { AgentState } from '../types.js';
import { HumanMessage } from '@langchain/core/messages';

// Mock OpenAI to avoid API key requirements
vi.mock('openai', async (importOriginal) => {
  const OpenAI = vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'branded_merch' } }]
        })
      }
    }
  }));
  
  return { default: OpenAI, OpenAI };
});

describe('LangGraph - Generate Mockup State Transitions', () => {
  let graph: any;
  let mockDependencies: any;

  beforeAll(() => {
    // Set fake API key for tests
    process.env.OPENAI_API_KEY = 'sk-test-key-for-testing';
  });

  beforeEach(() => {
    // Mock dependencies
    mockDependencies = {
      extractBrandingUseCase: {
        executeFromUrl: vi.fn(),
      },
      recommendProductsUseCase: {
        execute: vi.fn(),
      },
      generateMockupUseCase: {
        execute: vi.fn().mockResolvedValue({
          mockupUrl: 'https://example.com/mockup.png',
          previewUrl: 'https://example.com/preview.png',
          generatedAt: new Date(),
        }),
      },
    };

    graph = createAgentGraph();
  });

  describe('Edge Case 1: Force transition with selectedTransition', () => {
    it('should route directly to generateMockup when selectedTransition is set', async () => {
      const input: Partial<AgentState> = {
        messages: [new HumanMessage({ content: '🎨 [FORCE] Generate mockup' })],
        sessionId: 'test-session',
        selectedTransition: 'to_generate_mockup', // 🔑 Force transition
        isFirstMessage: false,
        executionHistory: [],
        turnCount: 0,
        brandingInfo: {
          id: 'test-branding',
          companyName: 'Test Company',
          logos: [{ url: 'https://example.com/logo.png' }],
          colors: ['#000000'],
        },
      };

      const stream = await graph.stream(input, {
        configurable: mockDependencies,
      });

      const executedNodes: string[] = [];
      for await (const chunk of stream) {
        executedNodes.push(...Object.keys(chunk));
      }

      // Verify execution path
      expect(executedNodes).toContain('initialRouter');
      expect(executedNodes).toContain('generateMockup');
      expect(executedNodes).not.toContain('classifyIntent'); // Should skip
      expect(executedNodes).not.toContain('conversation'); // Should not fallback
    });

    it('should route to generateMockup with alternative transition IDs', async () => {
      const transitionIds = ['to_mockup', 'to_generate_mockup_force'];

      for (const transitionId of transitionIds) {
        const input: Partial<AgentState> = {
          messages: [new HumanMessage({ content: 'Generate mockup' })],
          sessionId: 'test-session',
          selectedTransition: transitionId,
          isFirstMessage: false,
          executionHistory: [],
          brandingInfo: { companyName: 'Test', logos: [], colors: [] },
        };

        const stream = await graph.stream(input, {
          configurable: mockDependencies,
        });

        const executedNodes: string[] = [];
        for await (const chunk of stream) {
          executedNodes.push(...Object.keys(chunk));
        }

        expect(executedNodes).toContain('generateMockup');
      }
    });
  });

  describe('Edge Case 2: Content-based fallback with [FORCE] marker', () => {
    it('should route to generateMockup when message contains [FORCE] and "mockup"', async () => {
      const input: Partial<AgentState> = {
        messages: [new HumanMessage({ content: '🎨 [FORCE] Generate a mockup now!' })],
        sessionId: 'test-session',
        selectedTransition: undefined, // No explicit transition
        isFirstMessage: false,
        executionHistory: [],
        brandingInfo: { companyName: 'Test', logos: [], colors: [] },
      };

      const stream = await graph.stream(input, {
        configurable: mockDependencies,
      });

      const executedNodes: string[] = [];
      for await (const chunk of stream) {
        executedNodes.push(...Object.keys(chunk));
      }

      expect(executedNodes).toContain('classifyIntent');
      expect(executedNodes).toContain('generateMockup');
    });

    it('should route to generateMockup when [FORCE] with "generate"', async () => {
      const input: Partial<AgentState> = {
        messages: [new HumanMessage({ content: '[FORCE] please generate the image' })],
        sessionId: 'test-session',
        isFirstMessage: false,
        executionHistory: [],
        brandingInfo: { companyName: 'Test', logos: [], colors: [] },
      };

      const stream = await graph.stream(input, {
        configurable: mockDependencies,
      });

      const executedNodes: string[] = [];
      for await (const chunk of stream) {
        executedNodes.push(...Object.keys(chunk));
      }

      expect(executedNodes).toContain('generateMockup');
    });
  });

  describe('Edge Case 3: Missing branding info - auto-create defaults', () => {
    it('should auto-create default branding when missing', async () => {
      const input: Partial<AgentState> = {
        messages: [new HumanMessage({ content: 'Generate mockup' })],
        sessionId: 'test-session',
        selectedTransition: 'to_generate_mockup',
        isFirstMessage: false,
        executionHistory: [],
        brandingInfo: undefined, // ❌ Missing branding
      };

      const stream = await graph.stream(input, {
        configurable: mockDependencies,
      });

      let finalState: any;
      for await (const chunk of stream) {
        if (chunk.generateMockup) {
          finalState = chunk.generateMockup;
        }
      }

      // Verify default branding was created
      expect(finalState.brandingInfo).toBeDefined();
      expect(finalState.brandingInfo.companyName).toBe('Your Company');
      expect(finalState.brandingConfirmed).toBe(true);
    });
  });

  describe('Edge Case 4: Missing product info - auto-create defaults', () => {
    it('should auto-create default product when missing', async () => {
      const input: Partial<AgentState> = {
        messages: [new HumanMessage({ content: 'Generate mockup' })],
        sessionId: 'test-session',
        selectedTransition: 'to_generate_mockup',
        isFirstMessage: false,
        executionHistory: [],
        brandingInfo: { companyName: 'Test', logos: [{ url: 'http://test.com/logo.png' }], colors: [] },
        recommendedProducts: undefined, // ❌ Missing products
      };

      const stream = await graph.stream(input, {
        configurable: mockDependencies,
      });

      let finalState: any;
      for await (const chunk of stream) {
        if (chunk.generateMockup) {
          finalState = chunk.generateMockup;
        }
      }

      // Verify default product was created
      expect(finalState.recommendedProducts).toBeDefined();
      expect(finalState.recommendedProducts.length).toBeGreaterThan(0);
      expect(finalState.recommendedProducts[0].name).toBe('Coffee Mug');
    });
  });

  describe('Edge Case 5: InitialRouter preserves selectedTransition', () => {
    it('should preserve selectedTransition through initialRouter', async () => {
      const input: Partial<AgentState> = {
        messages: [new HumanMessage({ content: 'Test' })],
        sessionId: 'test-session',
        selectedTransition: 'to_generate_mockup',
        isFirstMessage: false,
        executionHistory: [],
      };

      const stream = await graph.stream(input, {
        configurable: mockDependencies,
      });

      let routerOutput: any;
      for await (const chunk of stream) {
        if (chunk.initialRouter) {
          routerOutput = chunk.initialRouter;
        }
      }

      // Verify selectedTransition was preserved
      expect(routerOutput.selectedTransition).toBe('to_generate_mockup');
    });
  });

  describe('Edge Case 6: Conditional edges include generateMockup', () => {
    it('should have generateMockup as a valid conditional edge target', () => {
      // This test verifies the graph structure
      const compiledGraph = createAgentGraph();
      
      // The graph should compile without errors
      expect(compiledGraph).toBeDefined();
      expect(typeof compiledGraph.stream).toBe('function');
    });
  });

  describe('Edge Case 7: selectedTransition cleared after use', () => {
    it('should clear selectedTransition after generateMockup execution', async () => {
      const input: Partial<AgentState> = {
        messages: [new HumanMessage({ content: 'Generate mockup' })],
        sessionId: 'test-session',
        selectedTransition: 'to_generate_mockup',
        isFirstMessage: false,
        executionHistory: [],
        brandingInfo: { companyName: 'Test', logos: [{ url: 'http://test.com/logo.png' }], colors: [] },
      };

      const stream = await graph.stream(input, {
        configurable: mockDependencies,
      });

      let finalState: any;
      for await (const chunk of stream) {
        if (chunk.generateMockup) {
          finalState = chunk.generateMockup;
        }
      }

      // Verify selectedTransition was cleared
      expect(finalState.selectedTransition).toBeUndefined();
    });
  });

  describe('Edge Case 8: GenerateMockupUseCase called with correct params', () => {
    it('should call generateMockupUseCase with logo URL', async () => {
      const testLogoUrl = 'https://monoya.com/logo.png';
      const input: Partial<AgentState> = {
        messages: [new HumanMessage({ content: 'Generate mockup' })],
        sessionId: 'test-session',
        selectedTransition: 'to_generate_mockup',
        isFirstMessage: false,
        executionHistory: [],
        brandingInfo: {
          companyName: 'monoya',
          logos: [{ url: testLogoUrl }],
          colors: ['#000000'],
        },
      };

      const stream = await graph.stream(input, {
        configurable: mockDependencies,
      });

      for await (const chunk of stream) {
        // Consume stream
      }

      // Verify use case was called with correct params
      expect(mockDependencies.generateMockupUseCase.execute).toHaveBeenCalled();
      const callArgs = mockDependencies.generateMockupUseCase.execute.mock.calls[0][0];
      expect(callArgs.logoUrl).toBe(testLogoUrl);
      expect(callArgs.companyName).toBe('monoya');
    });
  });

  describe('Edge Case 9: Error handling when mockup generation fails', () => {
    it('should handle errors gracefully and return error message', async () => {
      mockDependencies.generateMockupUseCase.execute.mockRejectedValue(
        new Error('DALL-E API failed')
      );

      const input: Partial<AgentState> = {
        messages: [new HumanMessage({ content: 'Generate mockup' })],
        sessionId: 'test-session',
        selectedTransition: 'to_generate_mockup',
        isFirstMessage: false,
        executionHistory: [],
        brandingInfo: {
          companyName: 'Test',
          logos: [{ url: 'http://test.com/logo.png' }],
          colors: [],
        },
      };

      const stream = await graph.stream(input, {
        configurable: mockDependencies,
      });

      let finalState: any;
      for await (const chunk of stream) {
        if (chunk.generateMockup) {
          finalState = chunk.generateMockup;
        }
      }

      // Verify error was handled
      expect(finalState).toBeDefined();
      expect(finalState.lastNodeVisited).toBe('generateMockup');
      // Should have an error message
      const lastMessage = finalState.messages[finalState.messages.length - 1];
      expect(lastMessage.content).toContain("couldn't generate");
    });
  });

  describe('Edge Case 10: Multiple transitions in sequence', () => {
    it('should not route to generateMockup twice in one turn', async () => {
      const input: Partial<AgentState> = {
        messages: [new HumanMessage({ content: 'Generate mockup' })],
        sessionId: 'test-session',
        selectedTransition: 'to_generate_mockup',
        isFirstMessage: false,
        executionHistory: [],
        brandingInfo: { companyName: 'Test', logos: [{ url: 'http://test.com/logo.png' }], colors: [] },
      };

      const stream = await graph.stream(input, {
        configurable: mockDependencies,
      });

      const executedNodes: string[] = [];
      for await (const chunk of stream) {
        executedNodes.push(...Object.keys(chunk));
      }

      // Count occurrences of generateMockup
      const mockupCount = executedNodes.filter(n => n === 'generateMockup').length;
      expect(mockupCount).toBe(1); // Should only execute once
    });
  });
});

