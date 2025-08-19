-- Migration to add artifacts table for zero280 chat artifacts
-- This table will store various types of artifacts that can be created, edited, and saved

-- Create artifacts table
CREATE TABLE IF NOT EXISTS artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('html', 'component', 'react', 'jsx', 'interactive', 'simulation', 'quiz', 'mindmap', 'skill-atom', 'drill', 'progress', 'welcome')),
  content TEXT NOT NULL,
  description TEXT,
  preview TEXT,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artifacts_user_id ON artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_conversation_id ON artifacts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_project_id ON artifacts(project_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts(type);
CREATE INDEX IF NOT EXISTS idx_artifacts_created_at ON artifacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artifacts_updated_at ON artifacts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_artifacts_tags ON artifacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_artifacts_metadata ON artifacts USING GIN(metadata);

-- Enable Row Level Security
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artifacts
CREATE POLICY "Users can view their own artifacts" ON artifacts
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert their own artifacts" ON artifacts
  FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can update their own artifacts" ON artifacts
  FOR UPDATE USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can delete their own artifacts" ON artifacts
  FOR DELETE USING (user_id IS NULL OR user_id = auth.uid());

-- Trigger to automatically update updated_at
CREATE TRIGGER update_artifacts_updated_at 
  BEFORE UPDATE ON artifacts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON artifacts TO anon, authenticated;

-- Insert some sample artifacts for testing (optional)
-- INSERT INTO artifacts (name, type, content, description, preview, metadata) VALUES 
--   ('Sample HTML Component', 'html', '<div>Hello World</div>', 'A simple HTML component', 'Hello World', '{"category": "ui", "framework": "vanilla"}'),
--   ('Sample React Component', 'react', 'function MyComponent() { return <div>Hello React</div>; }', 'A simple React component', 'Hello React', '{"category": "ui", "framework": "react"}');
