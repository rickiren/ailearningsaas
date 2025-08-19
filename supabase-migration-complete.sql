-- Complete Supabase Migration for AI Learning Path SaaS
-- This file creates all necessary tables for storing mindmaps, conversations, and messages

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  artifact_data JSONB DEFAULT '{}'::jsonb
);

-- Create projects table for mindmaps
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create skill_atoms table for mindmap nodes
CREATE TABLE IF NOT EXISTS skill_atoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES skill_atoms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours INTEGER,
  prerequisites TEXT[],
  skills TEXT[],
  position_x FLOAT,
  position_y FLOAT,
  node_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_skill_atoms_project_id ON skill_atoms(project_id);
CREATE INDEX IF NOT EXISTS idx_skill_atoms_parent_id ON skill_atoms(parent_id);
CREATE INDEX IF NOT EXISTS idx_skill_atoms_level ON skill_atoms(level);
CREATE INDEX IF NOT EXISTS idx_skill_atoms_order ON skill_atoms(project_id, parent_id, order_index);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_atoms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (user_id IS NULL OR user_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view messages from their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages from their conversations" ON messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations" ON messages
  FOR DELETE USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

-- RLS Policies for projects
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (user_id IS NULL OR user_id = auth.uid());

-- RLS Policies for skill_atoms
CREATE POLICY "Users can view skill atoms from their projects" ON skill_atoms
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert skill atoms to their projects" ON skill_atoms
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update skill atoms from their projects" ON skill_atoms
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete skill atoms from their projects" ON skill_atoms
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id IS NULL OR user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skill_atoms_updated_at 
  BEFORE UPDATE ON skill_atoms 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- INSERT INTO projects (title, description, metadata) VALUES 
--   ('Sample JavaScript Learning Path', 'A comprehensive path for learning JavaScript', '{"type": "mindmap", "totalNodes": 15, "estimatedTotalHours": 120}');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
