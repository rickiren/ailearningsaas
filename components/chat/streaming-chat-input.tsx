'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Plus, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/lib/chat-store';
import { parseAndExecuteAICommand } from '@/lib/ai-prompt-parser';
import { useStreamingChat } from '@/hooks/use-streaming-chat';
import { 
  InstantAcknowledgment, 
  ProgressHints, 
  InputLoadingState 
} from './instant-loading-states';
import { FadeIn, SmoothHeight } from './smooth-animations';

export function StreamingChatInput() {
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(48);
  const [showAcknowledgment, setShowAcknowledgment] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { currentConversationId, setError } = useChatStore();
  const { 
    streamingState, 
    sendStreamingMessage, 
    abortStream,
    isStreaming 
  } = useStreamingChat();

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
    if (!input.trim() || isStreaming) return;

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
    setTimeout(() => setShowAcknowledgment(false), 2500);
    
    // Check if this is an editing command first
    if (isEditingCommand(userMessage)) {
      await handleEditingCommand(userMessage);
      return;
    }

    try {
      await sendStreamingMessage(userMessage, {
        onStreamStart: () => {
          console.log('Stream started');
        },
        onStreamChunk: (chunk, fullText) => {
          console.log('Received chunk:', chunk.length, 'chars');
        },
        onStreamComplete: (fullText) => {
          console.log('Stream completed, total length:', fullText.length);
        },
        onStreamError: (error) => {
          console.error('Stream error:', error);
          setError(error);
        },
        onArtifactCreate: (artifact) => {
          console.log('Artifact created:', artifact.title);
        },
        onArtifactUpdate: (artifactId, data) => {
          console.log('Artifact updated:', artifactId);
        }
      });
    } catch (error) {
      console.error('Failed to send streaming message:', error);
      // Error is already handled in the hook
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
    if (e.key === 'Escape' && isStreaming) {
      abortStream();
    }
  };

  const getProgressStage = () => {
    switch (streamingState.stage) {
      case 'connecting': return 'Connecting to AI...';
      case 'streaming': return 'AI is responding...';
      case 'tool-starting': return 'Preparing tools...';
      case 'tool-executing': return 'Executing tools...';
      case 'tool-completed': return 'Tools completed...';
      case 'complete': return 'Response complete!';
      case 'error': return 'Error occurred';
      default: return 'Processing...';
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

        {/* Show streaming progress */}
        <SmoothHeight>
          {isStreaming && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">
                  {getProgressStage()}
                </span>
                <button
                  onClick={abortStream}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                  title="Stop streaming"
                >
                  <X className="w-3 h-3" />
                  Stop
                </button>
              </div>
              
              {/* Streaming Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${streamingState.progress}%` }}
                />
              </div>
              
              {/* Character count indicator */}
              {streamingState.streamingText.length > 0 && (
                <div className="mt-2 text-xs text-slate-500 text-center">
                  {streamingState.streamingText.length} characters streamed
                </div>
              )}
            </div>
          )}
        </SmoothHeight>

        {/* Show streaming error */}
        <SmoothHeight>
          {streamingState.error && (
            <FadeIn>
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                <span>Streaming error: {streamingState.error}</span>
                <button 
                  onClick={resetStreamingState}
                  className="ml-auto text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            </FadeIn>
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
                disabled={isStreaming}
                className="absolute left-4 bottom-2 z-10 h-9 w-9 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200 rounded-full hover:scale-105 active:scale-95 disabled:opacity-50"
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
                    : isStreaming 
                      ? "AI is streaming response..." 
                      : "Ask me about creating learning paths..."
                }
                disabled={!currentConversationId}
                style={{ height: `${inputHeight}px` }}
                className={`flex-1 pl-14 pr-20 py-3 rounded-2xl border-2 bg-white shadow-sm focus:ring-4 focus:ring-blue-100 transition-all duration-300 placeholder:text-slate-400 text-slate-700 resize-none overflow-hidden leading-6 ${
                  !currentConversationId 
                    ? 'border-slate-300 bg-slate-50 cursor-not-allowed' 
                    : isStreaming
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-slate-200 focus:border-blue-500 hover:shadow-md'
                }`}
                rows={1}
              />
              
              {/* Send/Stop Button */}
              <Button 
                onClick={isStreaming ? abortStream : sendMessage}
                disabled={(!input.trim() && !isStreaming) || !currentConversationId}
                size="sm"
                className={cn(
                  "absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95",
                  isStreaming 
                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                )}
                title={
                  !currentConversationId ? "Start a new chat first" : 
                  isStreaming ? "Stop streaming" : 
                  "Send message"
                }
              >
                {isStreaming ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </Button>
            </div>
            
            {/* Helper Text */}
            <FadeIn delay={200}>
              <div className="mt-3 text-center">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5 transition-colors hover:text-slate-600">
                  <Sparkles className="h-3 w-3 text-blue-400" />
                  {!currentConversationId 
                    ? "Click 'New Chat' to begin creating learning paths"
                    : isStreaming
                      ? "Press Escape or click Stop to interrupt streaming"
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