import { AIMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';
import { AgentState, AgentDependencies, StateTransition } from '../types.js';
import { withTimeout } from '../utils/timeout.js';

const BRANDING_EXTRACTION_TIMEOUT_MS = 20000; // 20 seconds

export async function brandingExtractionNode(
  state: AgentState,
  config?: RunnableConfig
): Promise<Partial<AgentState>> {
  const dependencies = config?.configurable as AgentDependencies;
  
  if (!dependencies?.extractBrandingUseCase) {
    console.error('ExtractBrandingUseCase not injected');
    const message = new AIMessage({
      content: "I'm having technical difficulties. Please try uploading your logo directly or contact support.",
    });
    return {
      messages: [...state.messages, message],
      executionHistory: [...(state.executionHistory || []), 'extractBranding'],
      lastNodeVisited: 'extractBranding',
      needsEscalation: true,
      selectedTransition: undefined,  // Clear after use
    };
  }

  // Extract URL from last message
  const lastMessage = state.messages[state.messages.length - 1];
  const content = typeof lastMessage.content === 'string' ? lastMessage.content : '';
  
  // Enhanced URL regex to catch more cases
  const urlMatch = content.match(/(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|org|net|io|co|ai)[^\s]*)/);
  
  if (!urlMatch) {
    const message = new AIMessage({
      content: "I couldn't find a URL in your message. Please share your website URL (like https://example.com), and I'll extract your branding automatically.",
    });
    return {
      messages: [...state.messages, message],
      executionHistory: [...(state.executionHistory || []), 'extractBranding'],
      lastNodeVisited: 'extractBranding',
      selectedTransition: undefined,  // Clear after use
    };
  }

  let url = urlMatch[1];
  
  // Normalize URL (add https:// if missing)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  try {
    // Wrap branding extraction with timeout
    const branding = await withTimeout(
      dependencies.extractBrandingUseCase.executeFromUrl({
        url,
        sessionId: state.sessionId,
        userId: state.userId,
      }),
      BRANDING_EXTRACTION_TIMEOUT_MS,
      'Branding extraction'
    );

    const message = new AIMessage({
      content: `Great! I've extracted your branding from ${url}. Here's what I found:
      
🎨 Company: ${branding.getCompanyName() || 'Not detected'}
🖼️ Logos found: ${branding.getLogos().length}
🌈 Brand colors: ${branding.getColors().length}

Would you like to use this branding for product recommendations?`,
      additional_kwargs: {
        actionType: 'show_branding',
        actionData: branding.toJSON(),
      },
    });

    const transitions: StateTransition[] = [
      {
        id: 'confirm_branding',
        label: '✅ Confirm & Continue',
        description: 'Use this branding to find products',
        targetNode: 'recommendProducts',
        trigger: 'confirm',
      },
      {
        id: 'retry_branding',
        label: '🔄 Try Different URL',
        description: 'Extract branding from another website',
        targetNode: 'conversation',
      },
    ];

    return {
      messages: [...state.messages, message],
      brandingInfo: branding.toJSON(),
      executionHistory: [...(state.executionHistory || []), 'extractBranding'],
      lastNodeVisited: 'extractBranding',
      availableTransitions: transitions,
      selectedTransition: undefined,  // Clear after use
    };
  } catch (error: any) {
    console.error('Branding extraction error:', error);
    
    // Provide specific error messages
    let errorMessage = "I had trouble extracting branding from that URL.";
    
    if (error.name === 'TimeoutError') {
      errorMessage = "The website is taking too long to respond. Please try a different URL or upload your logo directly.";
    } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
      errorMessage = "I couldn't access that website. Please check the URL or try uploading your logo directly.";
    }
    
    const message = new AIMessage({
      content: `${errorMessage}\n\nWould you like to upload your logo directly instead?`,
    });
    
    return {
      messages: [...state.messages, message],
      executionHistory: [...(state.executionHistory || []), 'extractBranding'],
      lastNodeVisited: 'extractBranding',
      selectedTransition: undefined,  // Clear after use
    };
  }
}

