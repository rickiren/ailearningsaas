'use client';

import { useEffect, useRef } from 'react';
import { Trash2, MessageCircle, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';

import { useChatStore } from '@/lib/chat-store';
import { useArtifactStore } from '@/lib/artifact-store';
import { ConversationTabs } from './conversation-tabs';



export function ChatSidebar() {
  const { 
    messages, 
    clearMessages, 
    isLoading, 
    addMessage, 
    currentConversationId,
    loadConversations 
  } = useChatStore();
  const { currentArtifact } = useArtifactStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);



  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">AI Assistant</h2>
              <p className="text-xs text-slate-600">
                Learning path creator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                className="h-9 w-9 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Artifact Status */}
        {currentArtifact && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-slate-800">Working on:</span>
            </div>
            <p className="text-sm text-slate-700 truncate font-medium">
              {currentArtifact.title}
            </p>
          </div>
        )}
      </header>

      {/* Conversation Tabs */}
      <ConversationTabs />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30">
        {messages.length === 0 ? (
          <div className="p-6 h-full flex flex-col">
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2 text-lg">
                  {currentConversationId ? 'Start Creating' : 'Start a New Chat'}
                </h3>
                <p className="text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
                  {currentConversationId 
                    ? "Describe what you want to teach and I'll help you build it"
                    : "Click 'New Chat' above to begin creating your learning path"
                  }
                </p>
              </div>
              
              {!currentConversationId && (
                <div className="text-center">
                  <Button
                    onClick={() => {
                      // This will be handled by the conversation tabs component
                      // We just need to trigger a re-render
                    }}
                    className="h-10 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {messages.map((message) => (
              <div key={message.id} className="border-b border-slate-200/50 last:border-b-0">
                <ChatMessage message={message} />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div>
        <ChatInput />
      </div>
    </div>
  );
}