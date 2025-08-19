import { useState, useEffect, useCallback } from 'react';
import { ChatService } from './chat-service';
import { type Conversation, type Message, type Artifact } from './supabase';

interface UseChatConversationOptions {
  conversationId?: string;
  userId?: string;
  autoLoad?: boolean;
}

interface UseChatConversationReturn {
  conversation: Conversation | null;
  messages: Message[];
  artifacts: Artifact[];
  loading: boolean;
  error: string | null;
  createNewConversation: (initialMessage: string) => Promise<string | null>;
  sendMessage: (content: string) => Promise<Message | null>;
  loadConversation: (id: string) => Promise<void>;
  refreshConversation: () => Promise<void>;
}

export function useChatConversation(options: UseChatConversationOptions = {}): UseChatConversationReturn {
  const { conversationId, userId, autoLoad = true } = options;
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConversation = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { conversation: conv, messages: msgs } = await ChatService.getConversationWithMessages(id);
      const arts = await ChatService.getConversationArtifacts(id);
      
      setConversation(conv);
      setMessages(msgs);
      setArtifacts(arts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewConversation = useCallback(async (initialMessage: string): Promise<string | null> => {
    try {
      const chatSession = await ChatService.createChatSession(initialMessage, userId);
      
      if (chatSession.conversation) {
        setConversation(chatSession.conversation);
        setMessages(chatSession.message ? [chatSession.message] : []);
        setArtifacts([]);
        return chatSession.conversation.id;
      }
      
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
      return null;
    }
  }, [userId]);

  const sendMessage = useCallback(async (content: string): Promise<Message | null> => {
    if (!conversation) {
      setError('No active conversation');
      return null;
    }

    try {
      // Add user message to local state immediately
      const userMessage: Message = {
        id: `temp_${Date.now()}`,
        conversation_id: conversation.id,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
        metadata: {
          type: 'user_message',
          timestamp: new Date().toISOString()
        }
      };

      setMessages(prev => [...prev, userMessage]);

      // Send to API
      const response = await fetch('/api/zero280', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationId: conversation.id,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add AI response to local state
      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        conversation_id: conversation.id,
        role: 'assistant',
        content: data.response,
        created_at: new Date().toISOString(),
        metadata: {
          type: 'ai_response',
          artifacts_created: data.artifacts?.length || 0,
          timestamp: new Date().toISOString()
        }
      };

      setMessages(prev => [...prev, aiMessage]);

      // Update artifacts if any were created
      if (data.artifacts && data.artifacts.length > 0) {
        setArtifacts(prev => [...prev, ...data.artifacts]);
      }

      return aiMessage;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return null;
    }
  }, [conversation, userId]);

  const refreshConversation = useCallback(async () => {
    if (conversation) {
      await loadConversation(conversation.id);
    }
  }, [conversation, loadConversation]);

  // Auto-load conversation when conversationId changes
  useEffect(() => {
    if (autoLoad && conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId, autoLoad, loadConversation]);

  return {
    conversation,
    messages,
    artifacts,
    loading,
    error,
    createNewConversation,
    sendMessage,
    loadConversation,
    refreshConversation,
  };
}
