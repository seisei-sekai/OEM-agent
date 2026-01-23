import { RunnableConfig } from '@langchain/core/runnables';
import { AgentState, StateTransition } from '../types.js';
import { OpenAI } from 'openai';
import { withTimeout } from '../utils/timeout.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const INTENT_CLASSIFICATION_TIMEOUT_MS = 10000; // 10 seconds

export async function intentClassificationNode(
  state: AgentState,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
  // 🔍 DEBUG: Log incoming state
  console.log('[IntentClassificationNode] Incoming state:', {
    selectedTransition: state.selectedTransition,
    brandingConfirmed: state.brandingConfirmed,
    hasBrandingInfo: !!state.brandingInfo,
    hasProducts: !!state.recommendedProducts,
  });

  const lastMessage = state.messages[state.messages.length - 1];
  
  if (!lastMessage || lastMessage.content === '') {
    return { 
      currentIntent: 'general',
      executionHistory: [...(state.executionHistory || []), 'classifyIntent'],
      lastNodeVisited: 'classifyIntent',
    };
  }

  const userMessage = typeof lastMessage.content === 'string' 
    ? lastMessage.content 
    : '';

  try {
    // Use OpenAI to classify intent with timeout
    const completion = await withTimeout(
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Classify the user's intent into one of: branded_merch, custom, general, track_order.
- branded_merch: User wants products with their logo/branding
- custom: User wants fully custom manufactured products
- general: General questions or browsing
- track_order: User wants to track an order

Respond with ONLY the intent name, nothing else.`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0,
        max_tokens: 20,
      }),
      INTENT_CLASSIFICATION_TIMEOUT_MS,
      'Intent classification'
    );

    const intent = completion.choices[0]?.message?.content?.trim().toLowerCase() || 'general';
    
    // Validate intent
    const validIntents = ['branded_merch', 'custom', 'general', 'track_order'];
    const classifiedIntent = validIntents.includes(intent) 
      ? intent as AgentState['currentIntent']
      : 'general';

    const transitions = buildTransitions(state, classifiedIntent);

    return {
      currentIntent: classifiedIntent,
      executionHistory: [...(state.executionHistory || []), 'classifyIntent'],
      lastNodeVisited: 'classifyIntent',
      availableTransitions: transitions,
      selectedTransition: undefined,  // Clear after use
    };
  } catch (error) {
    console.error('Intent classification error:', error);
    
    // Fallback: Use keyword matching
    const contentLower = userMessage.toLowerCase();
    let fallbackIntent: AgentState['currentIntent'] = 'general';
    
    if (contentLower.includes('logo') || contentLower.includes('brand') || contentLower.includes('website')) {
      fallbackIntent = 'branded_merch';
    } else if (contentLower.includes('custom') || contentLower.includes('manufacture')) {
      fallbackIntent = 'custom';
    } else if (contentLower.includes('track') || contentLower.includes('order') || contentLower.includes('shipping')) {
      fallbackIntent = 'track_order';
    }

    const transitions = buildTransitions(state, fallbackIntent);

    return {
      currentIntent: fallbackIntent,
      executionHistory: [...(state.executionHistory || []), 'classifyIntent'],
      lastNodeVisited: 'classifyIntent',
      availableTransitions: transitions,
      selectedTransition: undefined,  // Clear after use
    };
  }
}

function buildTransitions(state: AgentState, intent: AgentState['currentIntent']): StateTransition[] {
  const transitions: StateTransition[] = [];
  
  console.log('[intentClassificationNode] Building transitions:', {
    hasBrandingInfo: !!state.brandingInfo,
    brandingConfirmed: state.brandingConfirmed,
    hasProducts: !!state.recommendedProducts,
    recommendedProductsLength: state.recommendedProducts?.length || 0,
  });
  
  // PRIORITY: If branding exists, ALWAYS show products option (most important for user flow)
  if (state.brandingInfo) {
    transitions.push({
      id: 'to_recommend_products',
      label: '🎯 Show Products',
      description: 'Browse products for your branding',
      targetNode: 'recommendProducts',
    });
  }
  
  // If no branding info, offer branding extraction
  if (!state.brandingInfo) {
    transitions.push({
      id: 'to_extract_branding',
      label: '🎨 Upload Branding',
      description: 'Extract logo and colors from website',
      targetNode: 'extractBranding',
      trigger: 'url_pattern',
    });
  }
  
  // If branding AND products exist, offer mockup generation
  if (state.brandingInfo && state.recommendedProducts && state.recommendedProducts.length > 0) {
    transitions.push({
      id: 'to_generate_mockup',
      label: '✨ Generate Mockup',
      description: 'Create product mockup with your logo',
      targetNode: 'generateMockup',
    });
  }
  
  // Always allow conversation as fallback (moved to end so it's last)
  transitions.push({
    id: 'to_conversation',
    label: '💬 Chat',
    description: 'General conversation',
    targetNode: 'conversation',
  });
  
  return transitions;
}

