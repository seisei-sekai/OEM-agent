import { AgentState } from './types.js';

/**
 * State channel reducers define how state updates are merged
 * Each channel can have a custom reducer or use the default (last-write-wins)
 */
export const stateChannels = {
  // Append new messages to existing array
  messages: {
    value: (a: any, b: any) => a.concat(b),
    default: () => [],
  },
  
  // Simple scalar values (last-write-wins)
  sessionId: {
    value: null,
    default: () => '',
  },
  userId: {
    value: null,
  },
  currentIntent: {
    value: null,
    default: () => 'idle' as const,
  },
  
  // Persist across turns unless explicitly updated
  brandingInfo: {
    value: (x: any, y: any) => y !== null && y !== undefined ? y : x,
    default: () => null,
  },
  recommendedProducts: {
    value: (x: any, y: any) => y !== null && y !== undefined ? y : x,
    default: () => undefined,
  },
  brandingConfirmed: {
    value: (x: any, y: any) => y !== null && y !== undefined ? y : x,
    default: () => false,
  },
  
  // Context object (last-write-wins)
  context: {
    value: null,
    default: () => ({}),
  },
  
  // Simple booleans
  needsEscalation: {
    value: null,
    default: () => false,
  },
  isFirstMessage: {
    value: null,
    default: () => true,
  },
  
  // Loop prevention - accumulate history
  executionHistory: {
    value: (a: any, b: any) => a.concat(b),
    default: () => [],
  },
  turnCount: {
    value: null,
    default: () => 0,
  },
  lastNodeVisited: {
    value: null,
  },
  
  // Transitions management
  availableTransitions: {
    value: (x: any, y: any) => y !== null && y !== undefined ? y : x,
    default: () => [],
  },
  selectedTransition: {
    value: (x: any, y: any) => {
      // If new value is explicitly undefined, clear it
      // Otherwise, keep the existing value (persist within a turn)
      if (y === undefined) return undefined;
      if (y !== null) return y;
      return x;
    },
    default: () => undefined,
  },
};

