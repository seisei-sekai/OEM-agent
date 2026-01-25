'use client';

import { MessageCircle } from 'lucide-react';

interface FloatingButtonProps {
  onClick: () => void;
  hasNotification?: boolean;
}

export function FloatingButton({ onClick, hasNotification = false }: FloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className="floating-button group hover:scale-110"
      aria-label="Open AI Agent"
    >
      <MessageCircle className="w-8 h-8 text-white" />
      
      {hasNotification && (
        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}



