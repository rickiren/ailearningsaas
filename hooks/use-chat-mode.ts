'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChatMode, getModeConfig, isToolAllowed, validateModeAction, getModeTransitionMessage } from '@/lib/chat-modes';
import { useChatStore } from '@/lib/chat-store';

export interface ChatModeState {
  currentMode: ChatMode;
  isTransitioning: boolean;
  lastTransition: Date | null;
}

export function useChatMode(initialMode: ChatMode = 'chat') {
  const [modeState, setModeState] = useState<ChatModeState>({
    currentMode: initialMode,
    isTransitioning: false,
    lastTransition: null
  });
  
  const { addMessage } = useChatStore();

  // Switch between modes
  const switchMode = useCallback(async (newMode: ChatMode) => {
    if (newMode === modeState.currentMode) return;

    setModeState(prev => ({ ...prev, isTransitioning: true }));
    
    try {
      // Add transition message to chat
      const transitionMessage = getModeTransitionMessage(modeState.currentMode, newMode);
      
      addMessage({
        content: `🔄 ${transitionMessage}`,
        role: 'system',
        metadata: {
          type: 'mode_transition',
          fromMode: modeState.currentMode,
          toMode: newMode,
          timestamp: new Date().toISOString()
        }
      });

      // Update mode state
      setModeState({
        currentMode: newMode,
        isTransitioning: false,
        lastTransition: new Date()
      });

      // Persist mode preference
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('chatMode', newMode);
      }

    } catch (error) {
      console.error('Failed to switch chat mode:', error);
      setModeState(prev => ({ ...prev, isTransitioning: false }));
    }
  }, [modeState.currentMode, addMessage]);

  // Check if a tool is allowed in current mode
  const checkToolAccess = useCallback((tool: string): boolean => {
    return isToolAllowed(tool, modeState.currentMode);
  }, [modeState.currentMode]);

  // Validate if an action is allowed
  const validateAction = useCallback((action: string) => {
    return validateModeAction(action, modeState.currentMode);
  }, [modeState.currentMode]);

  // Get current mode configuration
  const getModeInfo = useCallback(() => {
    return getModeConfig(modeState.currentMode);
  }, [modeState.currentMode]);

  // Handle mode-restricted action attempts
  const handleRestrictedAction = useCallback((action: string) => {
    const validation = validateAction(action);
    
    if (!validation.allowed) {
      addMessage({
        content: `❌ **Action Blocked**: ${validation.reason}\n\n💡 **Suggestion**: ${validation.suggestion}`,
        role: 'system',
        metadata: {
          type: 'mode_restriction',
          action,
          mode: modeState.currentMode,
          timestamp: new Date().toISOString()
        }
      });
      
      return false;
    }
    
    return true;
  }, [validateAction, addMessage, modeState.currentMode]);

  // Load saved mode preference on mount
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const savedMode = localStorage.getItem('chatMode') as ChatMode;
      if (savedMode && (savedMode === 'chat' || savedMode === 'agent')) {
        setModeState(prev => ({ ...prev, currentMode: savedMode }));
      }
    }
  }, []);

  return {
    // State
    currentMode: modeState.currentMode,
    isTransitioning: modeState.isTransitioning,
    lastTransition: modeState.lastTransition,
    
    // Mode info
    modeConfig: getModeInfo(),
    
    // Actions
    switchMode,
    checkToolAccess,
    validateAction,
    handleRestrictedAction,
    
    // Helpers
    isInChatMode: modeState.currentMode === 'chat',
    isInAgentMode: modeState.currentMode === 'agent',
  };
}