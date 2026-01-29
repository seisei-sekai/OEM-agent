import { create } from 'zustand';
import { apiClient } from './api-client';

/**
 * Format timestamp to human-readable string
 * Examples: "2:30 PM", "Yesterday at 3:45 PM", "Jan 25 at 4:20 PM"
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  // Same day - just show time
  if (isSameDay(date, now)) {
    return formatTime(date);
  }

  // Yesterday
  if (daysDiff === 1) {
    return `Yesterday at ${formatTime(date)}`;
  }

  // This week
  if (daysDiff < 7) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName} at ${formatTime(date)}`;
  }

  // Older - show date
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${monthDay} at ${formatTime(date)}`;
}

/**
 * Get relative time string
 * Examples: "just now", "5 minutes ago", "2 hours ago"
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 10) return 'just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHour === 1) return '1 hour ago';
  if (diffHour < 24) return `${diffHour} hours ago`;
  if (diffDay === 1) return '1 day ago';
  return `${diffDay} days ago`;
}

interface StateTransition {
  id: string;
  label: string;
  description: string;
  targetNode: string;
  trigger?: string;
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  formattedTimestamp?: string; // "2:30 PM", "Yesterday at 3:45 PM"
  relativeTimestamp?: string; // "5 minutes ago"
  actionData?: {
    type: 'show_branding' | 'show_products' | 'show_product_image';
    payload: any;
  };
  availableTransitions?: StateTransition[];
}

interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  messageCount: number;
}

interface AIAgentStore {
  // UI State
  isModalOpen: boolean;
  isSidebarOpen: boolean;
  isStreaming: boolean;
  
  // Session State
  currentSessionId: string | null;
  messages: Message[];
  sessions: ChatSession[];
  userId: string | null;
  brandingConfirmed: boolean;
  
  // Products
  recommendedProducts: any[];
  
  // State Transitions
  availableTransitions: StateTransition[];
  currentState: string;
  
  // Actions
  openModal: () => void;
  closeModal: () => void;
  toggleSidebar: () => void;
  
  addMessage: (message: Message) => void;
  updateMessage: (id: string, content: string) => void;
  updateMessageAction: (id: string, actionData: any) => void;
  updateMessageTransitions: (id: string, transitions: StateTransition[]) => void;
  setMessages: (messages: Message[]) => void;
  
  setCurrentSession: (sessionId: string | null) => void;
  setSessions: (sessions: ChatSession[]) => void;
  loadChatHistory: (userId: string) => Promise<void>;
  loadSessionMessages: (sessionId: string) => Promise<void>;
  
  setUserId: (userId: string | null) => void;
  setRecommendedProducts: (products: any[]) => void;
  setStreaming: (isStreaming: boolean) => void;
  setBrandingConfirmed: (confirmed: boolean) => void;
  setAvailableTransitions: (transitions: StateTransition[]) => void;
  setCurrentState: (state: string) => void;
}

export const useAIAgentStore = create<AIAgentStore>((set, get) => ({
  // Initial state
  isModalOpen: false,
  isSidebarOpen: false,  // 默认关闭
  isStreaming: false,
  currentSessionId: null,
  messages: [],
  sessions: [],
  userId: null,
  brandingConfirmed: false,
  recommendedProducts: [],
  availableTransitions: [],
  currentState: 'idle',
  
  // Actions
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
  })),
  updateMessage: (id, content) => set((state) => ({
    messages: state.messages.map((msg) => 
      msg.id === id ? { ...msg, content } : msg
    ),
  })),
  updateMessageAction: (id, actionData) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === id ? { ...msg, actionData } : msg
    ),
  })),
  updateMessageTransitions: (id, transitions) => set((state) => ({
    messages: state.messages.map((msg) =>
      msg.id === id ? { ...msg, availableTransitions: transitions } : msg
    ),
    availableTransitions: transitions,
  })),
  setMessages: (messages) => set({ messages }),
  
  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
  setSessions: (sessions) => set({ sessions }),
  
  loadChatHistory: async (userId: string) => {
    try {
      const response = await apiClient.getChatHistory(userId);
      if (response.sessions) {
        set({ sessions: response.sessions, userId });
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  },
  
  loadSessionMessages: async (sessionId: string) => {
    try {
      const response = await apiClient.getSessionMessages(sessionId);
      if (response.messages) {
        const messages = response.messages.map((msg: any) => {
          const timestamp = new Date(msg.timestamp);
          return {
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp,
            formattedTimestamp: msg.formattedTimestamp || formatTimestamp(timestamp),
            relativeTimestamp: msg.relativeTimestamp || formatRelativeTime(timestamp),
          };
        });
        set({ messages, currentSessionId: sessionId });
      }
    } catch (error) {
      console.error('Failed to load session messages:', error);
    }
  },
  
  setUserId: (userId) => set({ userId }),
  setRecommendedProducts: (products) => set({ recommendedProducts: products }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  setBrandingConfirmed: (confirmed) => set({ brandingConfirmed: confirmed }),
  setAvailableTransitions: (transitions) => set({ availableTransitions: transitions }),
  setCurrentState: (state) => set({ currentState: state }),
}));

