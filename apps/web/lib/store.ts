import { create } from 'zustand';
import { apiClient } from './api-client';

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
  isSidebarOpen: true,
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
        const messages = response.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
        }));
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

