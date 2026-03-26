import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AiFeedback, ChatMessage, Conversation } from '../types/ai';
import { registerStore } from './storeUtils';

const MAX_CONVERSATIONS = 50;

function createId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

interface AiState {
  apiKey: string;
  isConfigured: boolean;

  // Conversation management
  conversations: Conversation[];
  activeConversationId: string | null;

  // Transient state (not persisted)
  isLoading: boolean;
  lastFeedback: AiFeedback | null;
  suggestion: string | null;
  followups: string[];

  // Actions
  setApiKey: (key: string) => void;
  setLoading: (loading: boolean) => void;
  setLastFeedback: (feedback: AiFeedback | null) => void;
  setSuggestion: (suggestion: string | null) => void;
  setFollowups: (followups: string[]) => void;

  // Conversation actions
  newConversation: () => string;
  setActiveConversation: (id: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  updateConversationTitle: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;
  clearAllConversations: () => void;

  // Getters
  getActiveConversation: () => Conversation | undefined;
  getActiveMessages: () => ChatMessage[];
}

export const useAiStore = create<AiState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      isConfigured: false,
      conversations: [],
      activeConversationId: null,
      isLoading: false,
      lastFeedback: null,
      suggestion: null,
      followups: [],

      setApiKey: (key) => set({ apiKey: key, isConfigured: key.length > 0 }),
      setLoading: (loading) => set({ isLoading: loading }),
      setLastFeedback: (feedback) => set({ lastFeedback: feedback }),
      setSuggestion: (suggestion) => set({ suggestion }),
      setFollowups: (followups) => set({ followups }),

      newConversation: () => {
        const id = createId();
        const conv: Conversation = {
          id,
          title: 'New conversation',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => {
          let convs = [conv, ...state.conversations];
          // Prune oldest beyond limit
          if (convs.length > MAX_CONVERSATIONS) {
            convs = convs.slice(0, MAX_CONVERSATIONS);
          }
          return { conversations: convs, activeConversationId: id, followups: [] };
        });
        return id;
      },

      setActiveConversation: (id) => set({ activeConversationId: id, followups: [] }),

      addMessage: (message) =>
        set((state) => {
          const convId = state.activeConversationId;
          if (!convId) return state;
          return {
            conversations: state.conversations.map((c) =>
              c.id === convId
                ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() }
                : c
            ),
          };
        }),

      updateConversationTitle: (id, title) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        })),

      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId:
            state.activeConversationId === id ? null : state.activeConversationId,
          followups: state.activeConversationId === id ? [] : state.followups,
        })),

      clearAllConversations: () =>
        set({ conversations: [], activeConversationId: null, followups: [] }),

      getActiveConversation: () => {
        const state = get();
        return state.conversations.find((c) => c.id === state.activeConversationId);
      },

      getActiveMessages: () => {
        const state = get();
        const conv = state.conversations.find((c) => c.id === state.activeConversationId);
        return conv?.messages ?? [];
      },
    }),
    {
      name: 'drum-tutor-ai',
      partialize: (state) => ({
        apiKey: state.apiKey,
        isConfigured: state.isConfigured,
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);

// Register so storeUtils can rehydrate on user switch
registerStore('drum-tutor-ai', useAiStore as any);
