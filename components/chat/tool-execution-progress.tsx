import { useState, useEffect } from 'react';
import { FileText, Code, Edit, Plus, Database, Search, Settings, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge, StatusType } from './status-badge';

export interface ToolExecution {
  id: string;
  toolName: string;
  toolId: string;
  status: StatusType;
  startTime: number;
  endTime?: number;
  result?: any;
  error?: string;
  progress?: number;
}

interface ToolExecutionProgressProps {
  executions: ToolExecution[];
  isActive: boolean;
  className?: string;
}

const toolIcons: Record<string, React.ReactNode> = {
  read_file: <FileText className="h-4 w-4" />,
  write_file: <Code className="h-4 w-4" />,
  create_artifact: <Plus className="h-4 w-4" />,
  update_artifact: <Edit className="h-4 w-4" />,
  search_files: <Search className="h-4 w-4" />,
  database_query: <Database className="h-4 w-4" />,
  system_config: <Settings className="h-4 w-4" />,
  execute_code: <Zap className="h-4 w-4" />,
};

const toolDisplayNames: Record<string, string> = {
  read_file: 'Reading files',
  write_file: 'Creating component',
  create_artifact: 'Creating artifact',
  update_artifact: 'Updating artifact',
  search_files: 'Searching files',
  database_query: 'Querying database',
  system_config: 'Configuring system',
  execute_code: 'Executing code',
};

export function ToolExecutionProgress({ executions, isActive, className }: ToolExecutionProgressProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  if (!isActive || executions.length === 0) return null;

  const getExecutionDuration = (startTime: number, endTime?: number) => {
    const end = endTime || currentTime;
    const duration = end - startTime;
    if (duration < 1000) return '<1s';
    return `${Math.round(duration / 1000)}s`;
  };

  const getProgressPercentage = (execution: ToolExecution) => {
    if (execution.status === 'success' || execution.status === 'error') return 100;
    if (execution.status === 'pending') return 0;
    
    // For running status, show progress based on time elapsed
    const elapsed = currentTime - execution.startTime;
    const estimatedDuration = 2000; // 2 seconds estimated
    return Math.min(Math.round((elapsed / estimatedDuration) * 100), 95);
  };

  return (
    <div className={cn(
      "space-y-3 p-4 bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-xl shadow-sm",
      className
    )}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-800">
          Tool Execution Progress
        </h4>
        <StatusBadge 
          status={isActive ? 'running' : 'success'} 
          text={isActive ? 'Active' : 'Complete'}
          size="sm"
        />
      </div>

      <div className="space-y-2">
        {executions.map((execution) => {
          const Icon = toolIcons[execution.toolId] || <Code className="h-4 w-4" />;
          const displayName = toolDisplayNames[execution.toolId] || execution.toolName;
          const progress = getProgressPercentage(execution);
          const duration = getExecutionDuration(execution.startTime, execution.endTime);

          return (
            <div key={execution.id} className="space-y-2">
              {/* Tool Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-slate-600">
                    {Icon}
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {displayName}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {duration}
                  </span>
                  <StatusBadge 
                    status={execution.status} 
                    size="sm"
                  />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-300 ease-out",
                    execution.status === 'success' && "bg-green-500",
                    execution.status === 'error' && "bg-red-500",
                    execution.status === 'running' && "bg-blue-500",
                    execution.status === 'pending' && "bg-slate-300"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Result Summary */}
              {execution.status === 'success' && execution.result && (
                <div className="text-xs text-slate-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                  <span className="font-medium">✓</span> {execution.result.message || 'Completed successfully'}
                </div>
              )}

              {execution.status === 'error' && execution.error && (
                <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                  <span className="font-medium">✗</span> {execution.error}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
