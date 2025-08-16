# Conversation Memory Setup Guide

This guide explains how to set up conversation memory using Supabase for the AI Learning Path Creator.

## Prerequisites

- Supabase account and project
- Node.js and npm installed
- Environment variables configured

## 1. Supabase Setup

### Create a new Supabase project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Go to Settings > API to get your project URL and anon key

### Run the database migration
1. Copy the contents of `supabase-migration.sql`
2. Go to your Supabase project dashboard
3. Navigate to SQL Editor
4. Paste and run the migration script

## 2. Environment Variables

Create a `.env.local` file in your project root with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Anthropic API Key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## 3. Features Implemented

### Database Structure
- **conversations**: Stores conversation metadata and titles
- **messages**: Stores individual messages with conversation context
- **Row Level Security**: Ensures user data isolation
- **Automatic timestamps**: Tracks creation and update times

### Conversation Management
- **Auto-creation**: New conversations created automatically
- **Title generation**: Smart titles from first message
- **Context loading**: Loads last 20-30 messages for AI context
- **Conversation switching**: Seamless switching between chats

### Memory Features
- **Persistent storage**: Conversations saved across sessions
- **Context awareness**: AI remembers previous conversation
- **Smart summarization**: Handles long conversations efficiently
- **Artifact storage**: Saves mindmaps and learning paths

## 4. API Changes

### Chat API (`/api/chat`)
- Accepts `conversation_id` in request body
- Creates new conversation if none provided
- Loads conversation history for context
- Saves both user and AI messages
- Returns `conversation_id` in response

### Request Format
```json
{
  "message": "User message",
  "conversation_id": "optional-existing-conversation-id"
}
```

### Response Format
```json
{
  "content": "AI response content",
  "conversation_id": "conversation-id",
  "artifact": { /* mindmap data */ }
}
```

## 5. Frontend Components

### ConversationList
- Shows all user conversations
- New chat button
- Conversation selection
- Delete conversation (TODO)

### ChatInterface
- Integrated conversation sidebar
- Conversation context display
- Message history loading

### ChatInput
- Sends conversation_id with messages
- Handles conversation creation

## 6. State Management

### ChatStore Updates
- `currentConversationId`: Tracks active conversation
- `conversations`: List of user conversations
- `loadConversation()`: Load conversation history
- `createNewConversation()`: Start new chat
- `loadConversations()`: Load conversation list

## 7. Usage Examples

### Starting a new conversation
```typescript
const conversationId = await createNewConversation();
// Automatically creates conversation and sets as current
```

### Loading existing conversation
```typescript
await loadConversation('existing-conversation-id');
// Loads messages and sets as current conversation
```

### Sending message with context
```typescript
// API automatically includes conversation context
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({
    message: 'User message',
    conversation_id: currentConversationId
  })
});
```

## 8. Benefits

- **Persistent Memory**: Never lose conversation context
- **Scalable**: Handles multiple users and conversations
- **Efficient**: Loads only recent messages for context
- **User Experience**: Seamless conversation switching
- **Future Ready**: Easy to add real-time features

## 9. Troubleshooting

### Common Issues
1. **Environment variables not set**: Check `.env.local` file
2. **Database connection failed**: Verify Supabase URL and key
3. **RLS policies blocking**: Ensure migration script ran successfully
4. **Conversation not loading**: Check browser console for errors

### Debug Steps
1. Check browser console for errors
2. Verify Supabase connection in Network tab
3. Check environment variables are loaded
4. Verify database tables exist in Supabase dashboard

## 10. Next Steps

- Implement conversation deletion
- Add conversation search/filtering
- Implement user authentication
- Add conversation export functionality
- Real-time conversation updates
- Conversation sharing features
