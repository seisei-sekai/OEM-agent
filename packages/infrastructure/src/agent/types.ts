import { BaseMessage } from '@langchain/core/messages';
import { IExtractBrandingUseCase, IRecommendProductsUseCase, IGenerateMockupUseCase } from '@repo/application';

export interface StateTransition {
  id: string;
  label: string;
  description: string;
  targetNode: string;
  trigger?: string; // Optional trigger keyword for automatic routing
}

export interface AgentState {
  messages: BaseMessage[];
  sessionId: string;
  userId?: string;
  currentIntent: 'branded_merch' | 'custom' | 'general' | 'track_order' | 'idle';
  brandingInfo?: any;
  recommendedProducts?: any[];
  context: {
    pageUrl?: string;
    pageType?: string;
    viewedProducts?: string[];
    cartItems?: string[];
  };
  needsEscalation: boolean;
  isFirstMessage?: boolean;
  
  // Loop prevention
  executionHistory: string[];
  turnCount: number;
  lastNodeVisited?: string;
  brandingConfirmed?: boolean;
  
  // Available transitions for current state
  availableTransitions?: StateTransition[];
  selectedTransition?: string; // User-selected transition ID
}

export interface AgentDependencies {
  extractBrandingUseCase: IExtractBrandingUseCase;
  recommendProductsUseCase: IRecommendProductsUseCase;
  generateMockupUseCase: IGenerateMockupUseCase;
}

