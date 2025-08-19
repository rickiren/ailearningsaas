import { Brain, Cog, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThinkingStatus {
  status: 'active' | 'completed';
  message: string;
}

interface ToolExecutionStatus {
  status: 'starting' | 'executing' | 'completed' | 'failed';
  toolCount?: number;
  currentTool?: string;
  currentIndex?: number;
  totalTools?: number;
  message: string;
}

interface ThinkingIndicatorProps {
  thinking?: ThinkingStatus;
  toolExecution?: ToolExecutionStatus;
  className?: string;
}

export function ThinkingIndicator({ thinking, toolExecution, className }: ThinkingIndicatorProps) {
  if (!thinking && !toolExecution) return null;

  return (
    <div className={cn("flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg", className)}>
      {/* Thinking Status */}
      {thinking && (
        <div className="flex items-center gap-2">
          {thinking.status === 'active' ? (
            <Brain className="h-4 w-4 text-blue-600 animate-pulse" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <span className="text-sm font-medium text-blue-700">
            {thinking.message}
          </span>
        </div>
      )}

      {/* Tool Execution Status */}
      {toolExecution && (
        <div className="flex items-center gap-2">
          {toolExecution.status === 'starting' && (
            <Clock className="h-4 w-4 text-blue-600" />
          )}
          {toolExecution.status === 'executing' && (
            <Zap className="h-4 w-4 text-blue-600 animate-pulse" />
          )}
          {toolExecution.status === 'completed' && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          {toolExecution.status === 'failed' && (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
          
          <span className="text-sm font-medium text-blue-700">
            {toolExecution.message}
          </span>
          
          {/* Show progress for executing status */}
          {toolExecution.status === 'executing' && toolExecution.currentIndex && toolExecution.totalTools && (
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {toolExecution.currentIndex}/{toolExecution.totalTools}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Enhanced tool execution progress component
export function ToolExecutionProgress({ toolExecution }: { toolExecution: ToolExecutionStatus }) {
  if (!toolExecution) return null;

  const getProgressPercentage = () => {
    if (toolExecution.status === 'starting') return 0;
    if (toolExecution.status === 'completed') return 100;
    if (toolExecution.status === 'failed') return 100;
    if (toolExecution.currentIndex && toolExecution.totalTools) {
      return (toolExecution.currentIndex / toolExecution.totalTools) * 100;
    }
    return 50; // Default to 50% for executing without specific progress
  };

  const progressPercentage = getProgressPercentage();

  return (
    <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {toolExecution.status === 'starting' && <Clock className="h-4 w-4 text-blue-600" />}
          {toolExecution.status === 'executing' && <Zap className="h-4 w-4 text-blue-600 animate-pulse" />}
          {toolExecution.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-600" />}
          {toolExecution.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
          
          <span className="text-sm font-medium text-blue-700">
            {toolExecution.message}
          </span>
        </div>
        
        {toolExecution.currentIndex && toolExecution.totalTools && (
          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
            {toolExecution.currentIndex}/{toolExecution.totalTools}
          </span>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Status Details */}
      <div className="mt-2 text-xs text-blue-600">
        {toolExecution.status === 'starting' && 'Preparing to execute tools...'}
        {toolExecution.status === 'executing' && toolExecution.currentTool && 
          `Currently executing: ${toolExecution.currentTool}`}
        {toolExecution.status === 'completed' && 'All tools executed successfully!'}
        {toolExecution.status === 'failed' && 'Some tools failed to execute'}
      </div>
    </div>
  );
}
