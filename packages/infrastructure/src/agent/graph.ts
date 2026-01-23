import { StateGraph, START, END } from '@langchain/langgraph';
import { AgentState, StateTransition } from './types.js';
import {
  welcomeNode,
  intentClassificationNode,
  brandingExtractionNode,
  productRecommendationNode,
  conversationNode,
  mockupGenerationNode,
} from './nodes/index.js';
import { RunnableConfig } from '@langchain/core/runnables';

// Initial router node that decides whether to show welcome
async function initialRouterNode(
  state: AgentState,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
  // 🔍 DEBUG: Log incoming state
  console.log('[InitialRouterNode] Incoming state:', {
    selectedTransition: state.selectedTransition,
    isFirstMessage: state.isFirstMessage,
    brandingConfirmed: state.brandingConfirmed,
  });

  const transitions: StateTransition[] = [
    {
      id: 'to_welcome',
      label: 'Show Welcome',
      description: 'Start with welcome message',
      targetNode: 'welcome',
      trigger: '__first_message__',
    },
    {
      id: 'to_classify',
      label: 'Classify Intent',
      description: 'Skip welcome and classify user intent',
      targetNode: 'classifyIntent',
      trigger: '__subsequent_message__',
    },
  ];
  
  const result = {
    executionHistory: [...(state.executionHistory || []), 'initialRouter'],
    turnCount: (state.turnCount || 0) + 1,
    lastNodeVisited: 'initialRouter',
    availableTransitions: transitions,
    // 🔑 CRITICAL: Preserve selectedTransition for routing!
    selectedTransition: state.selectedTransition,
  };

  console.log('[InitialRouterNode] Returning state:', {
    selectedTransition: result.selectedTransition,
  });

  return result;
}

// Routing functions
function routeInitial(state: AgentState): string {
  console.log('[RouteInitial] Called with state:', {
    selectedTransition: state.selectedTransition,
    isFirstMessage: state.isFirstMessage,
    hasAvailableTransitions: !!state.availableTransitions?.length,
  });

  // HIGHEST PRIORITY: Check if user selected a specific FORCE transition
  // These should bypass classifyIntent entirely
  if (state.selectedTransition) {
    console.log('[RouteInitial] 🎯 DETECTED selectedTransition:', state.selectedTransition);
    
    // Handle direct force transitions (bypass classifyIntent)
    if (state.selectedTransition === 'to_recommend_products_force' || 
        state.selectedTransition === 'to_recommend_products') {
      console.log('[RouteInitial] ⚡ FORCE ROUTING → recommendProducts');
      return 'recommendProducts';
    }
    
    if (state.selectedTransition === 'to_generate_mockup_force' ||
        state.selectedTransition === 'to_generate_mockup' ||
        state.selectedTransition === 'to_mockup') {
      console.log('[RouteInitial] ⚡ FORCE ROUTING → generateMockup');
      return 'generateMockup';
    }
    
    // For other transitions, check if they're in availableTransitions
    const transition = state.availableTransitions?.find(t => t.id === state.selectedTransition);
    if (transition && transition.targetNode !== 'classifyIntent') {
      console.log('[RouteInitial] ⚡ ROUTING to:', transition.targetNode);
      return transition.targetNode;
    }
  }
  
  // Skip welcome for subsequent messages
  if (state.isFirstMessage === false) {
    console.log('[RouteInitial] → classifyIntent (subsequent message)');
    return 'classifyIntent';
  }
  console.log('[RouteInitial] → welcome (first message)');
  return 'welcome';
}

function routeByIntent(state: AgentState): string {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = typeof lastMessage.content === 'string' ? lastMessage.content : '';
  const contentLower = content.toLowerCase();

  // HIGHEST PRIORITY: Check if user selected a specific transition
  // This overrides ALL automatic routing logic
  if (state.selectedTransition) {
    console.log('[Graph Routing] 🎯 FORCED TRANSITION:', state.selectedTransition);
    
    // Handle known transitions directly
    if (state.selectedTransition === 'confirm_branding') {
      console.log('[Graph Routing] ✅ Confirmed branding → Routing to recommendProducts');
      return 'recommendProducts';
    }
    
    if (state.selectedTransition === 'to_mockup' || state.selectedTransition === 'to_generate_mockup') {
      console.log('[Graph Routing] ✅ Generate mockup → Routing to generateMockup');
      return 'generateMockup';
    }
    
    if (state.selectedTransition === 'to_recommend_products') {
      console.log('[Graph Routing] ✅ Show products → Routing to recommendProducts');
      return 'recommendProducts';
    }
    
    // Fallback: try to find in availableTransitions
    const transition = state.availableTransitions?.find(t => t.id === state.selectedTransition);
    if (transition) {
      console.log('[Graph Routing] ✅ Found transition:', transition.id, '→', transition.targetNode);
      return transition.targetNode;
    }
  }

  // 🔥 CONTENT-BASED FALLBACK: If message contains [FORCE], route directly
  if (content.includes('[FORCE]')) {
    if (contentLower.includes('mockup') || contentLower.includes('generate')) {
      console.log('[Graph Routing] 🚀 FORCE CONTENT DETECTED → generateMockup');
      return 'generateMockup';
    }
    if (contentLower.includes('product') || contentLower.includes('recommend')) {
      console.log('[Graph Routing] 🚀 FORCE CONTENT DETECTED → recommendProducts');
      return 'recommendProducts';
    }
  }
  
  // Prevent infinite loops - max 10 nodes per turn
  if ((state.executionHistory || []).length > 10) {
    console.warn('Max execution history reached, ending conversation turn');
    return 'conversation'; // Fallback to safe conversation node
  }
  
  // Debug logging
  console.log('[Graph Routing] Automatic routing check:', {
    hasBrandingInfo: !!state.brandingInfo,
    brandingConfirmed: state.brandingConfirmed,
    hasProducts: !!state.recommendedProducts,
    currentIntent: state.currentIntent,
    lastMessage: content.substring(0, 50),
    selectedTransition: state.selectedTransition,
  });
  
  // Check for URL pattern (branding flow) - only if not already extracted
  if (content.match(/(https?:\/\/[^\s]+)/) && !state.brandingInfo) {
    return 'extractBranding';
  }
  
  // PRIORITY 1: Check if branding confirmed via context AND branding exists
  if (state.brandingInfo && state.brandingConfirmed === true && !state.recommendedProducts) {
    console.log('[Graph Routing] ✅ Branding confirmed via context, routing to recommendProducts');
    return 'recommendProducts';
  }
  
  // PRIORITY 2: Check if user is confirming branding via message content
  if (state.brandingInfo && !state.recommendedProducts) {
    const isConfirming = contentLower.includes('yes') || 
                        contentLower.includes('confirm') || 
                        contentLower.includes('use this') ||
                        contentLower.includes('use it') ||
                        contentLower.includes('proceed') ||
                        contentLower.includes('continue');
    
    if (isConfirming) {
      console.log('[Graph Routing] ✅ User confirmed branding via message, routing to recommendProducts');
      return 'recommendProducts';
    }
  }
  
  // PRIORITY 3: Check if user wants to request mockup/product image
  if (state.brandingInfo && state.recommendedProducts && 
      (contentLower.includes('show') || contentLower.includes('image') || 
       contentLower.includes('photo') || contentLower.includes('mockup') ||
       contentLower.includes('t-shirt') || contentLower.includes('mug') || 
       contentLower.includes('hoodie') || contentLower.includes('cup'))) {
    console.log('[Graph Routing] ✅ User requesting product visualization, routing to generateMockup');
    return 'generateMockup';
  }
  
  // Default to conversation
  console.log('[Graph Routing] ⚠️ No specific route matched, defaulting to conversation');
  return 'conversation';
}

function shouldEnd(state: AgentState): string {
  // Always end after conversation or product recommendation
  return END;
}

// Build the state graph
export function createAgentGraph(): any {
  const workflow = new StateGraph<AgentState>({
    channels: {
      messages: {
        value: (a: any, b: any) => a.concat(b),
        default: () => [],
      },
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
      brandingInfo: {
        value: (x: any, y: any) => y !== null && y !== undefined ? y : x, // Persist across turns
        default: () => null,
      },
      recommendedProducts: {
        value: (x: any, y: any) => y !== null && y !== undefined ? y : x, // Persist across turns
        default: () => undefined,
      },
      context: {
        value: null,
        default: () => ({}),
      },
      needsEscalation: {
        value: null,
        default: () => false,
      },
      isFirstMessage: {
        value: null,
        default: () => true,
      },
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
      brandingConfirmed: {
        value: (x: any, y: any) => y !== null && y !== undefined ? y : x, // Persist across turns
        default: () => false,
      },
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
    },
  });

  // Add nodes
  workflow.addNode('initialRouter', initialRouterNode);
  workflow.addNode('welcome', welcomeNode);
  workflow.addNode('classifyIntent', intentClassificationNode);
  workflow.addNode('extractBranding', brandingExtractionNode);
  workflow.addNode('recommendProducts', productRecommendationNode);
  workflow.addNode('generateMockup', mockupGenerationNode);
  workflow.addNode('conversation', conversationNode);

  // Define edges
  // Start with router that decides whether to show welcome
  workflow.setEntryPoint('initialRouter');
  
  workflow.addConditionalEdges(
    'initialRouter',
    routeInitial,
    {
      'welcome': 'welcome',
      'classifyIntent': 'classifyIntent',
      'recommendProducts': 'recommendProducts', // 🔑 添加直接跳转路径
      'generateMockup': 'generateMockup',       // 🔑 添加直接跳转路径
    }
  );
  
  workflow.addEdge('welcome', 'classifyIntent');
  
  workflow.addConditionalEdges(
    'classifyIntent',
    routeByIntent,
    {
      'extractBranding': 'extractBranding',
      'recommendProducts': 'recommendProducts',
      'generateMockup': 'generateMockup',
      'conversation': 'conversation',
    }
  );
  
  // After branding extraction, end turn and wait for user confirmation
  workflow.addConditionalEdges('extractBranding', shouldEnd);
  
  // After product recommendations, end turn
  workflow.addConditionalEdges('recommendProducts', shouldEnd);
  
  // After mockup generation, end turn
  workflow.addConditionalEdges('generateMockup', shouldEnd);
  
  // After conversation, end turn
  workflow.addConditionalEdges('conversation', shouldEnd);

  return workflow.compile();
}

export const agentGraph: any = createAgentGraph();

