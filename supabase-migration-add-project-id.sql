-- Migration to add project_id column to conversations table
-- This links conversations to specific mindmap projects

-- Add project_id column to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON conversations(project_id);

-- Update existing conversations to link them to projects if they have mindmap data
-- This is a one-time migration to establish links for existing conversations
UPDATE conversations 
SET project_id = (
  SELECT p.id 
  FROM projects p 
  WHERE p.metadata->>'type' = 'mindmap' 
  AND p.title = conversations.title
  LIMIT 1
)
WHERE project_id IS NULL 
AND EXISTS (
  SELECT 1 
  FROM messages m 
  WHERE m.conversation_id = conversations.id 
  AND m.artifact_data->>'type' = 'mindmap'
);

-- Add comment to document the new column
COMMENT ON COLUMN conversations.project_id IS 'References the mindmap project this conversation is working with';
