import { describe, it, expect } from 'vitest';
import { HumanMessage } from '@langchain/core/messages';
import { routeInitial, routeByIntent, shouldEnd } from '../routing.js';
import { AgentState } from '../types.js';
import { END } from '@langchain/langgraph';

describe('Routing Functions', () => {
  describe('routeInitial', () => {
    it('should route to welcome for first message', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: 'Hello' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        isFirstMessage: true,
        executionHistory: [],
        turnCount: 0,
      };

      const result = routeInitial(state);
      expect(result).toBe('welcome');
    });

    it('should route to classifyIntent for subsequent messages', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: 'Hello again' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        isFirstMessage: false,
        executionHistory: [],
        turnCount: 1,
      };

      const result = routeInitial(state);
      expect(result).toBe('classifyIntent');
    });

    it('should route to recommendProducts with force transition', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: 'Test' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        isFirstMessage: false,
        executionHistory: [],
        turnCount: 1,
        selectedTransition: 'to_recommend_products_force',
      };

      const result = routeInitial(state);
      expect(result).toBe('recommendProducts');
    });

    it('should route to generateMockup with force transition', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: 'Test' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        isFirstMessage: false,
        executionHistory: [],
        turnCount: 1,
        selectedTransition: 'to_generate_mockup_force',
      };

      const result = routeInitial(state);
      expect(result).toBe('generateMockup');
    });

    it('should respect selectedTransition from availableTransitions', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: 'Test' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        isFirstMessage: false,
        executionHistory: [],
        turnCount: 1,
        selectedTransition: 'custom_transition',
        availableTransitions: [
          {
            id: 'custom_transition',
            label: 'Custom',
            description: 'Test',
            targetNode: 'conversation',
          },
        ],
      };

      const result = routeInitial(state);
      expect(result).toBe('conversation');
    });
  });

  describe('routeByIntent', () => {
    it('should route to extractBranding when URL detected', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: 'Check out https://example.com' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        executionHistory: [],
        turnCount: 0,
      };

      const result = routeByIntent(state);
      expect(result).toBe('extractBranding');
    });

    it('should route to recommendProducts when branding confirmed via context', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: 'Ready' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        executionHistory: [],
        turnCount: 0,
        brandingInfo: { companyName: 'Test', logos: [], colors: [] },
        brandingConfirmed: true,
      };

      const result = routeByIntent(state);
      expect(result).toBe('recommendProducts');
    });

    it('should route to recommendProducts when user confirms via message', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: 'Yes, use this branding' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        executionHistory: [],
        turnCount: 0,
        brandingInfo: { companyName: 'Test', logos: [], colors: [] },
      };

      const result = routeByIntent(state);
      expect(result).toBe('recommendProducts');
    });

    it('should route to generateMockup when visualization requested', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: 'Show me a mockup of the t-shirt' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        executionHistory: [],
        turnCount: 0,
        brandingInfo: { companyName: 'Test', logos: [], colors: [] },
        recommendedProducts: [{ id: '1', name: 'T-Shirt' }],
      };

      const result = routeByIntent(state);
      expect(result).toBe('generateMockup');
    });

    it('should route to conversation as fallback', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: 'Just chatting' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        executionHistory: [],
        turnCount: 0,
      };

      const result = routeByIntent(state);
      expect(result).toBe('conversation');
    });

    it('should prevent infinite loops', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: 'Test' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        executionHistory: Array(15).fill('someNode'),
        turnCount: 0,
      };

      const result = routeByIntent(state);
      expect(result).toBe('conversation');
    });

    it('should respect selectedTransition (highest priority)', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: 'Test' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        executionHistory: [],
        turnCount: 0,
        selectedTransition: 'confirm_branding',
      };

      const result = routeByIntent(state);
      expect(result).toBe('recommendProducts');
    });

    it('should handle force content routing', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: '[FORCE] Generate mockup' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        executionHistory: [],
        turnCount: 0,
      };

      const result = routeByIntent(state);
      expect(result).toBe('generateMockup');
    });
  });

  describe('shouldEnd', () => {
    it('should always return END', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: 'Test' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        executionHistory: [],
        turnCount: 0,
      };

      const result = shouldEnd(state);
      expect(result).toBe(END);
    });
  });

  describe('Priority order verification', () => {
    it('should prioritize selectedTransition over automatic routing', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: 'https://example.com' })], // Would normally route to extractBranding
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        executionHistory: [],
        turnCount: 0,
        selectedTransition: 'to_generate_mockup', // But user selected mockup
      };

      const result = routeByIntent(state);
      expect(result).toBe('generateMockup'); // Should respect user choice
    });

    it('should prioritize force content over normal URL detection', () => {
      const state: AgentState = {
        messages: [new HumanMessage({ content: '[FORCE] product recommendations https://example.com' })],
        sessionId: 'test-session',
        currentIntent: 'idle',
        context: {},
        needsEscalation: false,
        executionHistory: [],
        turnCount: 0,
      };

      const result = routeByIntent(state);
      expect(result).toBe('recommendProducts'); // Force takes priority over URL
    });
  });
});

