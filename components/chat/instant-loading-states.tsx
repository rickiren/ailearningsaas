'use client';

import { useState, useEffect } from 'react';
import { Bot, Sparkles, Brain, Zap, CheckCircle, Clock, FileText, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

// Instant Message Bubble Animation
export function MessageBubbleAppearing({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn(
      "animate-in slide-in-from-bottom-3 fade-in duration-300 ease-out",
      className
    )}>
      {children}
    </div>
  );
}

// Instant Typing Indicator that shows immediately
export function InstantTypingIndicator({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <MessageBubbleAppearing>
      <div className="flex gap-4 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200 shadow-sm">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-slate-800">AI Learning Assistant</span>
            <span className="text-xs text-slate-500">thinking...</span>
          </div>
          <div className="flex items-center space-x-1.5 px-4 py-3 bg-slate-100 rounded-2xl max-w-fit">
            <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </MessageBubbleAppearing>
  );
}

// Expanding Container Animation
export function ExpandingContainer({ children, isExpanding }: { children: React.ReactNode, isExpanding: boolean }) {
  return (
    <div className={cn(
      "transition-all duration-500 ease-out overflow-hidden",
      isExpanding ? "animate-in slide-in-from-bottom-2 fade-in" : ""
    )}>
      {children}
    </div>
  );
}

// Progress Hints Component
export function ProgressHints({ stage, progress = 0 }: { stage: string, progress?: number }) {
  const stages = [
    { id: 'analyzing', label: 'Analyzing your request...', icon: Brain },
    { id: 'planning', label: 'Planning learning structure...', icon: Map },
    { id: 'creating', label: 'Creating course modules...', icon: FileText },
    { id: 'optimizing', label: 'Optimizing content flow...', icon: Zap },
    { id: 'finalizing', label: 'Finalizing your learning path...', icon: CheckCircle }
  ];

  const currentStage = stages.find(s => s.id === stage) || stages[0];
  const currentIndex = stages.findIndex(s => s.id === stage);

  return (
    <MessageBubbleAppearing>
      <div className="flex gap-4 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200 shadow-sm">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm font-medium text-slate-800">AI Learning Assistant</span>
            <span className="text-xs text-slate-500">working...</span>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <currentStage.icon className="h-4 w-4 text-blue-600 animate-pulse" />
              <span className="text-sm font-medium text-blue-700">{currentStage.label}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.max(progress, (currentIndex + 1) * 20)}%` }}
              />
            </div>
            
            {/* Stage Indicators */}
            <div className="flex justify-between text-xs">
              {stages.map((stageItem, index) => {
                const isActive = index <= currentIndex;
                const isCurrent = stageItem.id === stage;
                
                return (
                  <div 
                    key={stageItem.id}
                    className={cn(
                      "flex flex-col items-center gap-1 transition-all duration-300",
                      isActive ? "text-blue-600" : "text-slate-400"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                      isActive ? "border-blue-500 bg-blue-100" : "border-slate-300",
                      isCurrent ? "scale-110 border-blue-600 bg-blue-200" : ""
                    )}>
                      <stageItem.icon className="h-3 w-3" />
                    </div>
                    <span className="text-xs font-medium">{stageItem.label.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </MessageBubbleAppearing>
  );
}

// Smart Progress Simulator
export function useProgressSimulation(isActive: boolean) {
  const [stage, setStage] = useState<string>('analyzing');
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!isActive) {
      setStage('analyzing');
      setProgress(0);
      return;
    }

    const stages = [
      { id: 'analyzing', duration: 2000 },
      { id: 'planning', duration: 3000 },
      { id: 'creating', duration: 5000 },
      { id: 'optimizing', duration: 2000 },
      { id: 'finalizing', duration: 1000 }
    ];

    let currentStageIndex = 0;
    let stageStartTime = Date.now();

    const updateProgress = () => {
      const currentStage = stages[currentStageIndex];
      if (!currentStage) return;

      const elapsed = Date.now() - stageStartTime;
      const stageProgress = Math.min(elapsed / currentStage.duration, 1);
      const overallProgress = ((currentStageIndex + stageProgress) / stages.length) * 100;

      setProgress(overallProgress);

      if (stageProgress >= 1 && currentStageIndex < stages.length - 1) {
        currentStageIndex++;
        setStage(stages[currentStageIndex].id);
        stageStartTime = Date.now();
      }
    };

    setStage(stages[0].id);
    const interval = setInterval(updateProgress, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  return { stage, progress };
}

// Enhanced Input Loading State
export function InputLoadingState({ message }: { message?: string }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}} />
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}} />
          </div>
          <span className="text-sm text-slate-700 font-medium">
            {message || 'AI is thinking about your request...'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Instant Response Acknowledgment
export function InstantAcknowledgment({ userMessage }: { userMessage: string }) {
  const getAcknowledgmentMessage = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('learn') || lowerMessage.includes('course') || lowerMessage.includes('path')) {
      return "I'll create a comprehensive learning path for you...";
    }
    if (lowerMessage.includes('javascript') || lowerMessage.includes('programming')) {
      return "Great choice! Let me design a JavaScript learning journey...";
    }
    if (lowerMessage.includes('beginner') || lowerMessage.includes('new')) {
      return "Perfect for beginners! I'll start with the fundamentals...";
    }
    if (lowerMessage.includes('advanced') || lowerMessage.includes('expert')) {
      return "I'll create an advanced curriculum for you...";
    }
    return "Let me analyze your request and create something amazing...";
  };

  return (
    <MessageBubbleAppearing>
      <div className="flex gap-4 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border bg-gradient-to-br from-green-500 to-green-600 text-white border-green-200 shadow-sm">
          <CheckCircle className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-slate-800">AI Learning Assistant</span>
            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">Received</span>
          </div>
          <div className="text-sm text-slate-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            {getAcknowledgmentMessage(userMessage)}
          </div>
        </div>
      </div>
    </MessageBubbleAppearing>
  );
}