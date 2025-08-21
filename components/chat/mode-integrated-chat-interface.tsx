'use client';

import { useState, useEffect, useCallback } from 'react';
import { useChatMode } from '@/hooks/use-chat-mode';
import { useChatStore } from '@/lib/chat-store';
import { useStreamingChat } from '@/hooks/use-streaming-chat';
import { ChatModeToggle } from './chat-mode-toggle';
import { ModeStatusIndicator, ModeWarningBanner } from './mode-status-indicator';
import { StreamingChatMessage } from './streaming-chat-message';
import { StreamingChatInput } from './streaming-chat-input';
import { ModeAwareChatHandler, useModeAwareMessaging } from './mode-aware-chat-handler';
import { StreamingErrorHandler, classifyStreamingError } from './streaming-error-handling';
import { RealTimeTypingIndicator, StreamingProgressIndicator } from './enhanced-streaming-indicators';
import { FadeIn, SmoothHeight } from './smooth-animations';
import { getModeSystemPrompt } from '@/lib/chat-modes';

export function ModeIntegratedChatInterface() {
  const { 
    currentMode, 
    modeConfig, 
    switchMode,
    isInChatMode,
    isInAgentMode,
    handleRestrictedAction
  } = useChatMode();
  
  const { messages, currentConversationId, error } = useChatStore();
  const { 
    streamingState, 
    sendStreamingMessage, 
    abortStream,
    isStreaming 
  } = useStreamingChat();
  
  const { sendModeAwareMessage } = useModeAwareMessaging();
  
  const [showModeDetails, setShowModeDetails] = useState(false);
  const [pendingModeSwitch, setPendingModeSwitch] = useState<string | null>(null);
  const [lastRestrictedAction, setLastRestrictedAction] = useState<string | null>(null);

  // Enhanced message sending with mode awareness
  const handleSendMessage = useCallback(async (message: string) => {
    if (!currentConversationId) return;

    // Check if message is allowed in current mode
    const canSend = await sendModeAwareMessage(message, {
      requireAgentMode: containsModificationKeywords(message),
      skipRestrictionCheck: false
    });
    
    if (!canSend) {
      setLastRestrictedAction(message);
      return;
    }

    try {
      await sendStreamingMessage(message, {
        onStreamStart: () => {
          console.log(`🚀 Starting stream in ${currentMode} mode`);
        },
        onStreamChunk: (chunk, fullText) => {
          // Mode-specific chunk handling could go here
        },
        onStreamComplete: (fullText) => {
          console.log(`✅ Stream completed in ${currentMode} mode`);
        },
        onStreamError: (error) => {
          console.error(`❌ Stream error in ${currentMode} mode:`, error);
        },
        onArtifactCreate: (artifact) => {
          if (isInChatMode) {
            console.warn('Artifact creation attempted in chat mode - this should not happen');
          }
        }
      });
    } catch (error) {
      console.error('Failed to send mode-aware message:', error);
    }
  }, [currentConversationId, currentMode, sendModeAwareMessage, sendStreamingMessage, isInChatMode]);

  // Check if message contains modification keywords
  const containsModificationKeywords = (message: string): boolean => {
    const keywords = [
      'create file', 'write file', 'modify', 'edit file', 'update code',
      'generate component', 'build', 'install', 'delete', 'add to project'
    ];
    
    return keywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  // Handle mode switch with confirmation for sensitive actions
  const handleModeSwitch = useCallback(async (newMode: string) => {
    if (isStreaming) {
      setPendingModeSwitch(newMode);
      return;
    }
    
    if (newMode === 'agent' && isInChatMode) {
      // Show confirmation when switching to agent mode
      const confirmed = window.confirm(
        'Switch to Agent Mode?\n\n' +
        'Agent Mode will give the AI full access to:\n' +
        '• Read and write files\n' +
        '• Execute development actions\n' +
        '• Modify your codebase\n\n' +
        'Continue?'
      );
      
      if (!confirmed) return;
    }
    
    await switchMode(newMode as any);
    setPendingModeSwitch(null);
  }, [isStreaming, isInChatMode, switchMode]);

  // Handle pending mode switch after streaming completes
  useEffect(() => {
    if (pendingModeSwitch && !isStreaming) {
      handleModeSwitch(pendingModeSwitch);
    }
  }, [pendingModeSwitch, isStreaming, handleModeSwitch]);

  // Auto-dismiss restricted action warning after 10 seconds
  useEffect(() => {
    if (lastRestrictedAction) {
      const timer = setTimeout(() => {
        setLastRestrictedAction(null);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [lastRestrictedAction]);

  return (
    <ModeAwareChatHandler>
      <div className="flex flex-col h-full">
        {/* Header with Mode Controls */}
        <div className="flex-shrink-0 border-b bg-white/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">
                AI Learning Assistant
              </h1>
              
              {/* Mode Toggle */}
              <ChatModeToggle />
            </div>
            
            <div className="flex items-center gap-3">
              {/* Mode Status */}
              <ModeStatusIndicator compact />
              
              {/* Details Toggle */}
              <button
                onClick={() => setShowModeDetails(!showModeDetails)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                {showModeDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
          </div>
          
          {/* Mode Details */}
          <SmoothHeight>
            {showModeDetails && (
              <div className="mt-4">
                <ModeStatusIndicator showDetails />
              </div>
            )}
          </SmoothHeight>
        </div>

        {/* Warning Banners */}
        <SmoothHeight>
          {/* Restricted Action Warning */}
          {lastRestrictedAction && (
            <div className="p-4">
              <ModeWarningBanner
                type="warning"
                message={`Action "${lastRestrictedAction}" requires Agent Mode. Switch modes to modify files and execute actions.`}
                onDismiss={() => setLastRestrictedAction(null)}
              />
            </div>
          )}
          
          {/* Pending Mode Switch Warning */}
          {pendingModeSwitch && isStreaming && (
            <div className="p-4">
              <ModeWarningBanner
                type="info"
                message={`Mode switch to ${pendingModeSwitch} pending. Please wait for current response to complete.`}
                onDismiss={() => setPendingModeSwitch(null)}
              />
            </div>
          )}
        </SmoothHeight>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <StreamingChatMessage
              key={message.id || index}
              message={message}
              isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
              streamingText={streamingState.streamingText}
              modeContext={{
                mode: currentMode,
                capabilities: modeConfig.capabilities,
                restrictions: modeConfig.restrictions
              }}
            />
          ))}
          
          {/* Streaming Indicators */}
          <SmoothHeight>
            {isStreaming && (
              <div className="space-y-3">
                {/* Typing Indicator */}
                <RealTimeTypingIndicator
                  isVisible={streamingState.streamingText.length === 0}
                  message={`AI is ${currentMode === 'chat' ? 'thinking about' : 'working on'} your request...`}
                  variant={currentMode === 'chat' ? 'thinking' : 'working'}
                />
                
                {/* Progress Indicator */}
                <StreamingProgressIndicator
                  stage={streamingState.stage}
                  progress={streamingState.progress}
                  isVisible={true}
                  showStats={currentMode === 'agent'}
                  charsReceived={streamingState.streamingText.length}
                  timeElapsed={Date.now()}
                />
              </div>
            )}
          </SmoothHeight>
          
          {/* Error Handling */}
          <SmoothHeight>
            {streamingState.error && (
              <StreamingErrorHandler
                error={classifyStreamingError(streamingState.error)}
                onRetry={() => {
                  // Retry last message with current mode context
                  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
                  if (lastUserMessage) {
                    handleSendMessage(lastUserMessage.content);
                  }
                }}
                onDismiss={() => {
                  // Clear streaming error
                }}
              />
            )}
          </SmoothHeight>
        </div>

        {/* Enhanced Chat Input */}
        <div className="flex-shrink-0">
          <StreamingChatInput
            onSendMessage={handleSendMessage}
            placeholder={
              !currentConversationId
                ? "Start a new chat to begin..."
                : isInChatMode
                  ? "Ask me anything about code, architecture, or development..."
                  : "Tell me what you'd like to build or modify..."
            }
            disabled={!currentConversationId}
            modeContext={{
              mode: currentMode,
              canModifyCode: isInAgentMode,
              restrictions: isInChatMode ? ['read-only', 'discussion-only'] : []
            }}
          />
        </div>

        {/* Footer Mode Info */}
        <div className="flex-shrink-0 border-t bg-gray-50 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-base">{modeConfig.icon}</span>
              <span>
                {isInChatMode 
                  ? 'Discussion mode - AI can explain and advise but cannot modify code'
                  : 'Agent mode - AI has full access to read, write, and modify files'
                }
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {isStreaming && (
                <button
                  onClick={abortStream}
                  className="text-red-600 hover:text-red-800 underline"
                >
                  Stop Response
                </button>
              )}
              
              <span>
                {messages.filter(m => m.role === 'user').length} messages sent
              </span>
            </div>
          </div>
        </div>
      </div>
    </ModeAwareChatHandler>
  );
}

// Wrapper component for easy integration
export function ChatWithModeSupport({ className }: { className?: string }) {
  return (
    <div className={className}>
      <ModeIntegratedChatInterface />
    </div>
  );
}