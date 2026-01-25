import { describe, it, expect } from 'vitest';
import { HumanMessage } from '@langchain/core/messages';
import { initialRouterNode } from '../initialRouterNode.js';
import { AgentState } from '../../types.js';

describe('initialRouterNode', () => {
  it('should increment turn count', async () => {
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

    const result = await initialRouterNode(state);

    expect(result.turnCount).toBe(1);
  });

  it('should add initialRouter to execution history', async () => {
    const state: AgentState = {
      messages: [new HumanMessage({ content: 'Hello' })],
      sessionId: 'test-session',
      currentIntent: 'idle',
      context: {},
      needsEscalation: false,
      isFirstMessage: true,
      executionHistory: ['welcome'],
      turnCount: 0,
    };

    const result = await initialRouterNode(state);

    expect(result.executionHistory).toEqual(['welcome', 'initialRouter']);
  });

  it('should set lastNodeVisited to initialRouter', async () => {
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

    const result = await initialRouterNode(state);

    expect(result.lastNodeVisited).toBe('initialRouter');
  });

  it('should provide available transitions', async () => {
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

    const result = await initialRouterNode(state);

    expect(result.availableTransitions).toBeDefined();
    expect(result.availableTransitions).toHaveLength(2);
    
    const transitionIds = result.availableTransitions?.map(t => t.id);
    expect(transitionIds).toContain('to_welcome');
    expect(transitionIds).toContain('to_classify');
  });

  it('should preserve selectedTransition', async () => {
    const state: AgentState = {
      messages: [new HumanMessage({ content: 'Hello' })],
      sessionId: 'test-session',
      currentIntent: 'idle',
      context: {},
      needsEscalation: false,
      isFirstMessage: false,
      executionHistory: [],
      turnCount: 0,
      selectedTransition: 'to_generate_mockup',
    };

    const result = await initialRouterNode(state);

    expect(result.selectedTransition).toBe('to_generate_mockup');
  });

  it('should handle missing selectedTransition', async () => {
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

    const result = await initialRouterNode(state);

    expect(result.selectedTransition).toBeUndefined();
  });

  it('should verify transition structure', async () => {
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

    const result = await initialRouterNode(state);

    result.availableTransitions?.forEach(transition => {
      expect(transition).toHaveProperty('id');
      expect(transition).toHaveProperty('label');
      expect(transition).toHaveProperty('description');
      expect(transition).toHaveProperty('targetNode');
      expect(transition).toHaveProperty('trigger');
      
      expect(typeof transition.id).toBe('string');
      expect(typeof transition.label).toBe('string');
      expect(typeof transition.description).toBe('string');
      expect(typeof transition.targetNode).toBe('string');
    });
  });

  it('should have correct transition targets', async () => {
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

    const result = await initialRouterNode(state);

    const welcomeTransition = result.availableTransitions?.find(t => t.id === 'to_welcome');
    expect(welcomeTransition?.targetNode).toBe('welcome');
    
    const classifyTransition = result.availableTransitions?.find(t => t.id === 'to_classify');
    expect(classifyTransition?.targetNode).toBe('classifyIntent');
  });
});

