'use client';

import { useState, ReactNode } from 'react';

interface ComingSoonTooltipProps {
  children: ReactNode;
  className?: string;
}

export function ComingSoonTooltip({ children, className = '' }: ComingSoonTooltipProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [show, setShow] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseEnter = () => {
    setShow(true);
  };

  const handleMouseLeave = () => {
    setShow(false);
  };

  return (
    <>
      <div
        className={`cursor-not-allowed ${className}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      
      {show && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${position.x + 15}px`,
            top: `${position.y + 15}px`,
          }}
        >
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            Feature coming soon
          </div>
        </div>
      )}
    </>
  );
}

