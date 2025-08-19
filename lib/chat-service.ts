import { supabase, type Conversation, type ConversationInsert, type Message, type MessageInsert, type Artifact, type ArtifactInsert } from './supabase';

export class ChatService {
  /**
   * Create a new conversation for building an artifact
   */
  static async createBuildConversation(title: string, userId?: string): Promise<Conversation | null> {
    try {
      const conversation: ConversationInsert = {
        title: title,
        user_id: userId,
        metadata: {
          type: 'build',
          purpose: 'artifact_creation',
          created_at: new Date().toISOString()
        }
      };

      const { data, error } = await supabase
        .from('conversations')
        .insert(conversation)
        .select()
        .single();

      if (error) {
        console.error('Error creating build conversation:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating build conversation:', error);
      return null;
    }
  }

  /**
   * Get a conversation by ID with its messages
   */
  static async getConversationWithMessages(conversationId: string): Promise<{
    conversation: Conversation | null;
    messages: Message[];
  }> {
    try {
      // Get conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('Error fetching conversation:', convError);
        return { conversation: null, messages: [] };
      }

      // Get messages
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('Error fetching messages:', msgError);
        return { conversation, messages: [] };
      }

      return { conversation, messages: messages || [] };
    } catch (error) {
      console.error('Error fetching conversation with messages:', error);
      return { conversation: null, messages: [] };
    }
  }

  /**
   * Add a message to a conversation
   */
  static async addMessage(conversationId: string, message: Omit<MessageInsert, 'conversation_id'>): Promise<Message | null> {
    try {
      const messageData: MessageInsert = {
        ...message,
        conversation_id: conversationId
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error('Error adding message:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }

  /**
   * Create an artifact and link it to a conversation
   */
  static async createArtifactFromChat(
    conversationId: string, 
    artifactData: Omit<ArtifactInsert, 'conversation_id'>,
    userId?: string
  ): Promise<Artifact | null> {
    try {
      const artifact: ArtifactInsert = {
        ...artifactData,
        conversation_id: conversationId,
        user_id: userId,
        metadata: {
          ...artifactData.metadata,
          source: 'chat',
          conversation_id: conversationId,
          created_at: new Date().toISOString()
        }
      };

      const { data, error } = await supabase
        .from('artifacts')
        .insert(artifact)
        .select()
        .single();

      if (error) {
        console.error('Error creating artifact from chat:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating artifact from chat:', error);
      return null;
    }
  }

  /**
   * Get all artifacts for a conversation
   */
  static async getConversationArtifacts(conversationId: string): Promise<Artifact[]> {
    try {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversation artifacts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching conversation artifacts:', error);
      return [];
    }
  }

  /**
   * Get user's build conversations
   */
  static async getUserBuildConversations(userId?: string): Promise<Conversation[]> {
    try {
      let query = supabase
        .from('conversations')
        .select('*')
        .eq('metadata->>type', 'build')
        .order('updated_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching build conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching build conversations:', error);
      return [];
    }
  }

  /**
   * Update conversation metadata
   */
  static async updateConversationMetadata(
    conversationId: string, 
    metadata: any
  ): Promise<Conversation | null> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .update({ metadata })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) {
        console.error('Error updating conversation metadata:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error updating conversation metadata:', error);
      return null;
    }
  }

  /**
   * Get conversation summary for AI context
   */
  static async getConversationSummary(conversationId: string): Promise<string> {
    try {
      const { conversation, messages } = await this.getConversationWithMessages(conversationId);
      
      if (!conversation || messages.length === 0) {
        return 'No conversation history available.';
      }

      const recentMessages = messages.slice(-10); // Last 10 messages for context
      const artifacts = await this.getConversationArtifacts(conversationId);

      let summary = `Conversation: ${conversation.title}\n\n`;
      summary += `Recent messages:\n`;
      
      recentMessages.forEach(msg => {
        const role = msg.role === 'user' ? 'User' : 'AI';
        const time = new Date(msg.created_at).toLocaleTimeString();
        summary += `[${time}] ${role}: ${msg.content}\n`;
      });

      if (artifacts.length > 0) {
        summary += `\nArtifacts created in this conversation:\n`;
        artifacts.forEach(artifact => {
          summary += `- ${artifact.name} (${artifact.type}): ${artifact.description}\n`;
        });
      }

      return summary;
    } catch (error) {
      console.error('Error getting conversation summary:', error);
      return 'Error retrieving conversation history.';
    }
  }

  /**
   * Create a complete chat session with initial message
   */
  static async createChatSession(
    initialMessage: string,
    userId?: string
  ): Promise<{
    conversation: Conversation | null;
    message: Message | null;
  }> {
    try {
      // Create conversation
      const conversation = await this.createBuildConversation(
        `Build: ${initialMessage.substring(0, 50)}...`,
        userId
      );

      if (!conversation) {
        return { conversation: null, message: null };
      }

      // Add initial user message
      const message = await this.addMessage(conversation.id, {
        role: 'user',
        content: initialMessage,
        metadata: {
          type: 'initial_request',
          timestamp: new Date().toISOString()
        }
      });

      return { conversation, message };
    } catch (error) {
      console.error('Error creating chat session:', error);
      return { conversation: null, message: null };
    }
  }
}
