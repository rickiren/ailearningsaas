import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          title: string
          created_at: string
          updated_at: string
          user_id?: string
          metadata?: any
        }
        Insert: {
          id?: string
          title: string
          created_at?: string
          updated_at?: string
          user_id?: string
          metadata?: any
        }
        Update: {
          id?: string
          title?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          metadata?: any
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          created_at: string
          metadata?: any
          artifact_data?: any
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          created_at?: string
          metadata?: any
          artifact_data?: any
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          created_at?: string
          metadata?: any
          artifact_data?: any
        }
      }
    }
  }
}

export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
