export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  conversation_id?: string;
  metadata?: any;
  artifact_data?: any;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  project_id?: string;
  metadata?: any;
}

export interface ChatState {
  messages: Message[];
  currentConversationId: string | null;
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string | null;
  setCurrentConversation: (conversationId: string | null) => void;
  loadConversation: (conversationId: string) => Promise<void>;
  createNewConversation: () => Promise<string>;
  loadConversations: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  message: string;
  conversation_id: string;
  error?: string;
}