import { AIMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { AgentState, StateTransition } from '../types.js';
import { OpenAI } from 'openai';
import { withTimeout } from '../utils/timeout.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const CONVERSATION_TIMEOUT_MS = 30000; // 30 seconds

export async function conversationNode(
  state: AgentState,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
  // Validate input
  if (!state.messages || state.messages.length === 0) {
    return {
      messages: [new AIMessage({ content: "I'm here to help! What would you like to know?" })],
      executionHistory: [...(state.executionHistory || []), 'conversation'],
      lastNodeVisited: 'conversation',
      selectedTransition: undefined,  // Clear after use
    };
  }

  const lastMessage = state.messages[state.messages.length - 1];
  const userMessage = typeof lastMessage.content === 'string' ? lastMessage.content : '';

  // Build context from state
  const contextParts = [];
  if (state.brandingInfo) {
    contextParts.push(`User has uploaded branding for: ${state.brandingInfo.companyName || 'their company'}`);
  }
  if (state.recommendedProducts?.length) {
    contextParts.push(`User is viewing ${state.recommendedProducts.length} product recommendations`);
  }
  if (state.context.pageType) {
    contextParts.push(`User is on ${state.context.pageType} page`);
  }

  const systemContext = contextParts.length > 0
    ? `\n\nCurrent context:\n${contextParts.join('\n')}`
    : '';

  try {
    // Generate response using OpenAI with timeout protection
    const completion = await withTimeout(
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI shopping assistant for an OEM/manufacturing platform. You help users find and customize products with their branding.

Keep responses concise and friendly. Offer specific suggestions. Use emojis sparingly.${systemContext}`
          },
          ...state.messages.slice(-5).map(m => ({
            role: m._getType() === 'ai' ? 'assistant' as const : 'user' as const,
            content: typeof m.content === 'string' ? m.content : '',
          })),
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
      CONVERSATION_TIMEOUT_MS,
      'OpenAI conversation generation'
    );

    const responseMessage = new AIMessage({
      content: completion.choices[0]?.message?.content || "I'm here to help! What would you like to know?",
    });

    const transitions = buildConversationTransitions(state);

    return {
      messages: [responseMessage],
      executionHistory: [...(state.executionHistory || []), 'conversation'],
      lastNodeVisited: 'conversation',
      availableTransitions: transitions,
      selectedTransition: undefined,  // Clear after use
    };
  } catch (error) {
    console.error('Conversation node error:', error);
    
    // Graceful fallback
    const errorMessage = new AIMessage({
      content: "I'm having trouble processing that right now. Could you please try rephrasing your question?",
    });

    const transitions = buildConversationTransitions(state);

    return {
      messages: [errorMessage],
      executionHistory: [...(state.executionHistory || []), 'conversation'],
      lastNodeVisited: 'conversation',
      needsEscalation: true,
      availableTransitions: transitions,
      selectedTransition: undefined,  // Clear after use
    };
  }
}

function buildConversationTransitions(state: AgentState): StateTransition[] {
  const transitions: StateTransition[] = [];
  
  // If no branding, offer extraction
  if (!state.brandingInfo) {
    transitions.push({
      id: 'start_branding',
      label: '🎨 Upload Branding',
      description: 'Share your logo or website',
      targetNode: 'extractBranding',
    });
  }
  
  // If branding exists but not confirmed, allow confirmation
  if (state.brandingInfo && !state.brandingConfirmed) {
    transitions.push({
      id: 'confirm_branding',
      label: '✅ Confirm Branding',
      description: 'Use this branding for products',
      targetNode: 'recommendProducts',
    });
  }
  
  // If branding confirmed but no products
  if (state.brandingInfo && state.brandingConfirmed && !state.recommendedProducts) {
    transitions.push({
      id: 'show_products',
      label: '📦 Show Products',
      description: 'Browse product recommendations',
      targetNode: 'recommendProducts',
    });
  }
  
  // If products exist
  if (state.recommendedProducts && state.recommendedProducts.length > 0) {
    transitions.push({
      id: 'create_mockup',
      label: '🎨 Create Mockup',
      description: 'Visualize product with your logo',
      targetNode: 'generateMockup',
    });
  }
  
  // Always keep conversation as option
  transitions.push({
    id: 'continue_chat',
    label: '💬 Keep Chatting',
    description: 'Ask more questions',
    targetNode: 'conversation',
  });
  
  return transitions;
}

