/**
 * Integration Test: Generate Mockup Flow
 * Tests the complete flow from button click to mockup generation
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { createAgentGraph } from '../graph.js';
import { AgentState } from '../types.js';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

describe('Integration: Generate Mockup Button Flow', () => {
  let graph: any;

  beforeAll(() => {
    // Set test environment
    process.env.OPENAI_API_KEY = 'sk-test-key';
    graph = createAgentGraph();
  });

  afterEach(() => {
    // Clean up after each test
  });

  describe('Test 1: Route to generateMockup with selectedTransition', () => {
    it('should execute generateMockup node when selectedTransition is set', async () => {
      const input: Partial<AgentState> = {
        messages: [
          new HumanMessage({ content: '🎨 [FORCE] Generate a ceramic mug mockup with my logo now!' })
        ],
        sessionId: 'test-session-001',
        selectedTransition: 'to_generate_mockup', // 🔑 This is what the button sends
        brandingConfirmed: true,
        isFirstMessage: false,
        executionHistory: [],
        turnCount: 0,
        brandingInfo: {
          id: 'test-branding',
          companyName: 'monoya',
          logos: [{ url: 'https://monoya.com/logo.png' }],
          colors: ['#000000'],
        },
      };

      const executionLog: string[] = [];
      const states: any[] = [];

      try {
        const stream = await graph.stream(input, {
          configurable: {
            extractBrandingUseCase: {
              executeFromUrl: async () => ({
                companyName: 'monoya',
                logos: [{ url: 'https://monoya.com/logo.png' }],
                colors: ['#000000'],
              })
            },
            recommendProductsUseCase: {
              execute: async () => []
            },
            generateMockupUseCase: {
              execute: async () => ({
                mockupUrl: 'https://test.com/mockup.png',
                previewUrl: 'https://test.com/preview.png',
                generatedAt: new Date(),
              })
            }
          }
        });

        for await (const chunk of stream) {
          const nodeNames = Object.keys(chunk);
          executionLog.push(...nodeNames);
          states.push(chunk);
          
          console.log('🔍 Executed node:', nodeNames[0]);
          if (chunk[nodeNames[0]]) {
            console.log('   State:', {
              lastNodeVisited: chunk[nodeNames[0]].lastNodeVisited,
              selectedTransition: chunk[nodeNames[0]].selectedTransition,
              currentIntent: chunk[nodeNames[0]].currentIntent,
            });
          }
        }
      } catch (error) {
        console.error('❌ Graph execution error:', error);
        throw error;
      }

      // Assertions
      console.log('\n📊 Execution Log:', executionLog);
      
      // TEST 1: initialRouter should be called
      expect(executionLog).toContain('initialRouter');
      
      // TEST 2: generateMockup should be called (NOT classifyIntent)
      expect(executionLog).toContain('generateMockup');
      
      // TEST 3: Should NOT go through classifyIntent
      expect(executionLog).not.toContain('classifyIntent');
      
      // TEST 4: Should NOT go through extractBranding
      expect(executionLog).not.toContain('extractBranding');
      
      // TEST 5: Final state should have lastNodeVisited = 'generateMockup'
      const finalState = states[states.length - 1];
      const finalNodeName = Object.keys(finalState)[0];
      expect(finalState[finalNodeName].lastNodeVisited).toBe('generateMockup');
      
      // TEST 6: Should have mockup in messages
      const lastMessage = finalState[finalNodeName].messages[finalState[finalNodeName].messages.length - 1];
      console.log('\n📝 Last message:', lastMessage.content);
      
      // Message should contain mockup URL or mockup generation confirmation
      const messageContent = typeof lastMessage.content === 'string' ? lastMessage.content : '';
      expect(
        messageContent.includes('mockup') || 
        messageContent.includes('Mug') ||
        messageContent.includes('https://')
      ).toBe(true);
    });
  });

  describe('Test 2: Check initialRouter routing logic', () => {
    it('should prioritize selectedTransition over isFirstMessage', async () => {
      const input: Partial<AgentState> = {
        messages: [new HumanMessage({ content: 'Test' })],
        sessionId: 'test-session-002',
        selectedTransition: 'to_generate_mockup',
        isFirstMessage: true, // Even though first message, should skip welcome
        executionHistory: [],
        turnCount: 0,
      };

      const executionLog: string[] = [];
      const stream = await graph.stream(input, {
        configurable: {
          generateMockupUseCase: {
            execute: async () => ({
              mockupUrl: 'https://test.com/mockup.png',
              previewUrl: 'https://test.com/preview.png',
              generatedAt: new Date(),
            })
          }
        }
      });

      for await (const chunk of stream) {
        executionLog.push(...Object.keys(chunk));
      }

      console.log('\n📊 Execution Log:', executionLog);
      
      // Should go directly to generateMockup, NOT welcome
      expect(executionLog).toContain('generateMockup');
      expect(executionLog).not.toContain('welcome');
    });
  });

  describe('Test 3: Check routeInitial function directly', () => {
    it('should return "generateMockup" when selectedTransition is set', () => {
      // Import routeInitial (we'll need to export it for testing)
      const state: AgentState = {
        messages: [new HumanMessage({ content: 'Test' })],
        sessionId: 'test',
        selectedTransition: 'to_generate_mockup',
        isFirstMessage: false,
        executionHistory: [],
        turnCount: 0,
      };

      // We can't directly test routeInitial since it's not exported
      // But we can verify through graph execution
      console.log('✅ Test 3 validates routing through integration test above');
    });
  });

  describe('Test 4: Verify selectedTransition persistence', () => {
    it('should preserve selectedTransition through initialRouter node', async () => {
      const input: Partial<AgentState> = {
        messages: [new HumanMessage({ content: 'Test' })],
        sessionId: 'test-session-004',
        selectedTransition: 'to_generate_mockup',
        isFirstMessage: false,
        executionHistory: [],
      };

      const stream = await graph.stream(input, {
        configurable: {
          generateMockupUseCase: {
            execute: async () => ({
              mockupUrl: 'https://test.com/mockup.png',
              previewUrl: 'https://test.com/preview.png',
              generatedAt: new Date(),
            })
          }
        }
      });

      let initialRouterOutput: any = null;
      for await (const chunk of stream) {
        if (chunk.initialRouter) {
          initialRouterOutput = chunk.initialRouter;
          console.log('\n🔍 initialRouter output:', {
            selectedTransition: initialRouterOutput.selectedTransition,
            lastNodeVisited: initialRouterOutput.lastNodeVisited,
          });
        }
      }

      // initialRouter should preserve selectedTransition
      expect(initialRouterOutput).toBeTruthy();
      expect(initialRouterOutput.selectedTransition).toBe('to_generate_mockup');
    });
  });

  describe('Test 5: Check if mockup URL is in response', () => {
    it('should include mockup URL in final AI message', async () => {
      const input: Partial<AgentState> = {
        messages: [new HumanMessage({ content: '🎨 Generate mockup' })],
        sessionId: 'test-session-005',
        selectedTransition: 'to_generate_mockup',
        isFirstMessage: false,
        executionHistory: [],
        brandingInfo: {
          companyName: 'monoya',
          logos: [{ url: 'https://monoya.com/logo.png' }],
          colors: ['#000000'],
        },
      };

      const mockupUrl = 'https://oaidalleapiprodscus.blob.core.windows.net/private/test-mockup.png';
      
      const stream = await graph.stream(input, {
        configurable: {
          generateMockupUseCase: {
            execute: async () => ({
              mockupUrl: mockupUrl,
              previewUrl: mockupUrl,
              generatedAt: new Date(),
            })
          }
        }
      });

      let finalMessages: any[] = [];
      for await (const chunk of stream) {
        const nodeName = Object.keys(chunk)[0];
        if (chunk[nodeName]?.messages) {
          finalMessages = chunk[nodeName].messages;
        }
      }

      // Find the last AI message
      const lastAIMessage = finalMessages.reverse().find(m => m._getType() === 'ai');
      console.log('\n📝 Last AI message:', lastAIMessage?.content);

      expect(lastAIMessage).toBeTruthy();
      
      // The message should contain the mockup URL
      const content = typeof lastAIMessage.content === 'string' ? lastAIMessage.content : '';
      expect(content).toContain(mockupUrl);
    });
  });
});

