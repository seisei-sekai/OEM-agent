import React from 'react';

interface MessageBubbleProps {
  content: string;
  role: 'user' | 'assistant';
  timestamp: string; // ISO string from API
  formattedTimestamp?: string; // Already formatted by backend
  relativeTimestamp?: string; // "5 minutes ago"
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content,
  role,
  timestamp,
  formattedTimestamp,
  relativeTimestamp,
}) => {
  // Format full datetime for tooltip
  const fullDateTime = new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  const isUser = role === 'user';

  return (
    <div
      className={`inline-block px-4 py-3 ${
        isUser
          ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl rounded-tr-sm max-w-[70%] ml-auto'
          : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm max-w-[80%] mr-auto'
      }`}
      style={{
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
        hyphens: 'auto',
      }}
    >
      {/* Message content */}
      <div>{content}</div>

      {/* Timestamp */}
      <div
        className={`mt-1 text-xs ${
          isUser ? 'text-blue-100 opacity-80' : 'text-gray-500'
        }`}
        title={fullDateTime} // Tooltip shows full datetime
      >
        {/* Show formatted timestamp from backend, or relative as fallback */}
        {formattedTimestamp || relativeTimestamp || 'just now'}
      </div>
    </div>
  );
};

export default MessageBubble;
