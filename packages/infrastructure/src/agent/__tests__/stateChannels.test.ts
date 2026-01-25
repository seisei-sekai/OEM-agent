import { describe, it, expect } from 'vitest';
import { stateChannels } from '../stateChannels.js';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

describe('State Channels Configuration', () => {
  describe('messages channel', () => {
    it('should concatenate messages', () => {
      const existing = [new HumanMessage({ content: 'Hello' })];
      const incoming = [new AIMessage({ content: 'Hi' })];
      
      const result = stateChannels.messages.value(existing, incoming);
      
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Hello');
      expect(result[1].content).toBe('Hi');
    });

    it('should have empty array as default', () => {
      const result = stateChannels.messages.default();
      expect(result).toEqual([]);
    });
  });

  describe('sessionId channel', () => {
    it('should have empty string as default', () => {
      const result = stateChannels.sessionId.default();
      expect(result).toBe('');
    });
  });

  describe('currentIntent channel', () => {
    it('should have idle as default', () => {
      const result = stateChannels.currentIntent.default();
      expect(result).toBe('idle');
    });
  });

  describe('brandingInfo channel (persistence)', () => {
    it('should persist existing value when incoming is null', () => {
      const existing = { companyName: 'Test', logos: [], colors: [] };
      const incoming = null;
      
      const result = stateChannels.brandingInfo.value(existing, incoming);
      
      expect(result).toEqual(existing);
    });

    it('should persist existing value when incoming is undefined', () => {
      const existing = { companyName: 'Test', logos: [], colors: [] };
      const incoming = undefined;
      
      const result = stateChannels.brandingInfo.value(existing, incoming);
      
      expect(result).toEqual(existing);
    });

    it('should update when incoming has value', () => {
      const existing = { companyName: 'Old', logos: [], colors: [] };
      const incoming = { companyName: 'New', logos: [], colors: ['#000'] };
      
      const result = stateChannels.brandingInfo.value(existing, incoming);
      
      expect(result).toEqual(incoming);
    });

    it('should have null as default', () => {
      const result = stateChannels.brandingInfo.default();
      expect(result).toBeNull();
    });
  });

  describe('recommendedProducts channel (persistence)', () => {
    it('should persist existing value when incoming is null', () => {
      const existing = [{ id: '1', name: 'Product' }];
      const incoming = null;
      
      const result = stateChannels.recommendedProducts.value(existing, incoming);
      
      expect(result).toEqual(existing);
    });

    it('should update when incoming has value', () => {
      const existing = [{ id: '1', name: 'Old' }];
      const incoming = [{ id: '2', name: 'New' }];
      
      const result = stateChannels.recommendedProducts.value(existing, incoming);
      
      expect(result).toEqual(incoming);
    });

    it('should have undefined as default', () => {
      const result = stateChannels.recommendedProducts.default();
      expect(result).toBeUndefined();
    });
  });

  describe('brandingConfirmed channel (persistence)', () => {
    it('should persist existing value when incoming is null', () => {
      const existing = true;
      const incoming = null;
      
      const result = stateChannels.brandingConfirmed.value(existing, incoming);
      
      expect(result).toBe(true);
    });

    it('should update when incoming has value', () => {
      const existing = false;
      const incoming = true;
      
      const result = stateChannels.brandingConfirmed.value(existing, incoming);
      
      expect(result).toBe(true);
    });

    it('should have false as default', () => {
      const result = stateChannels.brandingConfirmed.default();
      expect(result).toBe(false);
    });
  });

  describe('context channel', () => {
    it('should have empty object as default', () => {
      const result = stateChannels.context.default();
      expect(result).toEqual({});
    });
  });

  describe('needsEscalation channel', () => {
    it('should have false as default', () => {
      const result = stateChannels.needsEscalation.default();
      expect(result).toBe(false);
    });
  });

  describe('isFirstMessage channel', () => {
    it('should have true as default', () => {
      const result = stateChannels.isFirstMessage.default();
      expect(result).toBe(true);
    });
  });

  describe('executionHistory channel', () => {
    it('should concatenate history entries', () => {
      const existing = ['node1', 'node2'];
      const incoming = ['node3'];
      
      const result = stateChannels.executionHistory.value(existing, incoming);
      
      expect(result).toEqual(['node1', 'node2', 'node3']);
    });

    it('should have empty array as default', () => {
      const result = stateChannels.executionHistory.default();
      expect(result).toEqual([]);
    });
  });

  describe('turnCount channel', () => {
    it('should have 0 as default', () => {
      const result = stateChannels.turnCount.default();
      expect(result).toBe(0);
    });
  });

  describe('availableTransitions channel', () => {
    it('should persist existing value when incoming is null', () => {
      const existing = [{ id: 'test', label: 'Test', description: 'Test', targetNode: 'test' }];
      const incoming = null;
      
      const result = stateChannels.availableTransitions.value(existing, incoming);
      
      expect(result).toEqual(existing);
    });

    it('should have empty array as default', () => {
      const result = stateChannels.availableTransitions.default();
      expect(result).toEqual([]);
    });
  });

  describe('selectedTransition channel', () => {
    it('should clear when incoming is undefined', () => {
      const existing = 'some_transition';
      const incoming = undefined;
      
      const result = stateChannels.selectedTransition.value(existing, incoming);
      
      expect(result).toBeUndefined();
    });

    it('should update when incoming has value', () => {
      const existing = 'old_transition';
      const incoming = 'new_transition';
      
      const result = stateChannels.selectedTransition.value(existing, incoming);
      
      expect(result).toBe('new_transition');
    });

    it('should persist when incoming is null', () => {
      const existing = 'some_transition';
      const incoming = null;
      
      const result = stateChannels.selectedTransition.value(existing, incoming);
      
      expect(result).toBe('some_transition');
    });

    it('should have undefined as default', () => {
      const result = stateChannels.selectedTransition.default();
      expect(result).toBeUndefined();
    });
  });

  describe('Channel consistency', () => {
    it('should have all required channels defined', () => {
      const requiredChannels = [
        'messages',
        'sessionId',
        'userId',
        'currentIntent',
        'brandingInfo',
        'recommendedProducts',
        'context',
        'needsEscalation',
        'isFirstMessage',
        'executionHistory',
        'turnCount',
        'lastNodeVisited',
        'brandingConfirmed',
        'availableTransitions',
        'selectedTransition',
      ];

      requiredChannels.forEach(channel => {
        expect(stateChannels).toHaveProperty(channel);
      });
    });

    it('should have default functions for appropriate channels', () => {
      const channelsWithDefaults = [
        'messages',
        'sessionId',
        'currentIntent',
        'brandingInfo',
        'recommendedProducts',
        'context',
        'needsEscalation',
        'isFirstMessage',
        'executionHistory',
        'turnCount',
        'brandingConfirmed',
        'availableTransitions',
        'selectedTransition',
      ];

      channelsWithDefaults.forEach(channel => {
        expect(stateChannels[channel]).toHaveProperty('default');
        expect(typeof stateChannels[channel].default).toBe('function');
      });
    });
  });
});

