'use client';

import { useChatStore } from '@/lib/chat-store';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export function ConversationTabs() {
  const { 
    conversations, 
    currentConversationId, 
    loadConversation,
    createNewConversation,
    deleteConversation,
    loadConversations
  } = useChatStore();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleNewConversation = async () => {
    try {
      await createNewConversation();
      // Refresh conversations after creating a new one
      await loadConversations();
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      await deleteConversation(conversationId);
      // Refresh conversations after deleting
      await loadConversations();
    }
  };

  // Add null check to prevent the error
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
        <div className="flex-1 text-center">
          <p className="text-sm text-slate-600 mb-2">No conversations yet</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNewConversation}
            className="h-9 px-4 gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all duration-200 rounded-lg"
          >
            <Plus className="h-4 w-4" />
            Start New Chat
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-6 py-3 border-b border-slate-200 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 overflow-x-auto">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className={cn(
            "group flex items-center gap-2 px-4 py-2.5 rounded-t-xl border border-b-0 cursor-pointer transition-all duration-200 min-w-0",
            currentConversationId === conversation.id
              ? "bg-white border-slate-200 text-slate-900 shadow-sm"
              : "bg-slate-50/50 border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800 hover:border-slate-200"
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
              "opacity-0 group-hover:opacity-100 transition-all duration-200 h-6 w-6 p-0 rounded-md hover:bg-red-50 hover:text-red-600",
              currentConversationId === conversation.id && "opacity-100"
            )}
            onClick={(e) => handleDeleteConversation(e, conversation.id)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleNewConversation}
        className="h-9 px-4 gap-2 ml-2 shrink-0 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all duration-200 rounded-lg"
      >
        <Plus className="h-4 w-4" />
        New
      </Button>
    </div>
  );
}
