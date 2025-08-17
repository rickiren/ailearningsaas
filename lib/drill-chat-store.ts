import { create } from 'zustand';
import { ConversationStore } from './conversation-store';
import { DrillChatMessage } from '@/types/drills';
import { Message } from '@/types/chat';

interface DrillChatState {
  messages: DrillChatMessage[];
  currentConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentConversation: (conversationId: string | null) => void;
  loadConversation: (conversationId: string) => Promise<void>;
  createNewConversation: (drillId?: string) => Promise<string>;
  addMessage: (message: Omit<DrillChatMessage, 'id' | 'timestamp'>) => Promise<string>;
  updateMessage: (messageId: string, updates: Partial<DrillChatMessage>) => void;
  setMessages: (messages: DrillChatMessage[]) => void;
  loadConversations: () => Promise<{ id: string; title: string; drillId?: string }[]>;
  deleteConversation: (conversationId: string) => Promise<void>;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDrillChatStore = create<DrillChatState>((set, get) => ({
  messages: [],
  currentConversationId: null,
  isLoading: false,
  error: null,

  setCurrentConversation: (conversationId) => {
    set({ currentConversationId: conversationId });
  },

  loadConversation: async (conversationId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Load conversation details
      const conversation = await ConversationStore.getConversation(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Load recent messages (last 30 for context)
      const messages = await ConversationStore.getRecentMessages(conversationId, 30);
      
      // Convert to DrillChatMessage format
      const drillMessages: DrillChatMessage[] = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role === 'system' ? 'assistant' : msg.role,
        timestamp: new Date(msg.created_at),
        drillId: msg.metadata?.drillId,
      }));

      set({
        messages: drillMessages,
        currentConversationId: conversationId,
      });
    } catch (error) {
      console.error('Error loading conversation:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load conversation',
        messages: [] // Ensure messages is always an array
      });
    } finally {
      set({ isLoading: false });
    }
  },

  createNewConversation: async (drillId?: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Create new conversation with drill-specific title
      const title = drillId ? `Drill Creation - ${drillId}` : 'New Drill Creation Session';
      const conversation = await ConversationStore.createConversation(title);
      
      // If this is drill-specific, update the metadata
      if (drillId) {
        await ConversationStore.updateConversationMetadata(conversation.id, { drillId });
      }
      
      // Clear current messages and set new conversation
      set({
        messages: [],
        currentConversationId: conversation.id,
      });

      return conversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create conversation',
        messages: [] // Ensure messages is always an array
      });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  addMessage: async (messageData) => {
    try {
      const conversationId = get().currentConversationId;
      if (!conversationId) {
        throw new Error('No active conversation');
      }

      const message: Omit<Message, 'id' | 'created_at'> = {
        conversation_id: conversationId,
        role: messageData.role === 'assistant' ? 'assistant' : 'user',
        content: messageData.content,
        metadata: {
          drillId: messageData.drillId,
          type: 'drill_chat',
        },
      };

      // Store message in Supabase
      const storedMessage = await ConversationStore.addMessage(message);
      
      // Add to local state
      const drillMessage: DrillChatMessage = {
        id: storedMessage.id,
        content: messageData.content,
        role: messageData.role,
        timestamp: new Date(storedMessage.created_at),
        drillId: messageData.drillId,
      };

      set((state) => ({
        messages: [...(state.messages || []), drillMessage],
      }));

      return storedMessage.id;
    } catch (error) {
      console.error('Error adding message:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to add message' });
      throw error;
    }
  },

  // Update a specific message (for streaming updates)
  updateMessage: (messageId: string, updates: Partial<DrillChatMessage>) => {
    set((state) => ({
      messages: (state.messages || []).map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ),
    }));
  },

  // Set messages directly (for temporary updates during streaming)
  setMessages: (messages: DrillChatMessage[]) => {
    set({ messages: messages || [] });
  },

  loadConversations: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const conversations = await ConversationStore.getConversations();
      
      // Filter and format drill-related conversations
      const drillConversations = conversations
        .filter(conv => conv.metadata?.type === 'drill_chat' || conv.title.includes('Drill'))
        .map(conv => ({
          id: conv.id,
          title: conv.title,
          drillId: conv.metadata?.drillId,
        }));
      
      return drillConversations;
    } catch (error) {
      console.error('Error loading conversations:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to load conversations' });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  deleteConversation: async (conversationId: string) => {
    try {
      set({ isLoading: true, error: null });
      await ConversationStore.deleteConversation(conversationId);
      set((state) => ({
        currentConversationId:
          state.currentConversationId === conversationId ? null : state.currentConversationId,
      }));
    } catch (error) {
      console.error('Error deleting conversation:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to delete conversation' });
    } finally {
      set({ isLoading: false });
    }
  },

  clearMessages: () => set({ 
    messages: [], 
    error: null, 
    currentConversationId: null 
  }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));
