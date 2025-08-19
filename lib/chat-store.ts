import { create } from 'zustand';
import { Message } from '@/types/chat';

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  streamingMessageId: string | null;
  streamingJson: any;
  currentConversationId: string | null;
  streamingToolResults: any[];
  streamingToolStatus: any;
  
  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string | null;
  updateStreamingMessage: (messageId: string, content: string) => void;
  finishStreamingMessage: (messageId: string) => void;
  updateMessageMetadata: (messageId: string, metadata: any) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setCurrentConversationId: (id: string | null) => void;
  setStreamingJson: (json: any) => void;
  addStreamingToolResult: (result: any) => void;
  setStreamingToolStatus: (status: any) => void;
  clearStreamingToolData: () => void;
  createNewConversation: () => Promise<string>;
  refreshConversations: (newConversationId?: string) => Promise<void>;
  
  // Context management
  getContextForRouting: () => any;
  updateConversationContext: (updates: any) => void;
  updateContextForEditing: (action: string, currentMindmap: any) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  streamingMessageId: null,
  streamingJson: null,
  currentConversationId: null,
  streamingToolResults: [],
  streamingToolStatus: null,
  
  addMessage: (message) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newMessage: Message = {
      ...message,
      id,
      timestamp: new Date(),
    };
    
    set((state) => ({
      messages: [...state.messages, newMessage],
      streamingMessageId: message.role === 'assistant' ? id : state.streamingMessageId,
    }));
    
    return id;
  },
  
  updateStreamingMessage: (messageId, content) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, content } : msg
      ),
    }));
  },
  
  finishStreamingMessage: (messageId) => {
    set((state) => ({
      streamingMessageId: null,
      isLoading: false,
    }));
  },
  
  updateMessageMetadata: (messageId, metadata) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId ? { ...msg, metadata } : msg
      ),
    }));
  },
  
  clearMessages: () => {
    set({ messages: [], streamingMessageId: null, streamingJson: null });
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  
  setCurrentConversationId: (id) => {
    set({ currentConversationId: id });
  },
  
  setStreamingJson: (json) => {
    set({ streamingJson: json });
  },
  
  addStreamingToolResult: (result) => {
    set((state) => ({
      streamingToolResults: [...state.streamingToolResults, result]
    }));
  },
  
  setStreamingToolStatus: (status) => {
    set({ streamingToolStatus: status });
  },
  
  clearStreamingToolData: () => {
    set({ streamingToolResults: [], streamingToolStatus: null });
  },
  
  createNewConversation: async () => {
    try {
      set({ isLoading: true });
      
      // Create new conversation with placeholder title
      const { ConversationStore } = await import('./conversation-store');
      const conversation = await ConversationStore.createConversation('New Conversation');
      
      // Clear current messages and set new conversation
      set({
        messages: [],
        currentConversationId: conversation.id,
      });

      return conversation.id;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  refreshConversations: async (newConversationId?: string) => {
    try {
      // If a new conversation ID was provided, set it as current
      if (newConversationId) {
        set({ currentConversationId: newConversationId });
      }
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
    }
  },
  
  getContextForRouting: () => {
    const state = get();
    return {
      hasActiveProject: !!state.streamingJson,
      currentMindmap: state.streamingJson?.data || null,
      conversationPhase: state.streamingJson ? 'editing' : 'creation',
      lastIntent: null,
      lastAction: null,
    };
  },
  
  updateConversationContext: (updates) => {
    // This is a placeholder - in a real implementation you might want to store context
    console.log('Context updated:', updates);
  },
  
  updateContextForEditing: (action, currentMindmap) => {
    // This is a placeholder - in a real implementation you might want to store context
    console.log('Editing context updated:', { action, currentMindmap });
  },
}));