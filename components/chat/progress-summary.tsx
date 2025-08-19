import { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Code, Plus, Edit, Database, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToolExecution } from './tool-execution-progress';

interface ProgressSummaryProps {
  executions: ToolExecution[];
  className?: string;
}

interface ToolGroup {
  category: string;
  tools: ToolExecution[];
  icon: React.ReactNode;
  color: string;
}

const toolCategories: Record<string, { icon: React.ReactNode; color: string; name: string }> = {
  file_operations: {
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    name: 'File Operations'
  },
  code_generation: {
    icon: <Code className="h-4 w-4" />,
    color: 'bg-green-100 text-green-700 border-green-200',
    name: 'Code Generation'
  },
  artifact_management: {
    icon: <Plus className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    name: 'Artifact Management'
  },
  database_operations: {
    icon: <Database className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    name: 'Database Operations'
  },
  system_operations: {
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    name: 'System Operations'
  }
};

const categorizeTool = (toolId: string): string => {
  if (toolId.includes('file')) return 'file_operations';
  if (toolId.includes('artifact')) return 'artifact_management';
  if (toolId.includes('database') || toolId.includes('query')) return 'database_operations';
  if (toolId.includes('system') || toolId.includes('config')) return 'system_operations';
  return 'code_generation';
};

export function ProgressSummary({ executions, className }: ProgressSummaryProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  if (executions.length === 0) return null;

  // Group tools by category
  const toolGroups: ToolGroup[] = Object.entries(
    executions.reduce((acc, execution) => {
      const category = categorizeTool(execution.toolId);
      if (!acc[category]) acc[category] = [];
      acc[category].push(execution);
      return acc;
    }, {} as Record<string, ToolExecution[]>)
  ).map(([category, tools]) => ({
    category,
    tools,
    ...toolCategories[category] || toolCategories.system_operations
  }));

  // Calculate summary statistics
  const totalTools = executions.length;
  const successfulTools = executions.filter(t => t.status === 'success').length;
  const failedTools = executions.filter(t => t.status === 'error').length;
  const totalDuration = executions.reduce((sum, t) => {
    const duration = (t.endTime || Date.now()) - t.startTime;
    return sum + duration;
  }, 0);

  const toggleSection = (category: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className={cn(
      "space-y-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm",
      className
    )}>
      {/* Summary Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">
          Execution Summary
        </h3>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>{totalTools} tools used</span>
          <span>•</span>
          <span className="text-green-600">{successfulTools} successful</span>
          {failedTools > 0 && (
            <>
              <span>•</span>
              <span className="text-red-600">{failedTools} failed</span>
            </>
          )}
          <span>•</span>
          <span>{Math.round(totalDuration / 1000)}s total</span>
        </div>
      </div>

      {/* Tool Categories */}
      <div className="space-y-3">
        {toolGroups.map((group) => {
          const isExpanded = expandedSections.has(group.category);
          const groupSuccessCount = group.tools.filter(t => t.status === 'success').length;
          const groupTotalCount = group.tools.length;

          return (
            <div key={group.category} className="border border-slate-200 rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleSection(group.category)}
                className={cn(
                  "w-full flex items-center justify-between p-3 transition-colors hover:bg-slate-50",
                  group.color
                )}
              >
                <div className="flex items-center gap-3">
                  {group.icon}
                  <span className="font-medium">{group.name}</span>
                  <span className="text-sm opacity-75">
                    ({groupSuccessCount}/{groupTotalCount})
                  </span>
                </div>
                
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {/* Expandable Content */}
              {isExpanded && (
                <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
                  {group.tools.map((tool) => (
                    <div key={tool.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{tool.toolName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">
                          {Math.round(((tool.endTime || Date.now()) - tool.startTime) / 1000)}s
                        </span>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          tool.status === 'success' && "bg-green-500",
                          tool.status === 'error' && "bg-red-500",
                          tool.status === 'running' && "bg-blue-500",
                          tool.status === 'pending' && "bg-slate-400"
                        )} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Final Status */}
      <div className={cn(
        "p-3 rounded-lg text-center font-medium",
        failedTools === 0 
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-yellow-50 text-yellow-700 border border-yellow-200"
      )}>
        {failedTools === 0 
          ? `✅ All ${totalTools} tools completed successfully in ${Math.round(totalDuration / 1000)}s`
          : `⚠️ ${successfulTools}/${totalTools} tools completed successfully (${failedTools} failed)`
        }
      </div>
    </div>
  );
}
