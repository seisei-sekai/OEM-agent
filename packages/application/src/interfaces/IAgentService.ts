export interface AgentMessage {
  role: 'user' | 'agent' | 'system';
  content: string;
}

export interface AgentStreamEvent {
  type: 'token' | 'action' | 'complete' | 'error' | 'context_update' | 'transitions';
  data: any;
}

export interface AgentContext {
  pageUrl?: string;
  pageType?: 'landing' | 'catalog' | 'product' | 'marketplace';
  viewedProducts?: string[];
  cartItems?: string[];
  brandingConfirmed?: boolean;
  brandingInfo?: any;
  recommendedProducts?: any[];
  [key: string]: any; // Allow additional dynamic properties
}

export interface IAgentService {
  chat(
    sessionId: string,
    messages: AgentMessage[],
    context?: AgentContext
  ): Promise<AsyncIterable<AgentStreamEvent>>;
  
  classifyIntent(message: string): Promise<string>;
}


