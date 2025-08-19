import { useState, useEffect } from 'react';
import { Brain, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThinkingIndicatorProps {
  isThinking: boolean;
  message?: string;
  className?: string;
}

export function ThinkingIndicator({ isThinking, message = "Analyzing your request...", className }: ThinkingIndicatorProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showLightbulb, setShowLightbulb] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isThinking) {
      setElapsedTime(0);
      setShowLightbulb(false);
      
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

      // Show lightbulb after 2 seconds
      const lightbulbTimer = setTimeout(() => {
        setShowLightbulb(true);
      }, 2000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(lightbulbTimer);
      };
    } else {
      setElapsedTime(0);
      setShowLightbulb(false);
    }
  }, [isThinking]);

  if (!isThinking) return null;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm",
      className
    )}>
      {/* Animated Brain Icon */}
      <div className="relative">
        <Brain className={cn(
          "h-6 w-6 text-blue-600 transition-all duration-300",
          isThinking && "animate-pulse"
        )} />
        
        {/* Lightbulb that appears after 2 seconds */}
        {showLightbulb && (
          <Lightbulb 
            className={cn(
              "absolute -top-2 -right-2 h-4 w-4 text-yellow-500 transition-all duration-500",
              "animate-bounce"
            )} 
          />
        )}
      </div>

      {/* Thinking Message */}
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-800">
          {message}
        </p>
        <p className="text-xs text-blue-600">
          Thought for {formatTime(elapsedTime)}
        </p>
      </div>

      {/* Animated Dots */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
    </div>
  );
}
