'use client';

import { useState, useEffect } from 'react';
import { Bot, Brain, Zap, CheckCircle, Clock, FileText, Map, Sparkles, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeIn, SmoothHeight } from './smooth-animations';

// Real-time typing indicator that shows immediately
export function RealTimeTypingIndicator({ 
  isVisible, 
  message = "AI is typing...",
  variant = 'default'
}: { 
  isVisible: boolean, 
  message?: string,
  variant?: 'default' | 'thinking' | 'working' | 'creating'
}) {
  if (!isVisible) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'thinking':
        return {
          bgColor: 'from-purple-50 to-pink-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-700',
          icon: <Brain className="h-4 w-4 animate-pulse" />
        };
      case 'working':
        return {
          bgColor: 'from-amber-50 to-orange-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-700',
          icon: <Zap className="h-4 w-4 animate-pulse" />
        };
      case 'creating':
        return {
          bgColor: 'from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          icon: <Sparkles className="h-4 w-4 animate-pulse" />
        };
      default:
        return {
          bgColor: 'from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          icon: <Bot className="h-4 w-4 animate-pulse" />
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <FadeIn>
      <div className="flex gap-4 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200 shadow-sm">
          <Bot className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-slate-800">AI Learning Assistant</span>
            <span className="text-xs text-slate-500">{variant}...</span>
          </div>
          <div className={cn(
            "flex items-center gap-3 px-4 py-3 border rounded-xl",
            `bg-gradient-to-r ${styles.bgColor}`,
            styles.borderColor
          )}>
            {styles.icon}
            <span className={cn("text-sm font-medium", styles.textColor)}>
              {message}
            </span>
            <div className="flex items-center space-x-1 ml-auto">
              <div className="w-1 h-1 bg-current rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

// Live streaming statistics
export function StreamingStats({ 
  charsReceived = 0,
  wordsReceived = 0,
  timeElapsed = 0,
  estimatedTimeRemaining = 0,
  isVisible = false
}: {
  charsReceived?: number;
  wordsReceived?: number;
  timeElapsed?: number;
  estimatedTimeRemaining?: number;
  isVisible?: boolean;
}) {
  if (!isVisible) return null;

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const getStreamingSpeed = () => {
    if (timeElapsed === 0) return 0;
    return Math.round((charsReceived / (timeElapsed / 1000)) * 10) / 10;
  };

  return (
    <FadeIn>
      <div className="flex items-center justify-center gap-4 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          <span>{getStreamingSpeed()} chars/sec</span>
        </div>
        <div className="w-px h-4 bg-slate-300" />
        <span>{charsReceived} chars</span>
        <div className="w-px h-4 bg-slate-300" />
        <span>{wordsReceived} words</span>
        <div className="w-px h-4 bg-slate-300" />
        <span>{formatTime(timeElapsed)}</span>
        {estimatedTimeRemaining > 0 && (
          <>
            <div className="w-px h-4 bg-slate-300" />
            <span>~{formatTime(estimatedTimeRemaining)} remaining</span>
          </>
        )}
      </div>
    </FadeIn>
  );
}

// Advanced progress indicator with realistic stages
export function StreamingProgressIndicator({ 
  stage,
  progress = 0,
  isVisible = false,
  showStats = false,
  charsReceived = 0,
  timeElapsed = 0
}: {
  stage: string;
  progress?: number;
  isVisible?: boolean;
  showStats?: boolean;
  charsReceived?: number;
  timeElapsed?: number;
}) {
  if (!isVisible) return null;

  const stages = [
    { id: 'connecting', label: 'Connecting to AI...', icon: Clock, color: 'text-blue-600' },
    { id: 'analyzing', label: 'Analyzing your request...', icon: Brain, color: 'text-purple-600' },
    { id: 'planning', label: 'Planning response...', icon: Map, color: 'text-indigo-600' },
    { id: 'streaming', label: 'Generating response...', icon: Zap, color: 'text-blue-600' },
    { id: 'tool-starting', label: 'Preparing tools...', icon: Clock, color: 'text-amber-600' },
    { id: 'tool-executing', label: 'Executing tools...', icon: Zap, color: 'text-amber-600' },
    { id: 'tool-completed', label: 'Tools completed...', icon: CheckCircle, color: 'text-green-600' },
    { id: 'creating', label: 'Creating content...', icon: FileText, color: 'text-green-600' },
    { id: 'complete', label: 'Response complete!', icon: CheckCircle, color: 'text-green-600' },
    { id: 'error', label: 'Error occurred', icon: AlertTriangle, color: 'text-red-600' }
  ];

  const currentStage = stages.find(s => s.id === stage) || stages[0];
  const currentIndex = stages.findIndex(s => s.id === stage);

  return (
    <FadeIn>
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <currentStage.icon className={cn("h-4 w-4 animate-pulse", currentStage.color)} />
          <span className={cn("text-sm font-medium", currentStage.color)}>
            {currentStage.label}
          </span>
          <div className="ml-auto text-xs text-slate-500">
            {Math.round(progress)}%
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2 mb-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>

        {/* Stage Mini-Timeline */}
        <div className="flex justify-between text-xs mb-3">
          {stages.slice(0, 6).map((stageItem, index) => {
            const isActive = index <= currentIndex;
            const isCurrent = stageItem.id === stage;
            
            return (
              <div 
                key={stageItem.id}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-300",
                  isActive ? stageItem.color : "text-slate-400"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  isActive ? "bg-current" : "bg-slate-300",
                  isCurrent ? "scale-150" : "scale-100"
                )} />
              </div>
            );
          })}
        </div>
        
        {/* Live Stats */}
        {showStats && (
          <SmoothHeight>
            <div className="pt-3 border-t border-slate-200">
              <StreamingStats 
                charsReceived={charsReceived}
                wordsReceived={Math.round(charsReceived / 5)} // Rough estimate
                timeElapsed={timeElapsed}
                isVisible={true}
              />
            </div>
          </SmoothHeight>
        )}
      </div>
    </FadeIn>
  );
}

// Streaming quality indicator
export function StreamingQualityIndicator({ 
  latency = 0,
  chunkSize = 0,
  consistency = 100,
  isVisible = false
}: {
  latency?: number;
  chunkSize?: number;
  consistency?: number;
  isVisible?: boolean;
}) {
  if (!isVisible) return null;

  const getQualityLevel = () => {
    const score = (consistency / 100) * 0.4 + 
                  (Math.max(0, 100 - latency) / 100) * 0.3 +
                  (Math.min(chunkSize, 1000) / 1000) * 0.3;
    
    if (score > 0.8) return { level: 'excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score > 0.6) return { level: 'good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score > 0.4) return { level: 'fair', color: 'text-amber-600', bg: 'bg-amber-100' };
    return { level: 'poor', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const quality = getQualityLevel();

  return (
    <FadeIn>
      <div className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium",
        quality.bg,
        quality.color
      )}>
        <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
        <span>Stream quality: {quality.level}</span>
      </div>
    </FadeIn>
  );
}