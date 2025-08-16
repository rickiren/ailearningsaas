'use client';

import { useChatStore } from '@/lib/chat-store';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ConversationTabs() {
  const { 
    conversations, 
    currentConversationId, 
    loadConversation,
    createNewConversation,
    deleteConversation
  } = useChatStore();

  const handleNewConversation = async () => {
    try {
      await createNewConversation();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      await deleteConversation(conversationId);
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewConversation}
          className="h-8 px-3 gap-2"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-x-auto">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={cn(
            "group flex items-center gap-2 px-3 py-2 rounded-t-lg border border-b-0 cursor-pointer transition-all duration-200 min-w-0",
            currentConversationId === conversation.id
              ? "bg-background border-border text-foreground"
              : "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
          onClick={() => loadConversation(conversation.id)}
        >
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate block">
              {conversation.title}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0 rounded-sm hover:bg-destructive/10 hover:text-destructive",
              currentConversationId === conversation.id && "opacity-100"
            )}
            onClick={(e) => handleDeleteConversation(e, conversation.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleNewConversation}
        className="h-8 px-3 gap-2 ml-2 shrink-0"
      >
        <Plus className="h-4 w-4" />
        New
      </Button>
    </div>
  );
}
