'use client';

import { useState } from 'react';
import { Shield, Zap, Info, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatMode } from '@/hooks/use-chat-mode';
import { FadeIn, SmoothHeight } from './smooth-animations';

export function ModeStatusIndicator({ 
  showDetails = false,
  compact = false 
}: { 
  showDetails?: boolean;
  compact?: boolean;
}) {
  const { currentMode, modeConfig, lastTransition, isInChatMode, isInAgentMode } = useChatMode();
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
        modeConfig.bgColor,
        modeConfig.color,
        "border",
        isInChatMode ? "border-blue-200" : "border-emerald-200"
      )}>
        <span className="text-sm">{modeConfig.icon}</span>
        <span>{modeConfig.name}</span>
        {isInChatMode && <Shield className="w-3 h-3" />}
        {isInAgentMode && <Zap className="w-3 h-3" />}
      </div>
    );
  }

  return (
    <FadeIn>
      <div className={cn(
        "border rounded-lg p-4 transition-all duration-200",
        modeConfig.bgColor,
        isInChatMode ? "border-blue-200" : "border-emerald-200"
      )}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-white text-xl",
              isInChatMode ? "bg-blue-500" : "bg-emerald-500"
            )}>
              {modeConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={cn("font-semibold", modeConfig.color)}>
                  {modeConfig.name}
                </h3>
                <div className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  isInChatMode ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                )}>
                  Active
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{modeConfig.description}</p>
              {lastTransition && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Switched {new Date(lastTransition).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          
          {showDetails && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Status Icons */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            {isInChatMode ? (
              <>
                <Shield className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600">Read-only mode</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-emerald-500" />
                <span className="text-gray-600">Full access</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>{modeConfig.capabilities.length} capabilities</span>
          </div>
          
          {modeConfig.restrictions.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <AlertCircle className="w-3 h-3 text-amber-500" />
              <span>{modeConfig.restrictions.length} restrictions</span>
            </div>
          )}
        </div>

        {/* Detailed Information */}
        <SmoothHeight>
          {expanded && showDetails && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              {/* Capabilities */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">What I can do:</h4>
                <div className="grid grid-cols-1 gap-1">
                  {modeConfig.capabilities.map((capability, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span>{capability}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Restrictions */}
              {modeConfig.restrictions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Restrictions:</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {modeConfig.restrictions.map((restriction, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <span>{restriction}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode-specific tips */}
              <div className={cn(
                "p-3 rounded-lg text-sm",
                isInChatMode ? "bg-blue-50 text-blue-800" : "bg-emerald-50 text-emerald-800"
              )}>
                <h4 className="font-medium mb-1">
                  {isInChatMode ? "💡 Chat Mode Tips:" : "🚀 Agent Mode Tips:"}
                </h4>
                {isInChatMode ? (
                  <p>Ask questions about code, request explanations, or discuss architectural decisions. Switch to Agent Mode when you're ready to make changes.</p>
                ) : (
                  <p>I can now read, write, and modify your code. Tell me what you'd like to build or change, and I'll get to work!</p>
                )}
              </div>
            </div>
          )}
        </SmoothHeight>
      </div>
    </FadeIn>
  );
}

// Floating status indicator for persistent display
export function FloatingModeIndicator() {
  const { currentMode, modeConfig, isInChatMode } = useChatMode();
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-full shadow-lg backdrop-blur-sm",
        isInChatMode 
          ? "bg-blue-100/90 text-blue-800 border border-blue-200" 
          : "bg-emerald-100/90 text-emerald-800 border border-emerald-200"
      )}>
        <span className="text-sm">{modeConfig.icon}</span>
        <span className="text-xs font-medium">{modeConfig.name}</span>
        <button
          onClick={() => setVisible(false)}
          className="ml-1 text-current hover:bg-black/5 rounded-full p-0.5"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Mode warning banner for important messages
export function ModeWarningBanner({ 
  message,
  type = 'warning',
  onDismiss 
}: {
  message: string;
  type?: 'warning' | 'error' | 'info';
  onDismiss?: () => void;
}) {
  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-amber-50 border-amber-200 text-amber-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <FadeIn>
      <div className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        getTypeStyles()
      )}>
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 text-sm">
          {message}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-current hover:bg-black/5 rounded p-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </FadeIn>
  );
}