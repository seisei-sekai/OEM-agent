const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = {
  // Create new session
  async createSession(userId?: string) {
    const res = await fetch(`${API_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    return res.json();
  },

  // Send message with SSE streaming
  async* sendMessage(sessionId: string, message: string, context?: any) {
    const res = await fetch(`${API_URL}/api/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message,
        context: {
          pageUrl: window.location.href,
          pageType: 'landing',
          ...context,
        },
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to send message');
    }

    if (!res.body) throw new Error('No response body');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              yield data;
            } catch (e) {
              console.error('Failed to parse SSE data:', line, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  // Get chat history
  async getChatHistory(userId: string) {
    const res = await fetch(`${API_URL}/api/sessions?userId=${userId}`);
    return res.json();
  },

  // Get session messages
  async getSessionMessages(sessionId: string) {
    const res = await fetch(`${API_URL}/api/sessions/${sessionId}/messages`);
    return res.json();
  },
};

