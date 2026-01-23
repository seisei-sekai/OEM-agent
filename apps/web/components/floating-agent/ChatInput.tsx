'use client';

import { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { useAIAgentStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';

export function ChatInput() {
  const [input, setInput] = useState('');
  const { currentSessionId, addMessage, updateMessage, updateMessageAction, setStreaming, setCurrentSession, brandingConfirmed } = useAIAgentStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput('');
    setStreaming(true);

    try {
      // Create session if needed
      let sessionId = currentSessionId;
      if (!sessionId) {
        const { session } = await apiClient.createSession();
        sessionId = session.id;
        setCurrentSession(sessionId!);
      }

      // Create agent message placeholder
      const agentMessageId = crypto.randomUUID();
      let agentResponse = '';
      
      // Add initial empty agent message
      addMessage({
        id: agentMessageId,
        role: 'agent',
        content: '',
        timestamp: new Date(),
      });

      // Stream response
      for await (const event of apiClient.sendMessage(sessionId!, userMessage.content, { brandingConfirmed })) {
        if (event.type === 'token') {
          agentResponse += event.data.text;
          // Update the agent message with accumulated text
          updateMessage(agentMessageId, agentResponse);
        } else if (event.type === 'action') {
          // Store action data in the message
          updateMessageAction(agentMessageId, event.data);
        } else if (event.type === 'complete') {
          // Stream complete
        } else if (event.type === 'error') {
          console.error('Agent error:', event.data);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
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

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex items-center gap-2">
        <button type="button" className="p-2 hover:bg-gray-100 rounded-lg">
          <Paperclip className="w-5 h-5 text-gray-500" />
        </button>
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say anything..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        
        <button
          type="submit"
          disabled={!input.trim()}
          className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}

