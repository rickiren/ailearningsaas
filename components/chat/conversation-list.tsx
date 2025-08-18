'use client';

import { useChatStore } from '@/lib/chat-store';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Trash2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <Button 
          onClick={handleNewConversation}
          disabled={isLoading}
          className="w-full justify-center gap-3 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl font-medium"
          variant="outline"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus className="h-5 w-5" />
          )}
          New Chat
        </Button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-sm ${
              currentConversationId === conversation.id 
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm' 
                : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'
            }`}
            onClick={() => handleConversationSelect(conversation.id)}
          >
            <div className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
              currentConversationId === conversation.id
                ? 'bg-blue-100 text-blue-600'
                : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-hover:text-slate-700'
            )}>
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-sm font-medium truncate transition-colors',
                currentConversationId === conversation.id
                  ? 'text-slate-800'
                  : 'text-slate-700 group-hover:text-slate-800'
              )}>
                {conversation.title}
              </p>
              <p className={cn(
                'text-xs transition-colors',
                currentConversationId === conversation.id
                  ? 'text-slate-600'
                  : 'text-slate-500 group-hover:text-slate-600'
              )}>
                {formatDate(conversation.updated_at)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
                  deleteConversation(conversation.id);
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        
        {conversations.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">No conversations yet</p>
            <p className="text-xs text-slate-500 mb-4">Start your first chat to begin creating learning paths</p>
            <Button
              onClick={handleNewConversation}
              disabled={isLoading}
              className="h-9 px-4 gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg font-medium"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Start New Chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
