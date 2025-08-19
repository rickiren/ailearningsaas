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
          project_id?: string
          metadata?: any
        }
        Insert: {
          id?: string
          title: string
          created_at?: string
          updated_at?: string
          user_id?: string
          project_id?: string
          metadata?: any
        }
        Update: {
          id?: string
          title?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          project_id?: string
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
      projects: {
        Row: {
          id: string
          title: string
          description?: string
          created_at: string
          updated_at: string
          metadata?: any
        }
        Insert: {
          id?: string
          title: string
          description?: string
          created_at?: string
          updated_at?: string
          metadata?: any
        }
        Update: {
          id?: string
          title?: string
          description?: string
          created_at?: string
          updated_at?: string
          metadata?: any
        }
      }
      skill_atoms: {
        Row: {
          id: string
          project_id: string
          parent_id?: string
          title: string
          description?: string
          level: number
          order_index: number
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_hours?: number
          prerequisites?: string[]
          skills?: string[]
          position_x?: number
          position_y?: number
          node_data?: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          parent_id?: string
          title: string
          description?: string
          level?: number
          order_index?: number
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_hours?: number
          prerequisites?: string[]
          skills?: string[]
          position_x?: number
          position_y?: number
          node_data?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          parent_id?: string
          title?: string
          description?: string
          level?: number
          order_index?: number
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_hours?: number
          prerequisites?: string[]
          skills?: string[]
          position_x?: number
          position_y?: number
          node_data?: any
          created_at?: string
          updated_at?: string
        }
      }
      drills: {
        Row: {
          id: string
          title: string
          description?: string
          type: 'html' | 'jsx' | 'interactive' | 'simulation' | 'quiz'
          skill_name: string
          learning_objectives: string[]
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          estimated_time: number
          code: string
          project_id?: string
          skill_atom_ids: string[]
          tags: string[]
          version: number
          is_active: boolean
          created_at: string
          updated_at: string
          user_id?: string
          metadata?: any
        }
        Insert: {
          id?: string
          title: string
          description?: string
          type: 'html' | 'jsx' | 'interactive' | 'simulation' | 'quiz'
          skill_name: string
          learning_objectives: string[]
          difficulty: 'beginner' | 'intermediate' | 'advanced'
          estimated_time?: number
          code: string
          project_id?: string
          skill_atom_ids?: string[]
          tags?: string[]
          version?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          user_id?: string
          metadata?: any
        }
        Update: {
          id?: string
          title?: string
          description?: string
          type?: 'html' | 'jsx' | 'interactive' | 'simulation' | 'quiz'
          skill_name?: string
          learning_objectives?: string[]
          difficulty?: 'beginner' | 'intermediate' | 'advanced'
          estimated_time?: number
          code?: string
          project_id?: string
          skill_atom_ids?: string[]
          tags?: string[]
          version?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          user_id?: string
          metadata?: any
        }
      }
    }
  }
}

export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type SkillAtom = Database['public']['Tables']['skill_atoms']['Row']
export type SkillAtomInsert = Database['public']['Tables']['skill_atoms']['Insert']
export type Drill = Database['public']['Tables']['drills']['Row']
export type DrillInsert = Database['public']['Tables']['drills']['Insert']
export type DrillUpdate = Database['public']['Tables']['drills']['Update']
