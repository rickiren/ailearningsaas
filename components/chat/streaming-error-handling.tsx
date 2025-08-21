'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, X, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeIn, SlideInFromBottom } from './smooth-animations';

export interface StreamingError {
  type: 'network' | 'timeout' | 'server' | 'parsing' | 'unknown';
  message: string;
  timestamp: Date;
  retryable: boolean;
  details?: string;
}

interface StreamingErrorHandlerProps {
  error: StreamingError | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function StreamingErrorHandler({ 
  error, 
  onRetry, 
  onDismiss, 
  className 
}: StreamingErrorHandlerProps) {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return <WifiOff className="w-4 h-4" />;
      case 'timeout':
        return <Clock className="w-4 h-4" />;
      case 'server':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getErrorColor = () => {
    switch (error.type) {
      case 'network':
        return 'border-orange-200 bg-orange-50 text-orange-700';
      case 'timeout':
        return 'border-yellow-200 bg-yellow-50 text-yellow-700';
      case 'server':
        return 'border-red-200 bg-red-50 text-red-700';
      default:
        return 'border-red-200 bg-red-50 text-red-700';
    }
  };

  const getRetryButtonColor = () => {
    switch (error.type) {
      case 'network':
        return 'text-orange-600 hover:text-orange-800 hover:bg-orange-100';
      case 'timeout':
        return 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100';
      case 'server':
        return 'text-red-600 hover:text-red-800 hover:bg-red-100';
      default:
        return 'text-red-600 hover:text-red-800 hover:bg-red-100';
    }
  };

  return (
    <FadeIn>
      <div className={cn(
        "p-4 border rounded-lg flex items-start gap-3",
        getErrorColor(),
        className
      )}>
        <div className="flex-shrink-0 mt-0.5">
          {getErrorIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium">
              {error.type === 'network' && 'Connection Issue'}
              {error.type === 'timeout' && 'Request Timeout'}
              {error.type === 'server' && 'Server Error'}
              {error.type === 'parsing' && 'Response Error'}
              {error.type === 'unknown' && 'Unexpected Error'}
            </h4>
            <span className="text-xs opacity-75">
              {error.timestamp.toLocaleTimeString()}
            </span>
          </div>
          
          <p className="text-sm mb-2">{error.message}</p>
          
          {error.details && (
            <details className="text-xs opacity-75 mb-3">
              <summary className="cursor-pointer hover:opacity-100">
                Technical details
              </summary>
              <div className="mt-1 p-2 bg-black/5 rounded">
                {error.details}
              </div>
            </details>
          )}
          
          <div className="flex items-center gap-2">
            {error.retryable && onRetry && (
              <button
                onClick={onRetry}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 text-xs rounded transition-all duration-200 hover:scale-105",
                  getRetryButtonColor()
                )}
              >
                <RefreshCw className="w-3 h-3" />
                Try Again
              </button>
            )}
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-all duration-200"
              >
                <X className="w-3 h-3" />
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

// Connection status indicator
export function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
      isConnected 
        ? "bg-green-50 text-green-700 border border-green-200" 
        : "bg-red-50 text-red-700 border border-red-200"
    )}>
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3" />
          Connected
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          Disconnected
        </>
      )}
    </div>
  );
}

// Stream health monitor
export function StreamHealthMonitor({ 
  isStreaming,
  bytesReceived = 0,
  chunksReceived = 0,
  timeElapsed = 0,
  expectedDuration = 0
}: {
  isStreaming: boolean;
  bytesReceived?: number;
  chunksReceived?: number;
  timeElapsed?: number;
  expectedDuration?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isStreaming) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getHealthStatus = () => {
    if (timeElapsed > 30000) return { status: 'slow', color: 'text-amber-600' };
    if (chunksReceived === 0 && timeElapsed > 5000) return { status: 'stalled', color: 'text-red-600' };
    return { status: 'healthy', color: 'text-green-600' };
  };

  const health = getHealthStatus();

  return (
    <SlideInFromBottom>
      <div className="text-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded-full transition-all duration-200 hover:scale-105"
        >
          <div className={cn("w-2 h-2 rounded-full animate-pulse", health.color.replace('text-', 'bg-'))} />
          <span>Streaming</span>
          <span className="text-slate-500">({formatTime(timeElapsed)})</span>
        </button>
        
        {isExpanded && (
          <FadeIn>
            <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span>Data received:</span>
                <span className="font-mono">{formatBytes(bytesReceived)}</span>
              </div>
              <div className="flex justify-between">
                <span>Chunks:</span>
                <span className="font-mono">{chunksReceived}</span>
              </div>
              <div className="flex justify-between">
                <span>Speed:</span>
                <span className="font-mono">
                  {timeElapsed > 0 ? `${((bytesReceived / 1024) / (timeElapsed / 1000)).toFixed(1)} KB/s` : '0 KB/s'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={cn("font-medium", health.color)}>{health.status}</span>
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    </SlideInFromBottom>
  );
}

// Retry logic hook
export function useStreamRetry() {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const maxRetries = 3;

  const retry = async (operation: () => Promise<void>) => {
    if (retryCount >= maxRetries) {
      throw new Error(`Max retries (${maxRetries}) exceeded`);
    }

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      await operation();
      // Reset count on success
      setRetryCount(0);
    } finally {
      setIsRetrying(false);
    }
  };

  const reset = () => {
    setRetryCount(0);
    setIsRetrying(false);
  };

  return {
    retry,
    reset,
    retryCount,
    isRetrying,
    canRetry: retryCount < maxRetries
  };
}

// Error classification utility
export function classifyStreamingError(error: Error | string): StreamingError {
  const message = typeof error === 'string' ? error : error.message;
  const details = typeof error === 'object' ? error.stack : undefined;

  // Network errors
  if (message.includes('fetch') || message.includes('network') || message.includes('NetworkError')) {
    return {
      type: 'network',
      message: 'Network connection failed. Please check your internet connection.',
      timestamp: new Date(),
      retryable: true,
      details
    };
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('aborted')) {
    return {
      type: 'timeout',
      message: 'Request timed out. The AI took too long to respond.',
      timestamp: new Date(),
      retryable: true,
      details
    };
  }

  // Server errors
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return {
      type: 'server',
      message: 'Server error occurred. Please try again in a moment.',
      timestamp: new Date(),
      retryable: true,
      details
    };
  }

  // Parsing errors
  if (message.includes('JSON') || message.includes('parse')) {
    return {
      type: 'parsing',
      message: 'Response format error. The AI response was malformed.',
      timestamp: new Date(),
      retryable: false,
      details
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    message: message || 'An unexpected error occurred during streaming.',
    timestamp: new Date(),
    retryable: true,
    details
  };
}