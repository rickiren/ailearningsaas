import { supabase, type Conversation, type Message, type ConversationInsert, type MessageInsert } from './supabase'
import { v4 as uuidv4 } from 'uuid'

export class ConversationStore {
  // Create a new conversation
  static async createConversation(title: string, userId?: string): Promise<Conversation> {
    const conversation: ConversationInsert = {
      id: uuidv4(),
      title,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert(conversation)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`)
    }

    return data
  }

  // Get conversation by ID
  static async getConversation(id: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select()
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get conversation: ${error.message}`)
    }

    return data
  }

  // Get all conversations for a user
  static async getConversations(userId?: string): Promise<Conversation[]> {
    let query = supabase
      .from('conversations')
      .select()
      .order('updated_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get conversations: ${error.message}`)
    }

    return data || []
  }

  // Update conversation title
  static async updateConversationTitle(id: string, title: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ 
        title, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to update conversation: ${error.message}`)
    }
  }

  // Update conversation metadata
  static async updateConversationMetadata(id: string, metadata: any): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ 
        metadata,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to update conversation: ${error.message}`)
    }
  }

  // Link conversation to a project (mindmap)
  static async linkConversationToProject(conversationId: string, projectId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ 
        project_id: projectId,
        updated_at: new Date().toISOString() 
      })
      .eq('id', conversationId)

    if (error) {
      throw new Error(`Failed to link conversation to project: ${error.message}`)
    }
  }

  // Get conversations by project ID
  static async getConversationsByProject(projectId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from('conversations')
      .select()
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get conversations by project: ${error.message}`)
    }

    return data || []
  }

  // Get the current active project for a conversation
  static async getConversationProject(conversationId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('project_id')
      .eq('id', conversationId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get conversation project: ${error.message}`)
    }

    return data?.project_id || null
  }

  // Delete conversation and all messages
  static async deleteConversation(id: string): Promise<void> {
    // Delete messages first
    const { error: messagesError } = await supabase
      .from('messages')
      .delete()
      .eq('conversation_id', id)

    if (messagesError) {
      throw new Error(`Failed to delete messages: ${messagesError.message}`)
    }

    // Delete conversation
    const { error: conversationError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id)

    if (conversationError) {
      throw new Error(`Failed to delete conversation: ${conversationError.message}`)
    }
  }

  // Add message to conversation
  static async addMessage(message: Omit<MessageInsert, 'id' | 'created_at'>): Promise<Message> {
    const newMessage: MessageInsert = {
      ...message,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(newMessage)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to add message: ${error.message}`)
    }

    // Update conversation updated_at timestamp
    await this.updateConversationTitle(message.conversation_id, '') // This will update the timestamp

    return data
  }

  // Get messages for a conversation (with pagination)
  static async getMessages(
    conversationId: string, 
    limit: number = 30, 
    offset: number = 0
  ): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select()
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to get messages: ${error.message}`)
    }

    return data || []
  }

  // Get recent messages for context (last N messages)
  static async getRecentMessages(conversationId: string, count: number = 20): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select()
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(count)

    if (error) {
      throw new Error(`Failed to get recent messages: ${error.message}`)
    }

    // Return in chronological order
    return (data || []).reverse()
  }

  // Generate conversation title from first message
  static generateTitle(firstMessage: string): string {
    // Extract first sentence or first 50 characters
    const firstSentence = firstMessage.split(/[.!?]/)[0].trim()
    if (firstSentence.length > 0 && firstSentence.length <= 50) {
      return firstSentence
    }
    
    // Fallback to truncated first message
    return firstMessage.length > 50 
      ? firstMessage.substring(0, 50) + '...'
      : firstMessage
  }

  // Get conversation summary for long chats
  static async getConversationSummary(conversationId: string): Promise<string> {
    const messages = await this.getMessages(conversationId, 100)
    
    if (messages.length <= 20) {
      return messages.map(m => m.content).join('\n')
    }

    // For long conversations, summarize the key points
    const userMessages = messages.filter(m => m.role === 'user')
    const assistantMessages = messages.filter(m => m.role === 'assistant')
    
    const summary = `Conversation with ${userMessages.length} user messages and ${assistantMessages.length} AI responses. ` +
                   `Key topics: ${userMessages.slice(0, 3).map(m => m.content.substring(0, 30)).join(', ')}...`
    
    return summary
  }
}
