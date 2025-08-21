'use client';

import { useCallback, useEffect } from 'react';
import { useChatMode } from '@/hooks/use-chat-mode';
import { useChatStore } from '@/lib/chat-store';
import { getModeSystemPrompt } from '@/lib/chat-modes';

export interface ModeAwareChatHandlerProps {
  children: React.ReactNode;
}

export function ModeAwareChatHandler({ children }: ModeAwareChatHandlerProps) {
  const { currentMode, checkToolAccess, handleRestrictedAction, modeConfig } = useChatMode();
  const { addMessage } = useChatStore();

  // Route messages differently based on current mode
  const handleModeAwareMessage = useCallback(async (
    message: string,
    options: {
      onBeforeSend?: () => void;
      onAfterSend?: () => void;
      onModeRestriction?: (action: string) => void;
    } = {}
  ) => {
    const { onBeforeSend, onAfterSend, onModeRestriction } = options;

    // Pre-process message for mode-specific handling
    onBeforeSend?.();

    // Check for restricted actions in chat mode
    if (currentMode === 'chat') {
      const restrictedKeywords = [
        'create file', 'write file', 'modify', 'edit file', 'delete', 
        'install', 'run command', 'execute', 'build', 'deploy',
        'add to', 'update file', 'change code', 'fix code'
      ];

      const hasRestrictedAction = restrictedKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );

      if (hasRestrictedAction) {
        const isAllowed = handleRestrictedAction(message);
        if (!isAllowed) {
          onModeRestriction?.(message);
          return false;
        }
      }
    }

    // Add mode context to system prompt
    const modeSystemPrompt = getModeSystemPrompt(currentMode);
    
    // Message is allowed to proceed
    onAfterSend?.();
    return true;
  }, [currentMode, handleRestrictedAction]);

  // Intercept and validate API calls based on mode
  const interceptAPICall = useCallback((
    endpoint: string,
    body: any
  ): { allowed: boolean; modifiedBody?: any } => {
    
    // Add mode context to API calls
    const modifiedBody = {
      ...body,
      mode: currentMode,
      systemPrompt: getModeSystemPrompt(currentMode),
      allowedTools: modeConfig.allowedTools,
      restrictions: modeConfig.restrictions
    };

    return {
      allowed: true,
      modifiedBody
    };
  }, [currentMode, modeConfig]);

  // Monitor and block unauthorized tool usage
  useEffect(() => {
    // Override console methods to catch tool usage attempts
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args: any[]) => {
      // Check for tool usage errors in chat mode
      const errorMessage = args.join(' ').toLowerCase();
      
      if (currentMode === 'chat' && (
        errorMessage.includes('tool') ||
        errorMessage.includes('write') ||
        errorMessage.includes('edit') ||
        errorMessage.includes('modify')
      )) {
        addMessage({
          content: '⚠️ **Mode Restriction**: This action is not allowed in Chat Mode. Switch to Agent Mode to modify files.',
          role: 'system',
          metadata: {
            type: 'tool_restriction',
            mode: currentMode,
            error: errorMessage,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      originalConsoleError(...args);
    };

    return () => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, [currentMode, addMessage]);

  return (
    <div data-chat-mode={currentMode}>
      {children}
    </div>
  );
}

// Higher-order component to wrap components with mode awareness
export function withModeAwareness<T extends object>(
  Component: React.ComponentType<T>
) {
  return function ModeAwareComponent(props: T) {
    return (
      <ModeAwareChatHandler>
        <Component {...props} />
      </ModeAwareChatHandler>
    );
  };
}

// Hook for components to access mode-aware messaging
export function useModeAwareMessaging() {
  const { currentMode, checkToolAccess, handleRestrictedAction } = useChatMode();
  const { addMessage } = useChatStore();

  const sendModeAwareMessage = useCallback(async (
    message: string,
    options: {
      requireAgentMode?: boolean;
      skipRestrictionCheck?: boolean;
    } = {}
  ) => {
    const { requireAgentMode = false, skipRestrictionCheck = false } = options;

    // Check if agent mode is required
    if (requireAgentMode && currentMode === 'chat') {
      addMessage({
        content: '🔒 **Agent Mode Required**: This action requires Agent Mode to access file modification tools.\n\nPlease switch to Agent Mode to continue.',
        role: 'system',
        metadata: {
          type: 'mode_requirement',
          requiredMode: 'agent',
          currentMode,
          timestamp: new Date().toISOString()
        }
      });
      return false;
    }

    // Skip restriction check if explicitly requested
    if (!skipRestrictionCheck && currentMode === 'chat') {
      const isAllowed = handleRestrictedAction(message);
      if (!isAllowed) return false;
    }

    // Proceed with message
    return true;
  }, [currentMode, handleRestrictedAction, addMessage]);

  return {
    sendModeAwareMessage,
    currentMode,
    checkToolAccess,
    isInChatMode: currentMode === 'chat',
    isInAgentMode: currentMode === 'agent'
  };
}