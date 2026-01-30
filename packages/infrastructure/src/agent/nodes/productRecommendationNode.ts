import { AIMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { Product } from '@repo/domain';
import { AgentState, AgentDependencies, StateTransition } from '../types.js';
import { withTimeout, withRetry } from '../utils/timeout.js';

const PRODUCT_RECOMMENDATION_TIMEOUT_MS = 15000; // 15 seconds

export async function productRecommendationNode(
  state: AgentState,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
  const dependencies = config?.configurable as AgentDependencies;
  
  if (!dependencies?.recommendProductsUseCase) {
    console.error('RecommendProductsUseCase not injected');
    const message = new AIMessage({
      content: "I'm having technical difficulties accessing the product catalog. Please try again or contact support.",
    });
    return {
      messages: [...state.messages, message],
      executionHistory: [...(state.executionHistory || []), 'recommendProducts'],
      lastNodeVisited: 'recommendProducts',
      needsEscalation: true,
    };
  }

  try {
    // 🚀 AUTO-CREATE DEFAULT BRANDING if missing (for force navigation)
    let brandingInfo = state.brandingInfo;
    if (!brandingInfo) {
      console.log('[recommendProducts] No branding info found, creating default...');
      brandingInfo = {
        id: 'default-branding',
        companyName: 'Your Company',
        logos: [{
          url: 'https://via.placeholder.com/200x200.png?text=Logo',
          type: 'primary'
        }],
        colors: ['#6366f1', '#8b5cf6'],
      };
    }
    
    // Use retry logic for product recommendations (database might be temporarily unavailable)
    const products: Product[] = await withRetry(
      () => withTimeout(
        dependencies.recommendProductsUseCase.execute({
          sessionId: state.sessionId,
          intent: (state.currentIntent === 'idle' || state.currentIntent === 'track_order') ? 'general' : state.currentIntent,
          brandingId: brandingInfo?.id,
          limit: 12,
        }),
        PRODUCT_RECOMMENDATION_TIMEOUT_MS,
        'Product recommendation'
      ),
      {
        maxRetries: 2,
        initialDelayMs: 500,
      }
    );

    if (!products || products.length === 0) {
      const message = new AIMessage({
        content: "I couldn't find any products matching your criteria right now. Could you tell me more about what you're looking for? For example, what type of product interests you?",
      });
      return {
        messages: [...state.messages, message],
        executionHistory: [...(state.executionHistory || []), 'recommendProducts'],
        lastNodeVisited: 'recommendProducts',
      };
    }

    const message = new AIMessage({
      content: `Here are ${products.length} products that would look great with your brand! 

Check them out below - you can filter by category, price, or quantity. Each product shows the starting price and minimum order quantity.`,
      additional_kwargs: {
        actionType: 'show_products',
        actionData: products.map(p => p.toJSON()),
      },
    });

    const transitions: StateTransition[] = [
      {
        id: 'to_mockup',
        label: '🎨 Create Mockup',
        description: 'Visualize product with your logo',
        targetNode: 'generateMockup',
        trigger: 'mockup_request',
      },
      {
        id: 'to_conversation',
        label: '💬 Ask Questions',
        description: 'Ask about products or customization',
        targetNode: 'conversation',
      },
    ];

    return {
      messages: [...state.messages, message],
      recommendedProducts: products.map(p => p.toJSON()),
      brandingInfo: brandingInfo,  // Save branding info (default or existing)
      brandingConfirmed: true,  // Auto-confirm for force navigation
      executionHistory: [...(state.executionHistory || []), 'recommendProducts'],
      lastNodeVisited: 'recommendProducts',
      availableTransitions: transitions,
      selectedTransition: undefined,  // Clear after use
    };
  } catch (error: any) {
    console.error('Product recommendation error:', error);
    
    let errorMessage = "I'm having trouble finding products right now.";
    
    if (error.name === 'TimeoutError') {
      errorMessage = "The product search is taking longer than expected. Let me try a different approach.";
    }
    
    const message = new AIMessage({
      content: `${errorMessage} What type of product are you interested in? (e.g., apparel, drinkware, tech accessories)`,
    });
    
    return {
      messages: [...state.messages, message],
      executionHistory: [...(state.executionHistory || []), 'recommendProducts'],
      lastNodeVisited: 'recommendProducts',
      selectedTransition: undefined,  // Clear after use
    };
  }
}

