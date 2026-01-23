/**
 * Test: SSE Stream for Mockup Generation
 * Validates that show_product_image action is correctly streamed
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { AgentService } from '../AgentService.js';
import { createAgentGraph } from '../graph.js';

describe('SSE: Mockup Generation Stream', () => {
  let agentService: AgentService;

  beforeAll(() => {
    process.env.OPENAI_API_KEY = 'sk-test-key';
    
    const mockDependencies = {
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
          mockupUrl: 'https://test-mockup-url.com/mockup.png',
          previewUrl: 'https://test-mockup-url.com/preview.png',
          generatedAt: new Date(),
        })
      }
    };

    const graph = createAgentGraph();
    agentService = new AgentService(graph, mockDependencies as any);
  });

  describe('Test 1: Verify show_product_image action event is yielded', () => {
    it('should yield action event with type show_product_image', async () => {
      const events: any[] = [];
      
      const stream = agentService.processMessage(
        'test-session-001',
        '🎨 [FORCE] Generate mockup',
        {
          selectedTransition: 'to_generate_mockup',
          brandingConfirmed: true,
          brandingInfo: {
            companyName: 'monoya',
            logos: [{ url: 'https://monoya.com/logo.png' }],
            colors: ['#000000'],
          }
        }
      );

      for await (const event of stream) {
        events.push(event);
        console.log('📡 SSE Event:', event.type, event.data ? Object.keys(event.data) : '');
        
        if (event.type === 'action' && event.data.type === 'show_product_image') {
          console.log('🎨 Product Image Event:', JSON.stringify(event.data, null, 2));
        }
      }

      console.log('\n📊 Total events:', events.length);
      console.log('Event types:', events.map(e => e.type));

      // Find the show_product_image action
      const productImageAction = events.find(
        e => e.type === 'action' && e.data.type === 'show_product_image'
      );

      // TEST 1: Action event should exist
      expect(productImageAction).toBeTruthy();
      
      if (productImageAction) {
        console.log('\n✅ Product Image Action Found:', productImageAction.data);
        
        // TEST 2: Should have payload with imageUrl
        expect(productImageAction.data.payload).toBeDefined();
        expect(productImageAction.data.payload.imageUrl).toBeDefined();
        
        // TEST 3: imageUrl should be the mockup URL
        expect(productImageAction.data.payload.imageUrl).toBe('https://test-mockup-url.com/mockup.png');
        
        // TEST 4: Should have productName and companyName
        expect(productImageAction.data.payload.productName).toBeDefined();
        expect(productImageAction.data.payload.companyName).toBe('monoya');
      } else {
        console.log('\n❌ No product image action found!');
        console.log('All action events:', events.filter(e => e.type === 'action'));
      }
    });
  });

  describe('Test 2: Check message order', () => {
    it('should send loading message, then action, then complete message', async () => {
      const events: any[] = [];
      const tokens: string[] = [];
      
      const stream = agentService.processMessage(
        'test-session-002',
        '🎨 Generate mockup',
        {
          selectedTransition: 'to_generate_mockup',
          brandingConfirmed: true,
          brandingInfo: {
            companyName: 'monoya',
            logos: [{ url: 'https://monoya.com/logo.png' }],
            colors: ['#000000'],
          }
        }
      );

      for await (const event of stream) {
        events.push(event);
        if (event.type === 'token') {
          tokens.push(event.data.text);
        }
      }

      const fullMessage = tokens.join('');
      console.log('\n📝 Full message:', fullMessage);
      
      // Should have both loading and success messages
      expect(fullMessage).toContain('Creating'); // Loading message
      expect(fullMessage).toContain('Here\'s your'); // Success message
      
      // Should have the action event
      const actionEvents = events.filter(e => e.type === 'action');
      expect(actionEvents.length).toBeGreaterThan(0);
    });
  });

  describe('Test 3: Check context updates', () => {
    it('should update recommendedProducts with generatedImageUrl', async () => {
      const events: any[] = [];
      
      const stream = agentService.processMessage(
        'test-session-003',
        '🎨 Generate mockup',
        {
          selectedTransition: 'to_generate_mockup',
          brandingConfirmed: true,
        }
      );

      for await (const event of stream) {
        events.push(event);
      }

      // Find context_update events
      const contextUpdates = events.filter(e => e.type === 'context_update');
      console.log('\n🔄 Context updates:', contextUpdates.length);
      
      // Should have updates for branding and products
      expect(contextUpdates.length).toBeGreaterThan(0);
      
      // Check if recommendedProducts is updated
      const productUpdate = contextUpdates.find(e => e.data.recommendedProducts);
      if (productUpdate) {
        console.log('✅ Product context update found');
        expect(productUpdate.data.recommendedProducts[0].generatedImageUrl).toBeDefined();
      }
    });
  });
});

