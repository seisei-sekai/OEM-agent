'use client';

import { useEffect, useRef } from 'react';
import { useAIAgentStore } from '@/lib/store';
import { BrandingInfoCard } from './BrandingInfoCard';
import { ProductMockupCard } from './ProductMockupCard';
import { TransitionCard } from './TransitionCard';
import { apiClient } from '@/lib/api-client';

export function MessageList() {
  const { messages, isStreaming, currentSessionId, addMessage, updateMessage, updateMessageAction, updateMessageTransitions, setStreaming, setBrandingConfirmed } = useAIAgentStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleBrandingConfirm = async () => {
    if (!currentSessionId) return;

    const confirmMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: '[Confirmed branding] → Show products',
      timestamp: new Date(),
    };
    addMessage(confirmMessage);
    setBrandingConfirmed(true);
    setStreaming(true);

    try {
      const agentMessageId = crypto.randomUUID();
      let agentResponse = '';

      addMessage({
        id: agentMessageId,
        role: 'agent',
        content: '',
        timestamp: new Date(),
      });

      // CRITICAL: Use selectedTransition to directly route to recommendProducts
      for await (const event of apiClient.sendMessage(currentSessionId, confirmMessage.content, {
        brandingConfirmed: true,
        selectedTransition: 'confirm_branding'  // Force routing to recommendProducts
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
      console.error('Error sending confirmation:', error);
      addMessage({
        id: crypto.randomUUID(),
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleTransitionSelect = async (transitionId: string) => {
    if (!currentSessionId || isStreaming) return;

    const transitionMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: `[Transition: ${transitionId}]`,
      timestamp: new Date(),
    };
    addMessage(transitionMessage);
    setStreaming(true);

    try {
      const agentMessageId = crypto.randomUUID();
      let agentResponse = '';

      addMessage({
        id: agentMessageId,
        role: 'agent',
        content: '',
        timestamp: new Date(),
      });

      for await (const event of apiClient.sendMessage(currentSessionId, transitionMessage.content, { selectedTransition: transitionId })) {
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
      console.error('Error sending transition:', error);
      addMessage({
        id: crypto.randomUUID(),
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleUploadDifferent = async () => {
    if (!currentSessionId) return;

    const uploadMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: 'I want to upload a different logo',
      timestamp: new Date(),
    };
    addMessage(uploadMessage);
    setBrandingConfirmed(false);
    setStreaming(true);

    try {
      const agentMessageId = crypto.randomUUID();
      let agentResponse = '';

      addMessage({
        id: agentMessageId,
        role: 'agent',
        content: '',
        timestamp: new Date(),
      });

      for await (const event of apiClient.sendMessage(currentSessionId, uploadMessage.content)) {
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
      console.error('Error sending upload request:', error);
      addMessage({
        id: crypto.randomUUID(),
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      });
    } finally {
      setStreaming(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-semibold mb-4">How can I help you today?</h2>
        <p className="text-gray-600 text-center mb-8 max-w-md">
          Tell me what you want to create and I'll help you bring it to life.
        </p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
          <QuickActionCard icon="⚡" title="Create branded merch" />
          <QuickActionCard icon="✨" title="Make a fully custom product" />
          <QuickActionCard icon="✋" title="Ask a general question" />
          <QuickActionCard icon="🔍" title="Track order or shipment" />
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className="flex flex-col max-w-full">
            <div className={message.role === 'user' ? 'message-user' : 'message-agent'}>
              {message.content}
            </div>
            {message.role === 'agent' && message.actionData?.type === 'show_branding' && (
              <BrandingInfoCard
                branding={message.actionData.payload}
                onConfirm={handleBrandingConfirm}
                onUploadDifferent={handleUploadDifferent}
              />
            )}
            {message.role === 'agent' && message.actionData?.type === 'show_product_image' && message.actionData.payload?.imageUrl && (
              <ProductMockupCard
                imageUrl={message.actionData.payload.imageUrl}
                productName={message.actionData.payload.productName}
                companyName={message.actionData.payload.companyName}
              />
            )}
            {message.role === 'agent' && message.availableTransitions && message.availableTransitions.length > 0 && (
              <TransitionCard
                transitions={message.availableTransitions}
                onSelect={handleTransitionSelect}
                disabled={isStreaming}
              />
            )}
          </div>
        </div>
      ))}

      {isStreaming && (
        <div className="flex justify-start">
          <div className="message-agent">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickActionCard({ icon, title }: { icon: string; title: string }) {
  return (
    <button className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-gray-500 mt-1">→</div>
    </button>
  );
}

