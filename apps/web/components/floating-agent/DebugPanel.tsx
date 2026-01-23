'use client';

import { useAIAgentStore } from '@/lib/store';
import { X } from 'lucide-react';

interface DebugPanelProps {
  onClose: () => void;
}

export function DebugPanel({ onClose }: DebugPanelProps) {
  const { messages, brandingConfirmed, availableTransitions } = useAIAgentStore();
  
  // Determine current state based on conversation
  const getCurrentState = () => {
    if (messages.length === 0) return 'idle';
    
    const lastAgentMessage = messages.filter(m => m.role === 'agent').pop();
    const hasBranding = messages.some(m => m.actionData?.type === 'show_branding');
    const hasProducts = messages.some(m => m.actionData?.type === 'show_products');
    const hasProductImage = messages.some(m => m.actionData?.type === 'show_product_image');
    
    if (hasProductImage) return 'generateMockup';
    if (hasProducts) return 'recommendProducts';
    if (hasBranding && !brandingConfirmed) return 'extractBranding';
    if (hasBranding && brandingConfirmed) return 'classifyIntent';
    
    const lastContent = lastAgentMessage?.content?.toLowerCase() || '';
    if (lastContent.includes('hi') || lastContent.includes('help')) return 'welcome';
    
    return 'conversation';
  };
  
  const currentState = getCurrentState();
  
  const states = [
    { id: 'idle', label: 'Idle', color: 'bg-gray-300' },
    { id: 'welcome', label: 'Welcome', color: 'bg-blue-400' },
    { id: 'classifyIntent', label: 'Classify Intent', color: 'bg-yellow-400' },
    { id: 'extractBranding', label: 'Extract Branding', color: 'bg-orange-400' },
    { id: 'recommendProducts', label: 'Recommend Products', color: 'bg-green-400' },
    { id: 'generateMockup', label: 'Generate Mockup', color: 'bg-purple-400' },
    { id: 'conversation', label: 'Conversation', color: 'bg-pink-400' },
  ];
  
  const allEdges = [
    { from: 'initialRouter', to: 'welcome', label: 'First message' },
    { from: 'initialRouter', to: 'classifyIntent', label: 'Subsequent' },
    { from: 'welcome', to: 'classifyIntent', label: 'Continue' },
    { from: 'classifyIntent', to: 'extractBranding', label: 'Has URL' },
    { from: 'classifyIntent', to: 'recommendProducts', label: 'Branding confirmed' },
    { from: 'classifyIntent', to: 'generateMockup', label: 'Has products + request' },
    { from: 'classifyIntent', to: 'conversation', label: 'Default' },
    { from: 'extractBranding', to: 'END', label: 'Wait for user' },
    { from: 'recommendProducts', to: 'END', label: 'Show products' },
    { from: 'generateMockup', to: 'END', label: 'Show mockup' },
    { from: 'conversation', to: 'END', label: 'End turn' },
  ];
  
  return (
    <div className="bg-white border-b shadow-sm p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold text-gray-700">🔍 LangGraph State Machine</div>
            <div className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
              Current: {states.find(s => s.id === currentState)?.label}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {states.map((state, idx) => (
            <div key={state.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`${state.color} ${
                    currentState === state.id ? 'ring-4 ring-blue-500' : ''
                  } w-20 h-16 rounded-lg shadow flex flex-col items-center justify-center text-xs font-medium text-white transition-all`}
                >
                  {state.label.split(' ').map((word, i) => (
                    <div key={i}>{word}</div>
                  ))}
                </div>
              </div>
              
              {idx < states.length - 1 && (
                <div className="text-gray-400 mx-1">→</div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium text-gray-700">Messages:</div>
            <div className="text-gray-600">{messages.length}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium text-gray-700">Branding:</div>
            <div className="text-gray-600">{brandingConfirmed ? '✅ Confirmed' : '❌ Not confirmed'}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium text-gray-700">State:</div>
            <div className="text-gray-600">{getCurrentState()}</div>
          </div>
        </div>
        
        {/* Available Transitions */}
        {availableTransitions && availableTransitions.length > 0 && (
          <div className="mt-3 bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="text-xs font-semibold text-purple-900 mb-2">
              🔀 Available Transitions ({availableTransitions.length})
            </div>
            <div className="space-y-1">
              {availableTransitions.map((transition) => (
                <div key={transition.id} className="flex items-center gap-2 text-xs">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="font-medium text-purple-700">{transition.label}</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-purple-600">{transition.targetNode}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* All Possible Edges */}
        <div className="mt-3">
          <div className="text-xs font-semibold text-gray-700 mb-2">
            📊 All Graph Edges
          </div>
          <div className="bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
            <div className="space-y-1 text-xs">
              {allEdges.map((edge, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-mono text-blue-600">{edge.from}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-mono text-green-600">{edge.to}</span>
                  <span className="text-gray-500 text-[10px]">({edge.label})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

