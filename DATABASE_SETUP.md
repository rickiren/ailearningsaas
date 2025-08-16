# Database Setup Guide for AI Learning Path SaaS

This guide explains how to set up the database integration for storing and managing mindmaps created by the AI.

## Overview

The system now automatically saves AI-generated mindmaps to a Supabase database, allowing users to:
- Save mindmaps permanently
- Load previously created mindmaps
- Edit and update existing mindmaps
- Organize learning paths by project

## Database Schema

### Tables

1. **`projects`** - Stores mindmap projects
   - `id`: Unique identifier
   - `title`: Project name
   - `description`: Optional description
   - `user_id`: User who owns the project
   - `metadata`: JSON containing type, node count, estimated hours
   - `created_at`, `updated_at`: Timestamps

2. **`skill_atoms`** - Stores individual mindmap nodes
   - `id`: Unique identifier
   - `project_id`: References the project
   - `parent_id`: Self-referencing for hierarchy
   - `title`, `description`: Node content
   - `level`: Depth in the tree (0 = root)
   - `order_index`: Sibling ordering
   - `difficulty`: beginner/intermediate/advanced
   - `estimated_hours`: Time estimate
   - `prerequisites`, `skills`: Arrays of related skills
   - `position_x`, `position_y`: Visual positioning
   - `node_data`: JSON for additional properties

3. **`conversations`** - Chat conversations (existing)
4. **`messages`** - Chat messages (existing)

## Setup Instructions

### 1. Run the Database Migration

Copy the contents of `supabase-migration-complete.sql` and run it in your Supabase SQL editor:

```sql
-- Run the complete migration file
-- This creates all tables, indexes, and security policies
```

### 2. Environment Variables

Ensure your `.env.local` file contains:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Verify Tables

After running the migration, you should see:
- `projects` table
- `skill_atoms` table
- Proper indexes and RLS policies

## How It Works

### Automatic Mindmap Storage

1. **AI Generation**: When the AI creates a mindmap JSON, it's automatically detected
2. **Database Storage**: The system creates a project and stores all nodes as skill atoms
3. **Relationship Mapping**: Parent-child relationships are preserved using `parent_id`
4. **Metadata Storage**: Project metadata includes node count and estimated hours

### Data Flow

```
AI Chat → JSON Mindmap → Artifact Store → Mindmap Store → Supabase Database
                ↓
        Projects + Skill Atoms
                ↓
        Hierarchical Reconstruction
```

### Key Features

- **Automatic Saving**: No user action required - mindmaps are saved as they're created
- **Hierarchical Storage**: Tree structure is preserved in the database
- **Position Persistence**: Visual layout is maintained
- **Metadata Tracking**: Rich information about each learning path
- **User Isolation**: RLS policies ensure data privacy

## API Endpoints

### Save Mindmap
```typescript
POST /api/mindmap/save
{
  "mindmapData": MindMapNode,
  "title": "JavaScript Learning Path",
  "description": "Complete path for learning JavaScript",
  "userId": "optional-user-id"
}
```

### Load Mindmap
```typescript
GET /api/mindmap/load?projectId=uuid
```

### List Mindmaps
```typescript
GET /api/mindmap/list?userId=optional-user-id
```

## Usage Examples

### Creating a Mindmap

1. Start a conversation with the AI
2. Ask for a learning path (e.g., "Create a JavaScript learning path")
3. The AI generates the mindmap JSON
4. It's automatically saved to the database
5. You can view it in the mindmap canvas

### Loading a Saved Mindmap

1. Use the `SavedMindmaps` component to see all your mindmaps
2. Click "Load" on any saved mindmap
3. It's reconstructed from the database and displayed

### Updating a Mindmap

1. Make changes to the mindmap in the UI
2. Changes are automatically synced to the database
3. The entire mindmap is recreated (future: implement diffing)

## Components

### `MindmapStore`
- Core service for database operations
- Handles saving, loading, and updating mindmaps
- Manages the relationship between projects and skill atoms

### `SavedMindmaps`
- UI component for viewing saved mindmaps
- Shows project metadata and allows loading
- Integrates with the artifact store

### `useArtifactStore`
- Enhanced with database integration
- Automatically saves mindmaps when created
- Provides methods for loading from database

## Database Operations

### Saving a Mindmap
```typescript
const result = await MindmapStore.saveMindmap(
  mindmapData,
  "JavaScript Learning Path",
  "Complete path for learning JavaScript"
);
// Returns: { projectId, skillAtomIds }
```

### Loading a Mindmap
```typescript
const mindmapData = await MindmapStore.loadMindmap(projectId);
// Returns: MindMapNode or null
```

### Getting User Mindmaps
```typescript
const projects = await MindmapStore.getUserMindmaps(userId);
// Returns: Array of Project objects
```

## Performance Considerations

- **Indexes**: Proper indexing on `project_id`, `parent_id`, and `level`
- **Batch Operations**: Skill atoms are inserted in batches
- **Lazy Loading**: Mindmaps are only loaded when requested
- **Caching**: Consider implementing Redis for frequently accessed mindmaps

## Security

- **Row Level Security (RLS)**: Users can only access their own data
- **Input Validation**: All data is validated before database insertion
- **SQL Injection Protection**: Using Supabase client with parameterized queries

## Troubleshooting

### Common Issues

1. **Migration Errors**: Ensure all SQL is run in order
2. **Permission Denied**: Check RLS policies and user authentication
3. **Data Not Saving**: Verify environment variables and database connection
4. **Mindmap Not Loading**: Check if project exists and has skill atoms

### Debug Mode

Enable detailed logging:
```typescript
// In your components
console.log('Database operation result:', result);
```

## Future Enhancements

- **Real-time Updates**: Supabase subscriptions for collaborative editing
- **Version Control**: Track changes to mindmaps over time
- **Advanced Diffing**: Only update changed nodes instead of recreating
- **Export/Import**: Support for various learning path formats
- **Analytics**: Track usage patterns and learning progress

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify database tables exist and have correct structure
3. Ensure environment variables are properly set
4. Check Supabase logs for database errors
