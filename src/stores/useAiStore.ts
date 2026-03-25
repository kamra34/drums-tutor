import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AiFeedback, ChatMessage } from '../types/ai';

interface AiState {
  apiKey: string;
  isConfigured: boolean;
  chatMessages: ChatMessage[];
  chatOpen: boolean;
  isLoading: boolean;
  lastFeedback: AiFeedback | null;
  suggestion: string | null;

  setApiKey: (key: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  setChatOpen: (open: boolean) => void;
  toggleChat: () => void;
  setLoading: (loading: boolean) => void;
  setLastFeedback: (feedback: AiFeedback | null) => void;
  setSuggestion: (suggestion: string | null) => void;
  clearChat: () => void;
}

export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      apiKey: '',
      isConfigured: false,
      chatMessages: [],
      chatOpen: false,
      isLoading: false,
      lastFeedback: null,
      suggestion: null,

      setApiKey: (key) => set({ apiKey: key, isConfigured: key.length > 0 }),

      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, message],
        })),

      setChatOpen: (open) => set({ chatOpen: open }),
      toggleChat: () => set((state) => ({ chatOpen: !state.chatOpen })),
      setLoading: (loading) => set({ isLoading: loading }),
      setLastFeedback: (feedback) => set({ lastFeedback: feedback }),
      setSuggestion: (suggestion) => set({ suggestion }),
      clearChat: () => set({ chatMessages: [] }),
    }),
    {
      name: 'drum-tutor-ai',
      partialize: (state) => ({ apiKey: state.apiKey, isConfigured: state.isConfigured }),
    }
  )
);
