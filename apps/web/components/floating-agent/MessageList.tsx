'use client';

import { useEffect, useRef } from 'react';
import { useAIAgentStore } from '@/lib/store';
import { generateUUID } from '@/lib/uuid';
import { BrandingInfoCard } from './BrandingInfoCard';
import { ProductMockupCard } from './ProductMockupCard';
import { TransitionCard } from './TransitionCard';
import { ComingSoonTooltip } from './ComingSoonTooltip';
import { apiClient } from '@/lib/api-client';
import { MessageBubble } from '@/components/chat/MessageBubble';

/**
 * Format timestamp for new messages
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Same day - just show time
  if (isSameDay(date, now)) {
    return formatTime(date);
  }

  // Yesterday
  if (daysDiff === 1) {
    return `Yesterday at ${formatTime(date)}`;
  }

  // This week
  if (daysDiff < 7) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName} at ${formatTime(date)}`;
  }

  // Older - show date
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${monthDay} at ${formatTime(date)}`;
}

export function MessageList() {
  const { messages, isStreaming, currentSessionId, addMessage, updateMessage, updateMessageAction, updateMessageTransitions, setStreaming, setBrandingConfirmed } = useAIAgentStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleBrandingConfirm = async () => {
    if (!currentSessionId) return;

    const timestamp = new Date();
    const confirmMessage = {
      id: generateUUID(),
      role: 'user' as const,
      content: '[Confirmed branding] → Show products',
      timestamp,
      formattedTimestamp: formatTimestamp(timestamp),
      relativeTimestamp: 'just now',
    };
    addMessage(confirmMessage);
    setBrandingConfirmed(true);
    setStreaming(true);

    try {
      const agentMessageId = generateUUID();
      let agentResponse = '';

      const agentTimestamp = new Date();
      addMessage({
        id: agentMessageId,
        role: 'agent',
        content: '',
        timestamp: agentTimestamp,
        formattedTimestamp: formatTimestamp(agentTimestamp),
        relativeTimestamp: 'just now',
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
      const errorTimestamp = new Date();
      addMessage({
        id: generateUUID(),
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: errorTimestamp,
        formattedTimestamp: formatTimestamp(errorTimestamp),
        relativeTimestamp: 'just now',
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleTransitionSelect = async (transitionId: string) => {
    if (!currentSessionId || isStreaming) return;

    const timestamp = new Date();
    const transitionMessage = {
      id: generateUUID(),
      role: 'user' as const,
      content: `[Transition: ${transitionId}]`,
      timestamp,
      formattedTimestamp: formatTimestamp(timestamp),
      relativeTimestamp: 'just now',
    };
    addMessage(transitionMessage);
    setStreaming(true);

    try {
      const agentMessageId = generateUUID();
      let agentResponse = '';

      const agentTimestamp = new Date();
      addMessage({
        id: agentMessageId,
        role: 'agent',
        content: '',
        timestamp: agentTimestamp,
        formattedTimestamp: formatTimestamp(agentTimestamp),
        relativeTimestamp: 'just now',
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
      const errorTimestamp = new Date();
      addMessage({
        id: generateUUID(),
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: errorTimestamp,
        formattedTimestamp: formatTimestamp(errorTimestamp),
        relativeTimestamp: 'just now',
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleUploadDifferent = async () => {
    if (!currentSessionId) return;

    const timestamp = new Date();
    const uploadMessage = {
      id: generateUUID(),
      role: 'user' as const,
      content: 'I want to upload a different logo',
      timestamp,
      formattedTimestamp: formatTimestamp(timestamp),
      relativeTimestamp: 'just now',
    };
    addMessage(uploadMessage);
    setBrandingConfirmed(false);
    setStreaming(true);

    try {
      const agentMessageId = generateUUID();
      let agentResponse = '';

      const agentTimestamp = new Date();
      addMessage({
        id: agentMessageId,
        role: 'agent',
        content: '',
        timestamp: agentTimestamp,
        formattedTimestamp: formatTimestamp(agentTimestamp),
        relativeTimestamp: 'just now',
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
      const errorTimestamp = new Date();
      addMessage({
        id: generateUUID(),
        role: 'agent',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: errorTimestamp,
        formattedTimestamp: formatTimestamp(errorTimestamp),
        relativeTimestamp: 'just now',
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
          <ComingSoonTooltip>
            <QuickActionCard icon="⚡" title="Create branded merch" disabled />
          </ComingSoonTooltip>
          <ComingSoonTooltip>
            <QuickActionCard icon="✨" title="Make a fully custom product" disabled />
          </ComingSoonTooltip>
          <ComingSoonTooltip>
            <QuickActionCard icon="✋" title="Ask a general question" disabled />
          </ComingSoonTooltip>
          <ComingSoonTooltip>
            <QuickActionCard icon="🔍" title="Track order or shipment" disabled />
          </ComingSoonTooltip>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((message) => (
        <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className="flex flex-col max-w-full">
            {/* Use MessageBubble component with timestamps */}
            <MessageBubble
              content={message.content}
              role={message.role === 'agent' ? 'assistant' : 'user'}
              timestamp={message.timestamp.toISOString()}
              formattedTimestamp={message.formattedTimestamp}
              relativeTimestamp={message.relativeTimestamp}
            />
            
            {/* Action cards below message */}
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

function QuickActionCard({ icon, title, disabled = false }: { icon: string; title: string; disabled?: boolean }) {
  return (
    <button
      className={`p-4 border border-gray-200 rounded-lg text-left transition-colors ${disabled
        ? 'opacity-50 pointer-events-none'
        : 'hover:border-purple-300 hover:bg-purple-50'
        }`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-gray-500 mt-1">→</div>
    </button>
  );
}

