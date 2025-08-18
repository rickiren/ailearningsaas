import { create } from 'zustand';
import { ChatState, Message, Conversation } from '@/types/chat';
import { processAIMessage, validateMindMapData } from './utils';
import { ConversationStore } from './conversation-store';

interface StreamingJsonData {
  type: string;
  data: Record<string, unknown>;
  title: string;
  isComplete: boolean;
}

interface ExtendedChatState extends ChatState {
  streamingMessageId: string | null;
  streamingJson: StreamingJsonData | null;
  updateStreamingMessage: (id: string, content: string) => void;
  finishStreamingMessage: (id: string) => void;
  setStreamingJson: (data: StreamingJsonData | null) => void;
  setCurrentConversation: (conversationId: string | null) => void;
  loadConversation: (conversationId: string) => Promise<void>;
  createNewConversation: () => Promise<string>;
  loadConversations: () => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  refreshConversations: (newConversationId?: string) => Promise<void>;
}

export const useChatStore = create<ExtendedChatState>((set, get) => ({
  messages: [],
  currentConversationId: null,
  conversations: [],
  isLoading: false,
  error: null,
  streamingMessageId: null,
  streamingJson: null,

  addMessage: (messageData) => {
    // Don't add messages if no conversation is selected
    if (!get().currentConversationId) {
      console.warn('Cannot add message: no conversation selected');
      return null;
    }

    const message: Message = {
      ...messageData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      conversation_id: get().currentConversationId || undefined,
    };
    
    set((state) => ({
      messages: [...state.messages, message],
      streamingMessageId: messageData.role === 'assistant' && !messageData.content 
        ? message.id 
        : state.streamingMessageId,
    }));

    // Check for mindmap JSON in assistant messages
    if (messageData.role === 'assistant' && messageData.content) {
      const { jsonData } = processAIMessage(messageData.content);
      if (jsonData && jsonData.type === 'mindmap' && validateMindMapData(jsonData.data)) {
        // Dispatch a custom event to notify the artifact store
        const event = new CustomEvent('mindmap-detected', {
          detail: {
            type: 'mindmap',
            title: jsonData.data.title || 'Learning Path',
            data: jsonData.data,
          }
        });
        window.dispatchEvent(event);
      }
    }

    return message.id;
  },

  updateStreamingMessage: (id, content) => {
    // Process the message to separate conversational text from JSON
    const { displayContent, jsonData } = processAIMessage(content);
    
    // Update the message with clean display content (without JSON)
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id
          ? { ...msg, content: displayContent }
          : msg
      ),
    }));

    // Handle streaming JSON separately
    if (jsonData && jsonData.type === 'mindmap' && validateMindMapData(jsonData.data)) {
      set((state) => ({
        ...state,
        streamingJson: {
          type: jsonData.type,
          data: jsonData.data,
          title: (jsonData.data.title as string) || 'Learning Path',
          isComplete: false,
        }
      }));
    }
  },

  finishStreamingMessage: (id) => {
    set((state) => ({ 
      ...state,
      streamingMessageId: null, 
      isLoading: false,
      streamingJson: state.streamingJson ? {
        ...state.streamingJson,
        isComplete: true
      } : null
    }));
  },

  setStreamingJson: (data) => {
    set({ streamingJson: data });
  },

  setCurrentConversation: (conversationId) => {
    set({ currentConversationId: conversationId });
  },

  // Refresh conversations list and optionally set a new conversation
  refreshConversations: async (newConversationId?: string) => {
    try {
      const conversations = await ConversationStore.getConversations();
      
      // Filter out drill-related conversations
      const learningPathConversations = conversations.filter(conv => {
        if (conv.metadata?.type === 'drill_chat') {
          return false;
        }
        if (conv.metadata?.drillId) {
          return false;
        }
        const title = conv.title.toLowerCase();
        const drillKeywords = ['drill', 'exercise', 'practice', 'quiz', 'test'];
        if (drillKeywords.some(keyword => title.includes(keyword))) {
          return false;
        }
        return true;
      });
      
      set({ conversations: learningPathConversations });
      
      // If a new conversation ID was provided, set it as current
      if (newConversationId) {
        set({ currentConversationId: newConversationId });
      }
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
    }
  },

  loadConversation: async (conversationId: string) => {
    try {
      set({ isLoading: true, error: null });
      
      // Load conversation details
      const conversation = await ConversationStore.getConversation(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Prevent loading drill-related conversations in the main chat interface
      // Use the same robust filtering logic as loadConversations
      if (conversation.metadata?.type === 'drill_chat') {
        throw new Error('Cannot load drill conversations in the main chat interface');
      }
      
      if (conversation.metadata?.drillId) {
        throw new Error('Cannot load drill conversations in the main chat interface');
      }
      
      const title = conversation.title.toLowerCase();
      const drillKeywords = ['drill', 'exercise', 'practice', 'quiz', 'test'];
      if (drillKeywords.some(keyword => title.includes(keyword))) {
        throw new Error('Cannot load drill conversations in the main chat interface');
      }

      // Load recent messages (last 30 for context)
      const messages = await ConversationStore.getRecentMessages(conversationId, 30);
      
      // Convert to local Message format
      const localMessages: Message[] = messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.created_at),
        conversation_id: msg.conversation_id,
        metadata: msg.metadata,
        artifact_data: msg.artifact_data,
      }));

      set({
        messages: localMessages,
        currentConversationId: conversationId,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load conversation' });
    } finally {
      set({ isLoading: false });
    }
  },

  createNewConversation: async () => {
    try {
      set({ isLoading: true, error: null });
      
      // Create new conversation with placeholder title
      const conversation = await ConversationStore.createConversation('New Conversation');
      
      // Clear current messages and set new conversation
      set({
        messages: [],
        currentConversationId: conversation.id,
      });

      // Refresh the conversations list to include the new one
      await get().loadConversations();

      return conversation.id;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create conversation' });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadConversations: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const conversations = await ConversationStore.getConversations();
      
      // Filter out drill-related conversations to keep them separate
      // More robust filtering that checks both metadata and title
      const learningPathConversations = conversations.filter(conv => {
        // Check if conversation is explicitly marked as drill chat
        if (conv.metadata?.type === 'drill_chat') {
          return false;
        }
        
        // Check if conversation has drill-related metadata
        if (conv.metadata?.drillId) {
          return false;
        }
        
        // Check if title contains drill-related keywords (case-insensitive)
        const title = conv.title.toLowerCase();
        const drillKeywords = ['drill', 'exercise', 'practice', 'quiz', 'test'];
        if (drillKeywords.some(keyword => title.includes(keyword))) {
          return false;
        }
        
        return true;
      });
      
      set({ conversations: learningPathConversations });

      // Auto-select the first conversation if none is currently selected and conversations exist
      if (!get().currentConversationId && learningPathConversations.length > 0) {
        const firstConversation = learningPathConversations[0];
        set({ currentConversationId: firstConversation.id });
        
        // Load the first conversation's messages
        try {
          const messages = await ConversationStore.getRecentMessages(firstConversation.id, 30);
          const localMessages: Message[] = messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            role: msg.role,
            timestamp: new Date(msg.created_at),
            conversation_id: firstConversation.id, // Use the current conversation ID
            metadata: msg.metadata,
            artifact_data: msg.artifact_data,
          }));
          
          set({ messages: localMessages });
        } catch (error) {
          console.error('Failed to load first conversation messages:', error);
        }
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to load conversations' });
    } finally {
      set({ isLoading: false });
    }
  },

  deleteConversation: async (conversationId: string) => {
    try {
      set({ isLoading: true, error: null });
      await ConversationStore.deleteConversation(conversationId);
      set((state) => ({
        conversations: state.conversations.filter(
          (conversation) => conversation.id !== conversationId
        ),
        currentConversationId:
          state.currentConversationId === conversationId ? null : state.currentConversationId,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete conversation' });
    } finally {
      set({ isLoading: false });
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearMessages: () => set({ 
    messages: [], 
    error: null, 
    streamingMessageId: null, 
    streamingJson: null,
    currentConversationId: null 
  }),
}));