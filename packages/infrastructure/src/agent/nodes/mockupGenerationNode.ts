import { AIMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { MockupResult } from '@repo/application';
import { AgentState, AgentDependencies, StateTransition } from '../types.js';
import { withTimeout } from '../utils/timeout.js';

const MOCKUP_GENERATION_TIMEOUT_MS = 45000; // 45 seconds (DALL-E can be slow)

export async function mockupGenerationNode(
  state: AgentState,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
  const dependencies = config?.configurable as AgentDependencies;
  
  if (!dependencies?.generateMockupUseCase) {
    console.error('GenerateMockupUseCase not injected');
    return {
      executionHistory: [...(state.executionHistory || []), 'generateMockup'],
      lastNodeVisited: 'generateMockup',
    };
  }

  // 🚀 AUTO-CREATE DEFAULT BRANDING if missing (for force navigation)
  let brandingInfo = state.brandingInfo;
  if (!brandingInfo) {
    console.log('[mockupGenerationNode] No branding info found, creating default...');
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

  // 🚀 AUTO-CREATE DEFAULT PRODUCT if missing (for force navigation)
  let products = state.recommendedProducts || [];
  if (!products || products.length === 0) {
    console.log('[mockupGenerationNode] No products found, creating default...');
    products = [{
      id: 'default-product',
      name: 'Coffee Mug',
      category: 'drinkware',
      basePrice: 15.99,
      minQuantity: 50,
      description: 'Premium ceramic coffee mug',
      imageUrl: 'https://via.placeholder.com/400x400.png?text=Coffee+Mug',
    }];
  }

  try {
    const product = products[0];
    const logoUrl = brandingInfo.logos?.[0]?.url || '';
    
    const loadingMessage = new AIMessage({
      content: `Creating a product image with your ${brandingInfo.companyName || 'brand'} logo on ${product.name}... ✨`,
    });

    const result: MockupResult = await withTimeout(
      dependencies.generateMockupUseCase.execute({
        productId: product.id || product.name,
        logo: logoUrl,
        logoUrl: logoUrl,
        productName: product.name,
        companyName: brandingInfo.companyName,
        placement: 'center',
      }),
      MOCKUP_GENERATION_TIMEOUT_MS,
      'Product image generation'
    );
    
    const imageMessage = new AIMessage({
      content: `Here's your ${product.name} with your ${brandingInfo.companyName || 'brand'} logo! 🎨`,
      additional_kwargs: {
        actionType: 'show_product_image',
        actionData: {
          imageUrl: result.mockupUrl,
          productName: product.name,
          companyName: brandingInfo.companyName,
        }
      }
    });

    const transitions: StateTransition[] = [
      {
        id: 'generate_another',
        label: '🔄 Try Another Product',
        description: 'Generate mockup for a different product',
        targetNode: 'generateMockup',
      },
      {
        id: 'back_to_products',
        label: '📦 View All Products',
        description: 'Return to product recommendations',
        targetNode: 'recommendProducts',
      },
      {
        id: 'to_conversation',
        label: '💬 Continue Chat',
        description: 'Ask questions or explore more',
        targetNode: 'conversation',
      },
    ];

    return {
      messages: [...state.messages, loadingMessage, imageMessage],
      recommendedProducts: products.map((p: any, idx: number) => 
        idx === 0 ? { ...p, generatedImageUrl: result.mockupUrl } : p
      ),
      brandingInfo: brandingInfo,  // Save branding info (default or existing)
      brandingConfirmed: true,  // Auto-confirm for force navigation
      executionHistory: [...(state.executionHistory || []), 'generateMockup'],
      lastNodeVisited: 'generateMockup',
      availableTransitions: transitions,
      selectedTransition: undefined,  // Clear after use
    };
  } catch (error) {
    console.error('Product image generation error:', error);
    
    const errorMessage = new AIMessage({
      content: "I couldn't generate the product image right now. Let me show you the products from our catalog instead.",
    });
    
    return {
      messages: [...state.messages, errorMessage],
      executionHistory: [...(state.executionHistory || []), 'generateMockup'],
      lastNodeVisited: 'generateMockup',
      selectedTransition: undefined,  // Clear after use
    };
  }
}

