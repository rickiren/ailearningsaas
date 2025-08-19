# Chat Integration with Database

This document explains how the zero280 chat is now integrated with the database to provide AI memory and conversation persistence.

## Overview

The chat system now:
- Creates conversations in the database for each build session
- Stores all messages (user and AI) with proper metadata
- Links artifacts to specific conversations
- Provides conversation history and switching
- Gives the AI context about previous interactions

## Database Integration

### Tables Used

1. **conversations** - Stores build sessions
2. **messages** - Stores all chat messages
3. **artifacts** - Stores generated artifacts linked to conversations

### Key Relationships

```
conversations (1) ←→ (many) messages
conversations (1) ←→ (many) artifacts
```

## How It Works

### 1. Initial Message Flow

When a user sends their first message:

1. **Landing Page** (`/zero280`) - User enters initial request
2. **Build Page** (`/zero280/build`) - Redirects with message parameter
3. **API Route** (`/api/zero280`) - Creates new conversation and stores message
4. **Database** - Stores conversation and message records
5. **AI Response** - Generated with conversation context
6. **Artifacts** - Created and linked to conversation

### 2. Conversation Continuity

For subsequent messages in the same conversation:

1. **User Input** - Sent with existing conversationId
2. **Context Retrieval** - AI gets conversation summary including:
   - Previous messages
   - Existing artifacts
   - Build context
3. **Informed Response** - AI builds upon previous work
4. **Database Update** - New messages and artifacts stored

### 3. Artifact Management

Artifacts are automatically:
- Created when AI generates code
- Linked to the current conversation
- Stored with metadata about their source
- Available for future reference

## API Endpoints

### POST /api/zero280

**Request Body:**
```json
{
  "message": "build a login form",
  "conversationId": "optional-existing-conversation-id",
  "userId": "optional-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "response": "AI response text",
  "toolResults": [...],
  "artifacts": [...],
  "conversationId": "new-or-existing-conversation-id"
}
```

## Components

### ConversationManager

Located in `components/chat/conversation-manager.tsx`:
- Displays list of user's build conversations
- Allows switching between conversations
- Shows conversation metadata and timestamps
- Provides new conversation button

### ChatService

Located in `lib/chat-service.ts`:
- Manages conversation CRUD operations
- Handles message storage and retrieval
- Links artifacts to conversations
- Provides conversation summaries for AI context

### useChatConversation Hook

Located in `lib/use-chat-conversation.ts`:
- React hook for managing chat state
- Handles conversation loading and switching
- Manages message sending and responses
- Integrates with the database service

## Usage Examples

### 1. Creating a New Build Session

```tsx
import { useChatConversation } from '@/lib/use-chat-conversation';

function BuildComponent() {
  const { createNewConversation, sendMessage } = useChatConversation();
  
  const handleStartBuild = async () => {
    const conversationId = await createNewConversation("build a landing page");
    if (conversationId) {
      // Conversation created, ready to send messages
    }
  };
}
```

### 2. Sending Messages in Existing Conversation

```tsx
const handleSendMessage = async (content: string) => {
  const response = await sendMessage(content);
  if (response) {
    // Message sent and AI responded
    // Artifacts automatically created and stored
  }
};
```

### 3. Switching Between Conversations

```tsx
const { loadConversation } = useChatConversation();

const handleConversationSelect = async (conversationId: string) => {
  await loadConversation(conversationId);
  // Chat history and artifacts loaded
};
```

## AI Context Enhancement

The AI now receives conversation context including:

```
CONVERSATION CONTEXT:
Conversation: Build: build a beautiful landing page...

Recent messages:
[2:30 PM] User: build a beautiful landing page
[2:31 PM] AI: I'll create a beautiful landing page for you...
[2:32 PM] User: add a header with navigation
[2:33 PM] AI: I'll add a header with navigation...

Artifacts created in this conversation:
- LandingPage (html): A beautiful landing page with modern design
- Header (component): Navigation header with responsive design
```

This allows the AI to:
- Remember what was built previously
- Build upon existing artifacts
- Maintain consistency across the session
- Provide contextual responses

## Database Schema

### conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### artifacts Table
```sql
CREATE TABLE artifacts (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  conversation_id UUID REFERENCES conversations(id),
  user_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Features

### 1. Conversation Persistence
- All build sessions are automatically saved
- Users can return to previous conversations
- Full chat history is preserved

### 2. AI Memory
- AI remembers previous interactions
- Builds upon existing artifacts
- Maintains context across messages

### 3. Artifact Linking
- Artifacts are automatically linked to conversations
- Easy to find what was created in each session
- Supports versioning and updates

### 4. User Experience
- Seamless conversation switching
- Visual conversation management
- Clear session organization

## Future Enhancements

### 1. User Authentication
- Link conversations to authenticated users
- User-specific conversation history
- Privacy and security controls

### 2. Collaboration
- Share conversations with team members
- Collaborative artifact building
- Real-time updates

### 3. Advanced Context
- File-based context integration
- Project structure awareness
- Cross-conversation artifact references

### 4. Analytics
- Build session metrics
- Artifact creation patterns
- User behavior insights

## Testing

### 1. Test the Integration
1. Visit `/zero280` and enter a build request
2. Check that a conversation is created in the database
3. Send additional messages to see context building
4. Switch between conversations using the sidebar

### 2. Database Verification
```sql
-- Check conversations
SELECT * FROM conversations WHERE metadata->>'type' = 'build';

-- Check messages
SELECT * FROM messages ORDER BY created_at;

-- Check artifacts
SELECT * FROM artifacts ORDER BY created_at;
```

### 3. API Testing
```bash
# Create new conversation
curl -X POST "http://localhost:3000/api/zero280" \
  -H "Content-Type: application/json" \
  -d '{"message": "build a button component"}'

# Continue conversation
curl -X POST "http://localhost:3000/api/zero280" \
  -H "Content-Type: application/json" \
  -d '{"message": "make it red", "conversationId": "existing-id"}'
```

## Troubleshooting

### Common Issues

1. **Conversation not created**: Check database permissions and RLS policies
2. **Messages not stored**: Verify message insertion in API route
3. **Context not working**: Check conversation summary generation
4. **Artifacts not linked**: Verify artifact creation with conversationId

### Debug Steps

1. Check browser console for errors
2. Verify API responses include conversationId
3. Check database for conversation and message records
4. Test conversation summary generation

## Conclusion

The chat integration provides a robust foundation for:
- Persistent build sessions
- AI memory and context
- Artifact organization
- User experience enhancement

This system enables users to have meaningful, continuous conversations with the AI while building complex applications, with full history and context preservation.
