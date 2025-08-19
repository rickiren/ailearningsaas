import { NextRequest, NextResponse } from 'next/server';
import { ConversationStore } from '@/lib/conversation-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');

    let conversations;
    
    if (projectId) {
      // Get conversations by project ID
      conversations = await ConversationStore.getConversationsByProject(projectId);
    } else if (userId) {
      // Get conversations by user ID
      conversations = await ConversationStore.getConversations(userId);
    } else {
      // Get all conversations
      conversations = await ConversationStore.getConversations();
    }

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
