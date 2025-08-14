'use client';

import { useEffect, useRef } from 'react';
import { Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { useChatStore } from '@/lib/chat-store';
import { useArtifactStore } from '@/lib/artifact-store';

const EXAMPLE_PROMPTS = [
  "Create a JavaScript learning path for complete beginners",
  "Design a mind map for data science fundamentals", 
  "Build a practice drill for React hooks",
  "Generate a progress tracker for my Python course"
];

export function ChatSidebar() {
  const { messages, clearMessages, isLoading, addMessage } = useChatStore();
  const { currentArtifact } = useArtifactStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleExampleClick = async (prompt: string) => {
    if (isLoading) return;
    
    // Add user message immediately
    addMessage({
      content: prompt,
      role: 'user',
    });

    // This will be handled by the enhanced ChatInput logic
    // The artifact creation will be triggered by the API response
  };

  return (
    <div className="h-full flex flex-col bg-background border-l">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold">AI Assistant</h2>
              <p className="text-xs text-muted-foreground">
                Learning path creator
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Artifact Status */}
        {currentArtifact && (
          <div className="mt-3 p-2 bg-primary/5 border border-primary/20 rounded-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-sm font-medium">Working on:</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {currentArtifact.title}
            </p>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="p-4 h-full flex flex-col">
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Start Creating</h3>
                <p className="text-sm text-muted-foreground">
                  Describe what you want to teach and I'll help you build it
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-3">Try these:</p>
                <div className="space-y-2">
                  {EXAMPLE_PROMPTS.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full text-left justify-start h-auto py-2 px-3 text-xs whitespace-normal leading-relaxed"
                      onClick={() => handleExampleClick(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {messages.map((message) => (
              <div key={message.id} className="border-b border-border/50 last:border-b-0">
                <ChatMessage message={message} />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t">
        <ChatInput />
      </div>
    </div>
  );
}