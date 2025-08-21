'use client';

import { useState } from 'react';
import { MessageSquare, Bot, Lock, Unlock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatMode } from '@/hooks/use-chat-mode';
import { ChatMode } from '@/lib/chat-modes';
import { Button } from '@/components/ui/button';

export function ChatModeToggle() {
  const { 
    currentMode, 
    isTransitioning, 
    switchMode, 
    modeConfig,
    isInChatMode,
    isInAgentMode 
  } = useChatMode();
  
  const [showTooltip, setShowTooltip] = useState(false);

  const handleModeSwitch = (newMode: ChatMode) => {
    if (newMode !== currentMode && !isTransitioning) {
      switchMode(newMode);
    }
  };

  return (
    <div className="relative">
      {/* Main Toggle */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1 shadow-sm">
        {/* Chat Mode Button */}
        <button
          onClick={() => handleModeSwitch('chat')}
          disabled={isTransitioning}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
            isInChatMode 
              ? "bg-white text-blue-700 shadow-sm" 
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200",
            isTransitioning && "opacity-50 cursor-not-allowed"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat</span>
          {isInChatMode && <Lock className="w-3 h-3 text-blue-500" />}
        </button>

        {/* Agent Mode Button */}
        <button
          onClick={() => handleModeSwitch('agent')}
          disabled={isTransitioning}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
            isInAgentMode 
              ? "bg-white text-emerald-700 shadow-sm" 
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200",
            isTransitioning && "opacity-50 cursor-not-allowed"
          )}
        >
          <Bot className="w-4 h-4" />
          <span>Agent</span>
          {isInAgentMode && <Unlock className="w-3 h-3 text-emerald-500" />}
        </button>

        {/* Info Button */}
        <button
          onClick={() => setShowTooltip(!showTooltip)}
          className="ml-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
          title="Mode Information"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Information Tooltip */}
      {showTooltip && (
        <div className="absolute top-full mt-2 left-0 z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-white text-lg",
              modeConfig.bgColor,
              modeConfig.color.replace('text-', 'bg-')
            )}>
              {modeConfig.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-900">{modeConfig.name}</h3>
                <span className={cn(
                  "px-2 py-1 text-xs rounded-full",
                  modeConfig.bgColor,
                  modeConfig.color
                )}>
                  Active
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{modeConfig.description}</p>
              
              {/* Capabilities */}
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-1">Capabilities:</h4>
                <ul className="space-y-1">
                  {modeConfig.capabilities.slice(0, 3).map((capability, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-center gap-1">
                      <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                      {capability}
                    </li>
                  ))}
                  {modeConfig.capabilities.length > 3 && (
                    <li className="text-xs text-gray-500">
                      +{modeConfig.capabilities.length - 3} more
                    </li>
                  )}
                </ul>
              </div>

              {/* Restrictions */}
              {modeConfig.restrictions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-1">Restrictions:</h4>
                  <ul className="space-y-1">
                    {modeConfig.restrictions.slice(0, 2).map((restriction, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                        {restriction}
                      </li>
                    ))}
                    {modeConfig.restrictions.length > 2 && (
                      <li className="text-xs text-gray-500">
                        +{modeConfig.restrictions.length - 2} more
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Transition Indicator */}
      {isTransitioning && (
        <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            Switching modes...
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for mobile or small spaces
export function CompactChatModeToggle() {
  const { currentMode, isTransitioning, switchMode, modeConfig } = useChatMode();

  return (
    <button
      onClick={() => switchMode(currentMode === 'chat' ? 'agent' : 'chat')}
      disabled={isTransitioning}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border",
        currentMode === 'chat'
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200",
        isTransitioning && "opacity-50 cursor-not-allowed"
      )}
      title={`Current mode: ${modeConfig.name}. Click to switch.`}
    >
      <span className="text-base">{modeConfig.icon}</span>
      <span>{currentMode === 'chat' ? 'Chat' : 'Agent'}</span>
      {isTransitioning && (
        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
      )}
    </button>
  );
}