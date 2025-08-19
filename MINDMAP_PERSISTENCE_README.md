# Mindmap Persistence System

## Overview

This system ensures that the AI always has access to the current mindmap you're working on, even across page refreshes and conversation switches. It automatically links conversations to mindmap projects in the database and loads the appropriate mindmap context when needed.

## How It Works

### 1. Automatic Linking
- When you create a mindmap in a conversation, it's automatically saved to the database
- The conversation is automatically linked to the mindmap project via `project_id`
- This link persists across sessions and page refreshes

### 2. Context Loading
- When you load a conversation, the system checks if it has a linked project
- If a project exists, the mindmap is automatically loaded from the database
- The AI context is updated with the current mindmap structure
- The artifact store is synchronized to maintain UI consistency

### 3. AI Context Management
- The AI always has access to the current mindmap structure
- Context is automatically restored when switching between conversations
- Mindmap updates are persisted to the database in real-time

## Database Schema Changes

### New Column Added
```sql
-- Added to conversations table
ALTER TABLE conversations ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
```

### New Index
```sql
CREATE INDEX idx_conversations_project_id ON conversations(project_id);
```

## API Changes

### Chat Route (`/api/chat`)
- Automatically loads mindmap context from database if conversation has linked project
- Ensures AI always has access to current mindmap structure
- Updates conversation context in real-time

### Conversation Store
- New methods for linking conversations to projects
- Automatic project loading when conversations are accessed
- Project ID retrieval for context restoration

## Usage

### For Users
1. **Create a mindmap**: Start a conversation and ask the AI to create a learning path
2. **Automatic persistence**: The mindmap is automatically saved and linked to your conversation
3. **Switch conversations**: Your mindmap context is automatically restored
4. **Page refresh**: Mindmap context is preserved and restored

### For Developers
1. **Database migration**: Run `supabase-migration-add-project-id.sql` to add the new column
2. **Type safety**: All types have been updated to include `project_id` field
3. **Automatic linking**: No manual intervention needed - linking happens automatically
4. **Context restoration**: Use `chatStore.updateCurrentMindmap()` to update mindmap data

## Benefits

1. **Persistent Context**: AI never loses track of your current mindmap
2. **Cross-Session Persistence**: Mindmap context survives page refreshes and browser restarts
3. **Automatic Synchronization**: Database, UI, and AI context stay in sync
4. **Seamless Experience**: No manual saving or loading required

## Migration

To apply the database changes:

```bash
# Run the migration SQL
psql -h your-supabase-host -U your-user -d your-database -f supabase-migration-add-project-id.sql
```

## Troubleshooting

### Common Issues

1. **Mindmap not loading**: Check if conversation has `project_id` set
2. **Context loss**: Verify database connection and project linking
3. **Type errors**: Ensure all type definitions include `project_id` field

### Debug Logging

The system includes comprehensive logging:
- `🔗` - Project linking operations
- `✅` - Successful operations
- `⚠️` - Warnings and non-critical issues
- `❌` - Errors that need attention

## Future Enhancements

1. **Multiple mindmaps per conversation**: Support for working with multiple learning paths
2. **Version control**: Track mindmap changes over time
3. **Collaboration**: Share mindmaps between users
4. **Export/Import**: Backup and restore mindmap data
