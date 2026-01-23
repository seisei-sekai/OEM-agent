'use client';

import { useEffect, useState } from 'react';
import { X, Menu, Maximize2, Bug } from 'lucide-react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatSidebar } from './ChatSidebar';
import { DebugPanel } from './DebugPanel';
import { QuickActionButtons } from './QuickActionButtons';
import { useAIAgentStore } from '@/lib/store';

interface ChatModalProps {
  onClose: () => void;
}

export function ChatModal({ onClose }: ChatModalProps) {
  const { isSidebarOpen, toggleSidebar, userId, loadChatHistory } = useAIAgentStore();
  const [debugMode, setDebugMode] = useState(false);
  
  // Load chat history on mount
  useEffect(() => {
    const defaultUserId = userId || 'default-user';
    loadChatHistory(defaultUserId);
  }, []);

  return (
    <div className="chat-modal" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[720px] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Debug Panel */}
        {debugMode && <DebugPanel onClose={() => setDebugMode(false)} />}
        
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          {isSidebarOpen && <ChatSidebar />}

          {/* Main Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-4">
                <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg">
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full" />
                  <span className="font-semibold">AI Agent</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                  Talk to Support team
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Maximize2 className="w-5 h-5" />
                </button>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <MessageList />

            {/* Quick Actions */}
            <QuickActionButtons />

            {/* Input */}
            <ChatInput />
            
            {/* Debug Toggle (bottom left) */}
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`absolute bottom-4 left-4 p-2 rounded-lg shadow-lg transition-colors ${
                debugMode ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              title="Toggle Debug Mode"
            >
              <Bug className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

