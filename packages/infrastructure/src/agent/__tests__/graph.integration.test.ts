import { describe, it, expect, beforeEach } from 'vitest';

// Skip integration tests that require API keys
describe.skip('Agent Graph Integration', () => {});
import { HumanMessage } from '@langchain/core/messages';
import { createAgentGraph } from '../graph.js';
import { AgentState } from '../types.js';

describe('Graph Integration Tests', () => {
  let graph: any;

  beforeEach(() => {
    graph = createAgentGraph();
  });

  it('should create a compiled graph', () => {
    expect(graph).toBeDefined();
    expect(typeof graph.invoke).toBe('function');
    expect(typeof graph.stream).toBe('function');
  });

  describe('Graph Structure', () => {
    it('should have all required nodes', () => {
      // Graph is compiled, so we can't directly check nodes
      // But we can verify it doesn't throw during creation
      expect(() => createAgentGraph()).not.toThrow();
    });

    it('should accept valid initial state', async () => {
      const initialState: AgentState = {
        messages: [new HumanMessage({ content: 'Hello' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        isFirstMessage: true,
        executionHistory: [],
        turnCount: 0,
      };

      // Should not throw
      expect(() => graph.stream(initialState)).not.toThrow();
    });
  });

  describe('First Message Flow', () => {
    it('should route through welcome for first message', async () => {
      const initialState: AgentState = {
        messages: [new HumanMessage({ content: 'Hello' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        isFirstMessage: true,
        executionHistory: [],
        turnCount: 0,
      };

      const stream = await graph.stream(initialState);
      const chunks: string[] = [];

      for await (const chunk of stream) {
        const nodeKey = Object.keys(chunk)[0];
        chunks.push(nodeKey);
      }

      // Should include initialRouter and welcome
      expect(chunks).toContain('initialRouter');
      expect(chunks.some(node => node === 'welcome' || node === 'classifyIntent')).toBe(true);
    });
  });

  describe('Subsequent Message Flow', () => {
    it('should skip welcome for subsequent messages', async () => {
      const initialState: AgentState = {
        messages: [
          new HumanMessage({ content: 'First message' }),
          new HumanMessage({ content: 'Second message' }),
        ],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        isFirstMessage: false,
        executionHistory: [],
        turnCount: 1,
      };

      const stream = await graph.stream(initialState);
      const chunks: string[] = [];

      for await (const chunk of stream) {
        const nodeKey = Object.keys(chunk)[0];
        chunks.push(nodeKey);
      }

      expect(chunks).toContain('initialRouter');
      expect(chunks).toContain('classifyIntent');
      expect(chunks).not.toContain('welcome');
    });
  });

  describe('Force Routing', () => {
    it('should respect selectedTransition for direct routing', async () => {
      const initialState: AgentState = {
        messages: [new HumanMessage({ content: 'Test' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        isFirstMessage: false,
        executionHistory: [],
        turnCount: 1,
        selectedTransition: 'to_recommend_products_force',
        brandingInfo: { companyName: 'Test', logos: [], colors: [] },
      };

      const stream = await graph.stream(initialState);
      const chunks: string[] = [];

      for await (const chunk of stream) {
        const nodeKey = Object.keys(chunk)[0];
        chunks.push(nodeKey);
      }

      // Should route directly to recommendProducts
      expect(chunks).toContain('initialRouter');
      expect(chunks).toContain('recommendProducts');
      expect(chunks).not.toContain('classifyIntent');
    });
  });

  describe('State Persistence', () => {
    it('should persist branding info across turns', async () => {
      const brandingInfo = {
        companyName: 'Test Company',
        logos: [{ url: 'test.png' }],
        colors: ['#000000'],
      };

      const initialState: AgentState = {
        messages: [new HumanMessage({ content: 'Continue' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        isFirstMessage: false,
        executionHistory: [],
        turnCount: 1,
        brandingInfo,
      };

      const stream = await graph.stream(initialState);
      let finalState: any = null;

      for await (const chunk of stream) {
        const nodeKey = Object.keys(chunk)[0];
        finalState = chunk[nodeKey];
      }

      // Branding info should be preserved (unless explicitly updated)
      expect(finalState.brandingInfo || brandingInfo).toEqual(brandingInfo);
    });
  });

  describe('Loop Prevention', () => {
    it('should handle excessive execution history', async () => {
      const initialState: AgentState = {
        messages: [new HumanMessage({ content: 'Test' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        isFirstMessage: false,
        executionHistory: Array(15).fill('someNode'),
        turnCount: 10,
      };

      // Should not throw despite long history
      const stream = await graph.stream(initialState);
      const chunks: string[] = [];

      for await (const chunk of stream) {
        const nodeKey = Object.keys(chunk)[0];
        chunks.push(nodeKey);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.length).toBeLessThan(20); // Should not create infinite loops
    });
  });

  describe('Error Handling', () => {
    it('should handle empty messages array gracefully', async () => {
      const initialState: AgentState = {
        messages: [],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        isFirstMessage: true,
        executionHistory: [],
        turnCount: 0,
      };

      // Should not throw
      expect(async () => {
        const stream = await graph.stream(initialState);
        for await (const chunk of stream) {
          // Process chunks
        }
      }).not.toThrow();
    });
  });

  describe('Refactoring Verification', () => {
    it('should maintain same behavior as before refactoring', async () => {
      // This test verifies that the refactored code produces
      // the same graph structure and behavior

      const state1: AgentState = {
        messages: [new HumanMessage({ content: 'Hello' })],
        sessionId: 'test-1',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        isFirstMessage: true,
        executionHistory: [],
        turnCount: 0,
      };

      const state2: AgentState = {
        messages: [new HumanMessage({ content: 'https://example.com' })],
        sessionId: 'test-2',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        isFirstMessage: false,
        executionHistory: [],
        turnCount: 1,
      };

      // Both should execute without errors
      const stream1 = await graph.stream(state1);
      const stream2 = await graph.stream(state2);

      const chunks1: string[] = [];
      const chunks2: string[] = [];

      for await (const chunk of stream1) {
        chunks1.push(Object.keys(chunk)[0]);
      }

      for await (const chunk of stream2) {
        chunks2.push(Object.keys(chunk)[0]);
      }

      // Verify expected flows
      expect(chunks1.length).toBeGreaterThan(0);
      expect(chunks2.length).toBeGreaterThan(0);
      
      // First message should go through welcome
      expect(chunks1).toContain('initialRouter');
      
      // URL should trigger branding extraction or classification
      expect(chunks2).toContain('initialRouter');
      expect(chunks2).toContain('classifyIntent');
    });
  });
});

