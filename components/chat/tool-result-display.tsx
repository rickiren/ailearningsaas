import { CheckCircle, XCircle, Clock, FileText, Code, Edit, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolExecution {
  toolId: string;
  toolName: string;
  success: boolean;
  result?: any;
  error?: string;
}

interface ToolResultDisplayProps {
  toolExecution: ToolExecution;
}

const toolIcons: Record<string, React.ReactNode> = {
  create_artifact: <Plus className="h-4 w-4" />,
  update_artifact: <Edit className="h-4 w-4" />,
  read_file: <FileText className="h-4 w-4" />,
  write_file: <Code className="h-4 w-4" />,
};

const toolNames: Record<string, string> = {
  create_artifact: 'Create Artifact',
  update_artifact: 'Update Artifact',
  read_file: 'Read File',
  write_file: 'Write File',
};

export function ToolResultDisplay({ toolExecution }: ToolResultDisplayProps) {
  const { toolId, toolName, success, result, error } = toolExecution;
  
  return (
    <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        {success ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <XCircle className="h-4 w-4 text-red-600" />
        )}
        
        <div className="flex items-center gap-2">
          {toolIcons[toolName] || <Code className="h-4 w-4" />}
          <span className="text-sm font-medium text-slate-700">
            {toolNames[toolName] || toolName}
          </span>
        </div>
        
        <span className={cn(
          "text-xs px-2 py-1 rounded-full font-medium",
          success 
            ? "bg-green-100 text-green-700" 
            : "bg-red-100 text-red-700"
        )}>
          {success ? 'Success' : 'Failed'}
        </span>
      </div>
      
      {success && result && (
        <div className="text-sm text-slate-600 space-y-1">
          {result.message && (
            <p className="font-medium">{result.message}</p>
          )}
          
          {result.path && (
            <p className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded">
              {result.path}
            </p>
          )}
          
          {result.type && (
            <p className="text-xs">
              <span className="text-slate-500">Type:</span> {result.type}
            </p>
          )}
          
          {result.contentLength && (
            <p className="text-xs">
              <span className="text-slate-500">Content length:</span> {result.contentLength} characters
            </p>
          )}
          
          {result.totalLines && (
            <p className="text-xs">
              <span className="text-slate-500">Total lines:</span> {result.totalLines}
            </p>
          )}
        </div>
      )}
      
      {!success && error && (
        <div className="text-sm text-red-600">
          <p className="font-medium">Error:</p>
          <p className="text-xs bg-red-50 px-2 py-1 rounded border border-red-200">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

interface ToolExecutionStatusProps {
  status: 'starting' | 'completed';
  toolCount: number;
}

export function ToolExecutionStatus({ status, toolCount }: ToolExecutionStatusProps) {
  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-700">
          {status === 'starting' 
            ? `Executing ${toolCount} tool${toolCount > 1 ? 's' : ''}...`
            : `Completed ${toolCount} tool execution${toolCount > 1 ? 's' : ''}`
          }
        </span>
      </div>
    </div>
  );
}
