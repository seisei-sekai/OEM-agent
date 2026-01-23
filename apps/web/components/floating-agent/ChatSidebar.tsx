'use client';

import { Plus } from 'lucide-react';
import { useAIAgentStore } from '@/lib/store';

export function ChatSidebar() {
  const { sessions, currentSessionId, setCurrentSession, setMessages, loadSessionMessages, setBrandingConfirmed } = useAIAgentStore();

  const handleNewChat = () => {
    setCurrentSession(null);
    setMessages([]);
    setBrandingConfirmed(false);
  };
  
  const handleSelectSession = async (sessionId: string) => {
    await loadSessionMessages(sessionId);
  };

  return (
    <div className="w-64 border-r bg-gray-50 p-4 flex flex-col">
      <button
        onClick={handleNewChat}
        disabled
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg mb-4 opacity-50 cursor-not-allowed"
      >
        <Plus className="w-4 h-4" />
        <span>New chat</span>
      </button>

      <div className="text-sm text-gray-500 mb-2">Chat history</div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {sessions.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8">
            No chat history yet
          </div>
        ) : (
          sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => handleSelectSession(session.id)}
              className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors ${
                session.id === currentSessionId ? 'bg-gray-200' : ''
              }`}
            >
              <div className="text-sm font-medium truncate">{session.title}</div>
              <div className="text-xs text-gray-500">
                {new Date(session.createdAt).toLocaleDateString()}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

