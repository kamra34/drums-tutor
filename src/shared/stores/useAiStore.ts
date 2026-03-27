import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AiFeedback, ChatMessage, Conversation } from '@shared/types/ai';
import { registerStore } from '@shared/stores/storeUtils';
import {
  apiListChats, apiCreateChat, apiGetChat, apiUpdateChatTitle,
  apiDeleteChat, apiAddChatMessage, getToken,
} from '@shared/services/apiClient';

function createLocalId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

interface AiState {
  apiKey: string;
  isConfigured: boolean;

  // Conversation management
  conversations: Conversation[];
  activeConversationId: string | null;
  conversationsLoaded: boolean;

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

  // Conversation actions (backend-synced)
  loadConversations: () => Promise<void>;
  newConversation: () => Promise<string>;
  setActiveConversation: (id: string | null) => Promise<void>;
  addMessage: (message: ChatMessage) => void;
  syncMessage: (message: ChatMessage) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => void;
  deleteConversation: (id: string) => void;

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
      conversationsLoaded: false,
      isLoading: false,
      lastFeedback: null,
      suggestion: null,
      followups: [],

      setApiKey: (key) => set({ apiKey: key, isConfigured: key.length > 0 }),
      setLoading: (loading) => set({ isLoading: loading }),
      setLastFeedback: (feedback) => set({ lastFeedback: feedback }),
      setSuggestion: (suggestion) => set({ suggestion }),
      setFollowups: (followups) => set({ followups }),

      // ── Load conversations from backend ─────────────────────────────────

      loadConversations: async () => {
        if (!getToken()) return;
        try {
          const { conversations: dbConvs } = await apiListChats();
          const convs: Conversation[] = dbConvs.map(c => ({
            id: c.id,
            title: c.title,
            messages: [], // Messages loaded on demand
            createdAt: new Date(c.createdAt).getTime(),
            updatedAt: new Date(c.updatedAt).getTime(),
          }));
          set({ conversations: convs, conversationsLoaded: true });
        } catch (err) {
          console.error('Failed to load conversations:', err);
        }
      },

      // ── Create new conversation ─────────────────────────────────────────

      newConversation: async () => {
        // Optimistic: create locally immediately
        const localId = createLocalId();
        const conv: Conversation = {
          id: localId,
          title: 'New conversation',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          conversations: [conv, ...state.conversations].slice(0, 50),
          activeConversationId: localId,
          followups: [],
        }));

        // Sync to backend
        if (getToken()) {
          try {
            const { conversation: dbConv } = await apiCreateChat();
            // Replace local ID with server ID
            set((state) => ({
              conversations: state.conversations.map(c =>
                c.id === localId ? { ...c, id: dbConv.id } : c
              ),
              activeConversationId: state.activeConversationId === localId ? dbConv.id : state.activeConversationId,
            }));
            return dbConv.id;
          } catch (err) {
            console.error('Failed to create conversation on server:', err);
          }
        }
        return localId;
      },

      // ── Switch active conversation (load messages from backend) ─────────

      setActiveConversation: async (id) => {
        set({ activeConversationId: id, followups: [] });
        if (!id || !getToken()) return;

        // Load messages if not already loaded
        const conv = get().conversations.find(c => c.id === id);
        if (conv && conv.messages.length === 0) {
          try {
            const { conversation: dbConv } = await apiGetChat(id);
            if (dbConv.messages) {
              const messages: ChatMessage[] = dbConv.messages.map(m => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
                timestamp: new Date(m.createdAt).getTime(),
              }));
              set((state) => ({
                conversations: state.conversations.map(c =>
                  c.id === id ? { ...c, messages, title: dbConv.title } : c
                ),
              }));
            }
          } catch (err) {
            console.error('Failed to load conversation messages:', err);
          }
        }
      },

      // ── Add message locally (instant) ───────────────────────────────────

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

      // ── Sync message to backend (fire-and-forget) ──────────────────────

      syncMessage: async (message) => {
        const convId = get().activeConversationId;
        if (!convId || !getToken()) return;
        try {
          await apiAddChatMessage(convId, {
            role: message.role,
            content: message.content,
            hasImage: !!message.image,
          });
        } catch (err) {
          console.error('Failed to sync message:', err);
        }
      },

      // ── Update title ────────────────────────────────────────────────────

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map(c =>
            c.id === id ? { ...c, title } : c
          ),
        }));
        // Sync to backend
        if (getToken()) {
          apiUpdateChatTitle(id, title).catch(err =>
            console.error('Failed to update title:', err)
          );
        }
      },

      // ── Delete conversation ─────────────────────────────────────────────

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter(c => c.id !== id),
          activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
          followups: state.activeConversationId === id ? [] : state.followups,
        }));
        // Sync to backend
        if (getToken()) {
          apiDeleteChat(id).catch(err =>
            console.error('Failed to delete conversation:', err)
          );
        }
      },

      // ── Getters ─────────────────────────────────────────────────────────

      getActiveConversation: () => {
        const state = get();
        return state.conversations.find(c => c.id === state.activeConversationId);
      },

      getActiveMessages: () => {
        const state = get();
        const conv = state.conversations.find(c => c.id === state.activeConversationId);
        return conv?.messages ?? [];
      },
    }),
    {
      name: 'drum-tutor-ai',
      partialize: (state) => ({
        apiKey: state.apiKey,
        isConfigured: state.isConfigured,
        // Don't persist conversations to localStorage — they come from the backend
      }),
    }
  )
);

// Register so storeUtils can rehydrate on user switch
registerStore('drum-tutor-ai', useAiStore as any);
