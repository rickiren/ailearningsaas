import { create } from 'zustand';
import { ChatState, Message } from '@/types/chat';
import { parseMessageForJson, validateMindMapData } from './utils';

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

    // Check for mindmap JSON in assistant messages
    if (messageData.role === 'assistant' && messageData.content) {
      const jsonData = parseMessageForJson(messageData.content);
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
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id
          ? { ...msg, content }
          : msg
      ),
    }));

    // Check for mindmap JSON in streaming content
    if (content) {
      console.log('🔍 Checking streaming content for mindmap JSON...');
      console.log('Content length:', content.length);
      console.log('Content preview:', content.substring(0, 200) + '...');
      
      // Look for JSON blocks in the content
      const jsonMatches = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/g);
      console.log('🔍 Found JSON code blocks:', jsonMatches ? jsonMatches.length : 0);
      
      if (jsonMatches) {
        console.log('📋 JSON blocks found:');
        jsonMatches.forEach((match, index) => {
          console.log(`Block ${index + 1}:`, match.substring(0, 100) + '...');
        });
      }
      
      // Also check for JSON without code blocks
      const jsonRegex = /\{[\s\S]*?"type"\s*:\s*"mindmap"[\s\S]*?\}/;
      const rawJsonMatch = content.match(jsonRegex);
      console.log('🔍 Raw JSON match:', rawJsonMatch ? 'Found' : 'Not found');
      
      const jsonData = parseMessageForJson(content);
      console.log('📋 Parsed JSON data:', jsonData);
      
      if (jsonData && jsonData.type === 'mindmap' && validateMindMapData(jsonData.data)) {
        console.log('✅ Mindmap detected! Dispatching event...');
        // Dispatch a custom event to notify the artifact store
        const event = new CustomEvent('mindmap-streaming', {
          detail: {
            type: 'mindmap',
            title: jsonData.data.title || 'Learning Path',
            data: jsonData.data,
            isStreaming: true,
          }
        });
        window.dispatchEvent(event);
        console.log('🚀 Event dispatched:', event.detail);
      } else {
        console.log('❌ No valid mindmap found in this content');
        
        // Show the last part of content to see if JSON is there
        const lastPart = content.substring(Math.max(0, content.length - 500));
        console.log('🔍 Last 500 characters of content:', lastPart);
      }
    }
  },

  finishStreamingMessage: (id) => {
    set({ streamingMessageId: null, isLoading: false });
    
    // Dispatch event to mark streaming as finished
    const event = new CustomEvent('mindmap-streaming-finished');
    window.dispatchEvent(event);
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearMessages: () => set({ messages: [], error: null, streamingMessageId: null }),
}));