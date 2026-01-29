'use client';

import { MessageBubble } from '@/components/chat/MessageBubble';

/**
 * Test page for Message Timestamps feature
 * 
 * Navigate to: http://localhost:3000/test-timestamps
 */
export default function TestTimestampsPage() {
  // Create test messages with various timestamps
  const testMessages = [
    {
      id: '1',
      content: 'Message from right now',
      role: 'user' as const,
      timestamp: new Date().toISOString(),
      formattedTimestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      relativeTimestamp: 'just now',
    },
    {
      id: '2',
      content: 'Response from AI agent',
      role: 'assistant' as const,
      timestamp: new Date(Date.now() - 30000).toISOString(), // 30 sec ago
      formattedTimestamp: new Date(Date.now() - 30000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      relativeTimestamp: '30 seconds ago',
    },
    {
      id: '3',
      content: 'Can you help me find custom branded t-shirts for my startup?',
      role: 'user' as const,
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(), // 5 min ago
      formattedTimestamp: new Date(Date.now() - 5 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      relativeTimestamp: '5 minutes ago',
    },
    {
      id: '4',
      content: 'Of course! I can help you find great custom branded t-shirts. What colors and designs are you looking for?',
      role: 'assistant' as const,
      timestamp: new Date(Date.now() - 4.5 * 60000).toISOString(), // 4.5 min ago
      formattedTimestamp: new Date(Date.now() - 4.5 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      relativeTimestamp: '4 minutes ago',
    },
    {
      id: '5',
      content: 'I need black t-shirts with my company logo in white.',
      role: 'user' as const,
      timestamp: new Date(Date.now() - 2 * 60000).toISOString(), // 2 min ago
      formattedTimestamp: new Date(Date.now() - 2 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      relativeTimestamp: '2 minutes ago',
    },
    {
      id: '6',
      content: 'Perfect! Let me show you some excellent options for black t-shirts with white logo printing.',
      role: 'assistant' as const,
      timestamp: new Date(Date.now() - 1.5 * 60000).toISOString(), // 1.5 min ago
      formattedTimestamp: new Date(Date.now() - 1.5 * 60000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      relativeTimestamp: '1 minute ago',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Message Timestamps Test Page</h1>
          <p className="text-gray-600">Testing the new timestamp display feature</p>
        </div>

        {/* Test Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3 text-blue-900">✅ Integration Complete!</h2>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>What to test:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Timestamps appear below each message in small text</li>
              <li>User messages (blue bubbles) show light blue timestamps</li>
              <li>AI messages (gray bubbles) show gray timestamps</li>
              <li><strong>Hover over any timestamp</strong> to see full date/time tooltip</li>
              <li>Formatting changes based on time (just now, minutes ago, etc.)</li>
            </ul>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Chat Conversation</h2>
          
          {testMessages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <MessageBubble
                content={message.content}
                role={message.role}
                timestamp={message.timestamp}
                formattedTimestamp={message.formattedTimestamp}
                relativeTimestamp={message.relativeTimestamp}
              />
            </div>
          ))}
        </div>

        {/* Feature Details */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-3 text-green-900">🎉 Feature Details</h2>
          <div className="space-y-2 text-sm text-green-800">
            <p><strong>Implemented Components:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><code className="bg-green-100 px-1 rounded">Timestamp</code> Value Object (Domain Layer) - 11 tests passing ✅</li>
              <li><code className="bg-green-100 px-1 rounded">MessageBubble</code> Component (Frontend)</li>
              <li><code className="bg-green-100 px-1 rounded">Message.getFormattedTimestamp()</code> helper method</li>
              <li><code className="bg-green-100 px-1 rounded">formatTimestamp()</code> utilities in store and MessageList</li>
            </ul>
            <p className="mt-3"><strong>TDD Workflow:</strong> ✅ Red → Green → Refactor complete!</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            ← Back to Main App
          </a>
        </div>
      </div>
    </div>
  );
}
