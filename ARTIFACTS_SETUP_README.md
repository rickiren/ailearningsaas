# Artifacts Database Setup

This document explains how to set up and use the artifacts database system for storing and managing artifacts from the zero280 chat.

## Overview

The artifacts system provides a comprehensive database solution for storing, managing, and organizing various types of artifacts created during AI chat sessions. It includes:

- **Database Table**: Structured storage with proper indexing and relationships
- **API Routes**: RESTful endpoints for CRUD operations
- **Service Layer**: Business logic for artifact management
- **React Hook**: Custom hook for state management
- **UI Components**: Complete interface for artifact management

## Database Setup

### 1. Run the SQL Migration

Execute the SQL migration file in your Supabase database:

```sql
-- Run this in your Supabase SQL editor
-- File: supabase-migration-artifacts.sql

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
```

### 2. Verify Table Creation

Check that the table was created successfully:

```sql
-- Verify table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'artifacts';

-- Check table structure
\d artifacts

-- Verify indexes
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename = 'artifacts';
```

## API Endpoints

The system provides the following API endpoints:

### GET /api/artifacts
- **Query Parameters**:
  - `userId`: Filter by user ID
  - `conversationId`: Filter by conversation ID
  - `projectId`: Filter by project ID
  - `type`: Filter by artifact type
  - `search`: Search by name/description
  - `tags`: Filter by tags (comma-separated)

### POST /api/artifacts
- **Body**: Artifact data (name, type, content, description, preview, etc.)
- **Creates**: New artifact in the database

### GET /api/artifacts/[id]
- **Path Parameter**: `id` - Artifact UUID
- **Returns**: Specific artifact details

### PUT /api/artifacts/[id]
- **Path Parameter**: `id` - Artifact UUID
- **Body**: Updated artifact data
- **Updates**: Existing artifact

### DELETE /api/artifacts/[id]
- **Path Parameter**: `id` - Artifact UUID
- **Soft Deletes**: Sets `is_active` to false

### PATCH /api/artifacts/[id]
- **Operations**:
  - `createVersion`: Create new version of artifact
  - `restore`: Restore soft-deleted artifact
  - `hardDelete`: Permanently delete artifact

## Usage Examples

### 1. Using the React Hook

```tsx
import { useArtifacts } from '@/lib/use-artifacts';

function MyComponent() {
  const {
    artifacts,
    loading,
    error,
    createArtifact,
    updateArtifact,
    deleteArtifact,
    searchArtifacts
  } = useArtifacts({
    userId: 'user-123',
    conversationId: 'conv-456',
    autoFetch: true
  });

  const handleCreate = async () => {
    const newArtifact = await createArtifact({
      name: 'My Component',
      type: 'react',
      content: 'function MyComponent() { return <div>Hello</div>; }',
      description: 'A simple React component',
      tags: ['react', 'component', 'ui']
    });
  };

  return (
    <div>
      {artifacts.map(artifact => (
        <div key={artifact.id}>{artifact.name}</div>
      ))}
    </div>
  );
}
```

### 2. Using the Service Directly

```tsx
import { ArtifactService } from '@/lib/artifact-service';

// Create artifact
const artifact = await ArtifactService.createArtifact({
  name: 'My Artifact',
  type: 'html',
  content: '<div>Hello World</div>',
  description: 'A simple HTML artifact'
});

// Get user artifacts
const userArtifacts = await ArtifactService.getUserArtifacts('user-123');

// Search artifacts
const searchResults = await ArtifactService.searchArtifacts('component');

// Update artifact
const updated = await ArtifactService.updateArtifact(artifact.id, {
  description: 'Updated description'
});
```

### 3. Using the ArtifactManager Component

```tsx
import { ArtifactManager } from '@/components/artifacts/artifact-manager';

function MyPage() {
  const handleArtifactSelect = (artifact) => {
    console.log('Selected artifact:', artifact);
  };

  return (
    <ArtifactManager
      userId="user-123"
      conversationId="conv-456"
      onArtifactSelect={handleArtifactSelect}
    />
  );
}
```

## Artifact Types

The system supports the following artifact types:

- **html**: HTML content
- **component**: Generic component
- **react**: React component
- **jsx**: JSX content
- **interactive**: Interactive content
- **simulation**: Simulation content
- **quiz**: Quiz content
- **mindmap**: Mind map data
- **skill-atom**: Skill atom data
- **drill**: Drill/exercise content
- **progress**: Progress tracking
- **welcome**: Welcome content

## Features

### 1. Version Control
- Automatic version incrementing
- Version history tracking
- Create new versions of existing artifacts

### 2. Search and Filtering
- Full-text search by name and description
- Filter by type, tags, conversation, or project
- Tag-based organization

### 3. Security
- Row-level security (RLS)
- User-based access control
- Soft delete with restore capability

### 4. Performance
- Optimized database indexes
- Efficient query patterns
- Pagination support (can be added)

### 5. Metadata
- Flexible JSONB metadata storage
- Tag system for organization
- Automatic timestamps

## Testing

### 1. Test Page
Visit `/test-artifacts` to test the complete artifacts system:
- Create new artifacts
- Edit existing artifacts
- Search and filter
- Preview artifacts
- Delete artifacts

### 2. API Testing
Use tools like Postman or curl to test the API endpoints:

```bash
# Get all artifacts
curl "http://localhost:3000/api/artifacts"

# Create artifact
curl -X POST "http://localhost:3000/api/artifacts" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Artifact",
    "type": "html",
    "content": "<div>Test</div>",
    "description": "Test description"
  }'

# Get specific artifact
curl "http://localhost:3000/api/artifacts/[id]"

# Update artifact
curl -X PUT "http://localhost:3000/api/artifacts/[id]" \
  -H "Content-Type: application/json" \
  -d '{"description": "Updated description"}'

# Delete artifact
curl -X DELETE "http://localhost:3000/api/artifacts/[id]"
```

## Integration with zero280 Chat

To integrate artifacts with the zero280 chat:

1. **Save Artifacts**: When the AI generates content, save it as an artifact
2. **Link to Conversations**: Associate artifacts with specific chat conversations
3. **Edit and Update**: Allow users to edit saved artifacts
4. **Version Control**: Track changes and create new versions
5. **Search and Discovery**: Help users find and reuse previous artifacts

## Troubleshooting

### Common Issues

1. **Table not created**: Ensure you have proper permissions in Supabase
2. **RLS errors**: Check that RLS policies are correctly configured
3. **Index errors**: Verify that the `update_updated_at_column()` function exists
4. **API errors**: Check browser console and server logs for detailed error messages

### Debug Queries

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'artifacts';

-- Check triggers
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'artifacts';

-- Check permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'artifacts';
```

## Future Enhancements

Potential improvements for the artifacts system:

1. **File Uploads**: Support for binary file attachments
2. **Collaboration**: Multi-user editing and commenting
3. **Templates**: Reusable artifact templates
4. **Export/Import**: Bulk export and import functionality
5. **Analytics**: Usage statistics and insights
6. **Webhooks**: Notifications for artifact changes
7. **Search**: Full-text search with Elasticsearch
8. **Caching**: Redis-based caching for performance

## Support

For issues or questions about the artifacts system:

1. Check the browser console for JavaScript errors
2. Review server logs for API errors
3. Verify database permissions and RLS policies
4. Test with the provided test page at `/test-artifacts`
