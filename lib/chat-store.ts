import { create } from 'zustand';
import { ChatState, Message } from '@/types/chat';

interface ExtendedChatState extends ChatState {
  streamingMessageId: string | null;
  updateStreamingMessage: (id: string, content: string) => void;
  finishStreamingMessage: (id: string) => void;
}

export const useChatStore = create<ExtendedChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  streamingMessageId: null,

  addMessage: (messageData) => {
    const message: Message = {
      ...messageData,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    
    set((state) => ({
      messages: [...state.messages, message],
      streamingMessageId: messageData.role === 'assistant' && !messageData.content 
        ? message.id 
        : state.streamingMessageId,
    }));

    return message.id;
  },

  updateStreamingMessage: (id, content) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id
          ? { ...msg, content }
          : msg
      ),
    }));
  },

  finishStreamingMessage: (id) => {
    set({ streamingMessageId: null, isLoading: false });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearMessages: () => set({ messages: [], error: null, streamingMessageId: null }),
}));