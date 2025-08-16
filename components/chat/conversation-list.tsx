'use client';

import { useChatStore } from '@/lib/chat-store';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';

export function ConversationList() {
  const { 
    conversations, 
    currentConversationId, 
    loadConversations, 
    createNewConversation, 
    loadConversation,
    setCurrentConversation,
    deleteConversation
  } = useChatStore();
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleNewConversation = async () => {
    try {
      setIsLoading(true);
      await createNewConversation();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConversationSelect = async (conversationId: string) => {
    try {
      setIsLoading(true);
      await loadConversation(conversationId);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <Button 
          onClick={handleNewConversation}
          disabled={isLoading}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
              currentConversationId === conversation.id ? 'bg-accent' : ''
            }`}
            onClick={() => handleConversationSelect(conversation.id)}
          >
            <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {conversation.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(conversation.updated_at)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
                  deleteConversation(conversation.id);
                }
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        
        {conversations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs">Start a new chat to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}
