'use client';

import { useState } from 'react';

interface StateTransition {
  id: string;
  label: string;
  description: string;
  targetNode: string;
  trigger?: string;
}

interface TransitionCardProps {
  transitions: StateTransition[];
  onSelect: (transitionId: string) => void;
  disabled?: boolean;
}

export function TransitionCard({ transitions, onSelect, disabled = false }: TransitionCardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (transitionId: string) => {
    if (disabled) return;
    setSelectedId(transitionId);
    onSelect(transitionId);
  };

  if (!transitions || transitions.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 mb-2">
      <div className="text-xs text-gray-500 mb-2 font-medium">Quick Actions:</div>
      <div className="flex flex-wrap gap-2">
        {transitions.map((transition) => (
          <button
            key={transition.id}
            onClick={() => handleSelect(transition.id)}
            disabled={disabled}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${
                selectedId === transition.id
                  ? 'bg-purple-600 text-white shadow-md scale-95'
                  : 'bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 hover:from-purple-100 hover:to-blue-100 hover:shadow-md'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
              border border-purple-200
            `}
            title={transition.description}
          >
            <div className="flex items-center gap-1">
              <span>{transition.label}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        Click an action to navigate to that state
      </div>
    </div>
  );
}

