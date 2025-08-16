'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AIEditingFeedbackProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'loading';
  duration?: number;
  onClose?: () => void;
}

export function AIEditingFeedback({ 
  message, 
  type, 
  duration = 3000, 
  onClose 
}: AIEditingFeedbackProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (type !== 'loading' && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [type, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'loading':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'loading':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'info':
        return 'text-blue-800';
      case 'loading':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border shadow-lg transition-all duration-300 ease-in-out',
      getBackgroundColor(),
      'animate-in slide-in-from-right-full'
    )}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', getTextColor())}>
            {message}
          </p>
        </div>
        {type !== 'loading' && (
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Hook for managing AI editing feedback
export function useAIEditingFeedback() {
  const [feedbacks, setFeedbacks] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'loading';
    duration?: number;
  }>>([]);

  const addFeedback = (message: string, type: 'success' | 'error' | 'info' | 'loading', duration?: number) => {
    const id = crypto.randomUUID();
    setFeedbacks(prev => [...prev, { id, message, type, duration }]);
    return id;
  };

  const removeFeedback = (id: string) => {
    setFeedbacks(prev => prev.filter(f => f.id !== id));
  };

  const updateFeedback = (id: string, updates: Partial<{ message: string; type: 'success' | 'error' | 'info' | 'loading' }>) => {
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const clearAll = () => {
    setFeedbacks([]);
  };

  return {
    feedbacks,
    addFeedback,
    removeFeedback,
    updateFeedback,
    clearAll
  };
}
