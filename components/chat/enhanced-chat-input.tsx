'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/lib/chat-store';
import { useArtifactStore } from '@/lib/artifact-store';
import { parseAndExecuteAICommand } from '@/lib/ai-prompt-parser';
import { 
  InstantAcknowledgment, 
  ProgressHints, 
  InputLoadingState, 
  useProgressSimulation 
} from './instant-loading-states';
import { FadeIn, SmoothHeight } from './smooth-animations';

export function EnhancedChatInput() {
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(48);
  const [showAcknowledgment, setShowAcknowledgment] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    addMessage, 
    setLoading, 
    setError, 
    isLoading, 
    updateStreamingMessage, 
    finishStreamingMessage,
    currentConversationId,
    refreshConversations,
    updateStreamingMetadata
  } = useChatStore();

  const { addArtifact, setCurrentArtifact, updateArtifact } = useArtifactStore();
  
  // Progress simulation for realistic feedback
  const { stage, progress } = useProgressSimulation(isLoading);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 200);
      setInputHeight(newHeight);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setInputHeight(48);
    setError(null);
    setLastUserMessage(userMessage);
    
    if (!currentConversationId) {
      setError('Please start a new chat first by clicking the "New Chat" button.');
      return;
    }

    // Show instant acknowledgment
    setShowAcknowledgment(true);
    setTimeout(() => setShowAcknowledgment(false), 2000);
    
    // Add user message immediately with animation
    const userMessageId = addMessage({
      content: userMessage,
      role: 'user',
    });

    if (!userMessageId) {
      setError('Failed to add message. Please try starting a new chat.');
      return;
    }

    // Check if this is an editing command first
    if (isEditingCommand(userMessage)) {
      await handleEditingCommand(userMessage);
      return;
    }

    setLoading(true);

    // Add empty assistant message for streaming
    const assistantMessageId = addMessage({
      content: '',
      role: 'assistant',
    });

    if (!assistantMessageId) {
      setError('Failed to add assistant message. Please try starting a new chat.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage,
          conversation_id: currentConversationId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Handle streaming response with enhanced UI updates
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let lastUpdateTime = Date.now();
      const updateInterval = 100;
      const startTime = Date.now();
      const maxWaitTime = 120000;
      let currentArtifactId = null;

      while (true) {
        if (Date.now() - startTime > maxWaitTime) {
          throw new Error('Response timeout - the AI is taking too long to respond. Please try again with a simpler request.');
        }

        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              finishStreamingMessage(assistantMessageId);
              if (currentArtifactId) {
                updateArtifact(currentArtifactId, { isStreaming: false });
              }
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              
              if (parsed.conversation_id && !currentConversationId) {
                await refreshConversations(parsed.conversation_id);
              }
              
              // Handle thinking status updates
              if (parsed.thinking) {
                const { updateStreamingMetadata } = useChatStore.getState();
                updateStreamingMetadata({ thinking: parsed.thinking });
                continue;
              }
              
              // Handle tool execution status updates
              if (parsed.toolExecution) {
                const { updateStreamingMetadata } = useChatStore.getState();
                updateStreamingMetadata({ toolExecution: parsed.toolExecution });
                
                let toolExecutionMessage = '';
                
                switch (parsed.toolExecution.status) {
                  case 'starting':
                    toolExecutionMessage = `🚀 ${parsed.toolExecution.message}`;
                    break;
                  case 'executing':
                    toolExecutionMessage = `⚡ ${parsed.toolExecution.message}`;
                    break;
                  case 'completed':
                    toolExecutionMessage = `✅ ${parsed.toolExecution.message}`;
                    break;
                  case 'failed':
                    toolExecutionMessage = `❌ ${parsed.toolExecution.message}`;
                    break;
                  default:
                    toolExecutionMessage = `🔄 ${parsed.toolExecution.message || 'Tool execution in progress...'}`;
                }
                
                updateStreamingMessage(assistantMessageId, toolExecutionMessage);
                continue;
              }
              
              if (parsed.content) {
                accumulatedContent += parsed.content;
                
                const now = Date.now();
                if (now - lastUpdateTime >= updateInterval) {
                  updateStreamingMessage(assistantMessageId, accumulatedContent);
                  lastUpdateTime = now;
                }
              }

              // Handle artifact data with enhanced feedback
              if (parsed.artifact) {
                console.log('🎯 Enhanced chat input received artifact:', parsed.artifact);
                
                if (currentArtifactId) {
                  console.log('🔄 Updating existing artifact:', currentArtifactId);
                  updateArtifact(currentArtifactId, {
                    data: parsed.artifact.data,
                    isStreaming: true,
                  });
                } else {
                  console.log('🆕 Creating new artifact with enhanced feedback');
                  addArtifact({
                    type: parsed.artifact.type,
                    title: parsed.artifact.title,
                    data: parsed.artifact.data,
                    isStreaming: true,
                  }).then((artifactId) => {
                    console.log('✅ Created artifact in enhanced chat input:', artifactId);
                    currentArtifactId = artifactId;
                    setCurrentArtifact(artifactId);
                  });
                }
              }
            } catch (parseError) {
              continue;
            }
          }
        }
      }

      updateStreamingMessage(assistantMessageId, accumulatedContent);
      finishStreamingMessage(assistantMessageId);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      updateStreamingMessage(assistantMessageId, `Sorry, I encountered an error: ${errorMessage}`);
      finishStreamingMessage(assistantMessageId);
    }
  };

  const isEditingCommand = (message: string): boolean => {
    const editingKeywords = [
      'change', 'edit', 'update', 'modify', 'add', 'remove', 'delete', 'drop',
      'duplicate', 'copy', 'clone', 'move', 'relocate', 'merge', 'combine',
      'set', 'include', 'exclude'
    ];
    
    return editingKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  const handleEditingCommand = async (message: string) => {
    try {
      const result = await parseAndExecuteAICommand(message);
      
      if (result.success) {
        addMessage({
          content: `✅ ${result.message}`,
          role: 'assistant',
        });
      } else {
        addMessage({
          content: `❌ ${result.message}`,
          role: 'assistant',
        });
      }
      
    } catch (error) {
      console.error('Error handling editing command:', error);
      
      addMessage({
        content: `Sorry, I encountered an error while processing your editing request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        role: 'assistant',
      });
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="border-t bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-4xl mx-auto p-6">
        {/* Show instant acknowledgment */}
        <SmoothHeight>
          {showAcknowledgment && lastUserMessage && (
            <div className="mb-4">
              <InstantAcknowledgment userMessage={lastUserMessage} />
            </div>
          )}
        </SmoothHeight>

        {/* Show progress hints while loading */}
        <SmoothHeight>
          {isLoading && (
            <div className="mb-4">
              <ProgressHints stage={stage} progress={progress} />
            </div>
          )}
        </SmoothHeight>

        {/* Enhanced Input Container */}
        <FadeIn>
          <div className="relative">
            {/* Input Field */}
            <div className="relative flex items-end">
              {/* Plus Button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 bottom-2 z-10 h-9 w-9 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200 rounded-full hover:scale-105 active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              {/* Textarea Field */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  !currentConversationId 
                    ? "Start a new chat to begin..." 
                    : isLoading 
                      ? "AI is generating your learning path..." 
                      : "Ask me about creating learning paths..."
                }
                disabled={isLoading || !currentConversationId}
                style={{ height: `${inputHeight}px` }}
                className={`flex-1 pl-14 pr-20 py-3 rounded-2xl border-2 bg-white shadow-sm focus:ring-4 focus:ring-blue-100 transition-all duration-300 placeholder:text-slate-400 text-slate-700 resize-none overflow-hidden leading-6 ${
                  !currentConversationId 
                    ? 'border-slate-300 bg-slate-50 cursor-not-allowed' 
                    : 'border-slate-200 focus:border-blue-500 hover:shadow-md'
                }`}
                rows={1}
              />
              
              {/* Send Button */}
              <Button 
                onClick={sendMessage} 
                disabled={!input.trim() || isLoading || !currentConversationId}
                size="sm"
                className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                title={!currentConversationId ? "Start a new chat first" : "Send message"}
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </Button>
            </div>
            
            {/* Enhanced Loading Status */}
            <SmoothHeight>
              {isLoading && (
                <InputLoadingState message="Creating your personalized learning experience..." />
              )}
            </SmoothHeight>
            
            {/* Helper Text */}
            <FadeIn delay={200}>
              <div className="mt-3 text-center">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5 transition-colors hover:text-slate-600">
                  <Sparkles className="h-3 w-3 text-blue-400" />
                  {!currentConversationId 
                    ? "Click 'New Chat' to begin creating learning paths"
                    : "Press Enter to send, Shift+Enter for new line"
                  }
                </p>
              </div>
            </FadeIn>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}