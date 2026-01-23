'use client';

import { useAIAgentStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';
import { generateUUID } from '@/lib/uuid';

interface QuickAction {
  id: string;
  label: string;
  message: string;
  icon: string;
}

export function QuickActionButtons() {
  const { messages, addMessage, updateMessage, updateMessageAction, updateMessageTransitions, currentSessionId, brandingConfirmed, setStreaming, isStreaming } = useAIAgentStore();

  // Determine which actions to show based on conversation state
  const getAvailableActions = (): QuickAction[] => {
    const lastAgentMessage = messages.filter(m => m.role === 'agent').pop();
    const hasBranding = messages.some(m => m.actionData?.type === 'show_branding');
    const hasProducts = messages.some(m => m.actionData?.type === 'show_products');

    const actions: QuickAction[] = [];

    // If no branding yet, suggest providing website
    if (!hasBranding && messages.length > 0) {
      actions.push({
        id: 'provide-url',
        label: 'Provide Website URL',
        message: 'I have a website URL for branding extraction',
        icon: '🌐'
      });
    }

    // If branding shown but not confirmed
    if (hasBranding && !brandingConfirmed) {
      actions.push({
        id: 'confirm-branding',
        label: 'Confirm Branding',
        message: 'Yes, use this branding for my products',
        icon: '✅'
      });
      actions.push({
        id: 'upload-different',
        label: 'Upload Different',
        message: 'I want to upload a different logo',
        icon: '📤'
      });
    }

    // If products shown, suggest viewing specific items
    if (hasProducts) {
      actions.push({
        id: 'view-tshirt',
        label: 'View T-shirt',
        message: 'Show me a t-shirt with my logo',
        icon: '👕'
      });
      actions.push({
        id: 'view-mug',
        label: 'View Mug',
        message: 'Show me a coffee mug with my logo',
        icon: '☕'
      });
      actions.push({
        id: 'view-hoodie',
        label: 'View Hoodie',
        message: 'Show me a hoodie with my logo',
        icon: '🧥'
      });
    }

    // Always show general options
    actions.push({
      id: 'ask-question',
      label: 'Ask a Question',
      message: 'I have a question about your services',
      icon: '❓'
    });

    return actions;
  };

  const handleActionClick = (action: QuickAction) => {
    if (!currentSessionId) return;

    // Add user message
    addMessage({
      id: generateUUID(),
      role: 'user',
      content: action.message,
      timestamp: new Date(),
    });
  };

  // 🚀 FORCE NAVIGATE TO PRODUCTS - Works anytime!
  const handleForceProducts = async () => {
    if (!currentSessionId || isStreaming) return;

    const forceMessage = {
      id: generateUUID(),
      role: 'user' as const,
      content: '🚀 [FORCE] Show me all products now!',
      timestamp: new Date(),
    };

    addMessage(forceMessage);
    setStreaming(true);

    try {
      const agentMessageId = generateUUID();
      let agentResponse = '';

      addMessage({
        id: agentMessageId,
        role: 'agent',
        content: '',
        timestamp: new Date(),
      });

      // CRITICAL: Force routing to recommendProducts with selectedTransition
      for await (const event of apiClient.sendMessage(currentSessionId, forceMessage.content, {
        selectedTransition: 'to_recommend_products',  // Force routing
        brandingConfirmed: true,  // Auto-confirm branding
        // If no branding exists, backend will use defaults
      })) {
        if (event.type === 'token') {
          agentResponse += event.data.text;
          updateMessage(agentMessageId, agentResponse);
        } else if (event.type === 'action') {
          updateMessageAction(agentMessageId, event.data);
        } else if (event.type === 'transitions') {
          updateMessageTransitions(agentMessageId, event.data);
        } else if (event.type === 'error') {
          console.error('Agent error:', event.data);
        }
      }
    } catch (error) {
      console.error('Error forcing products:', error);
      addMessage({
        id: generateUUID(),
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      });
    } finally {
      setStreaming(false);
    }
  };

  // 🎨 FORCE NAVIGATE TO MOCKUP GENERATION - Works anytime!
  const handleForceMockup = async () => {
    if (!currentSessionId || isStreaming) return;

    const forceMessage = {
      id: generateUUID(),
      role: 'user' as const,
      content: '🎨 [FORCE] Generate a ceramic mug mockup with my logo now!',
      timestamp: new Date(),
    };

    addMessage(forceMessage);
    setStreaming(true);

    try {
      const agentMessageId = generateUUID();
      let agentResponse = '';

      addMessage({
        id: agentMessageId,
        role: 'agent',
        content: '',
        timestamp: new Date(),
      });

      // CRITICAL: Force routing to generateMockup with selectedTransition
      const contextToSend = {
        selectedTransition: 'to_generate_mockup',  // Force routing to mockup
        brandingConfirmed: true,  // Auto-confirm branding
        // Backend will auto-create branding and products if missing
      };
      console.log('🔍 Sending request with context:', contextToSend);

      for await (const event of apiClient.sendMessage(currentSessionId, forceMessage.content, contextToSend)) {
        if (event.type === 'token') {
          agentResponse += event.data.text;
          updateMessage(agentMessageId, agentResponse);
        } else if (event.type === 'action') {
          updateMessageAction(agentMessageId, event.data);
        } else if (event.type === 'transitions') {
          updateMessageTransitions(agentMessageId, event.data);
        } else if (event.type === 'error') {
          console.error('Agent error:', event.data);
        }
      }
    } catch (error) {
      console.error('Error forcing mockup:', error);
      addMessage({
        id: generateUUID(),
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      });
    } finally {
      setStreaming(false);
    }
  };

  const actions = getAvailableActions();

  // Don't show if no session
  if (!currentSessionId) {
    return null;
  }

  return (
    <div className="border-t p-3 bg-gray-50">
      <div className="text-xs text-gray-500 mb-2">Quick Actions:</div>
      <div className="flex flex-wrap gap-2">
        {/* 🚀 FORCE PRODUCTS BUTTON - Always visible! */}
        <button
          onClick={handleForceProducts}
          disabled={isStreaming}
          className="text-xs px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center gap-1 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>🎯</span>
          <span>Show Products</span>
        </button>

        {/* 🎨 FORCE MOCKUP BUTTON - Always visible! */}
        <button
          onClick={handleForceMockup}
          disabled={isStreaming}
          className="text-xs px-4 py-2 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-full hover:from-pink-700 hover:to-orange-700 transition-all shadow-md hover:shadow-lg flex items-center gap-1 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>🎨</span>
          <span>Generate Mockup</span>
        </button>

        {/* Regular quick actions */}
        {actions.slice(0, 2).map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:border-purple-300 hover:bg-purple-50 transition-colors flex items-center gap-1"
          >
            <span>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

