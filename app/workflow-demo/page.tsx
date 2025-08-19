'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/input';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Zap,
  Workflow,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Brain,
  Rocket,
  Target,
  BarChart3,
  FileText,
  Code,
  Bug,
  Sparkles
} from 'lucide-react';
import { 
  WorkflowPlan, 
  WorkflowStep, 
  WorkflowType 
} from '@/lib/multi-tool-executor';

interface WorkflowStatus {
  id: string;
  status: 'planning' | 'executing' | 'completed' | 'failed' | 'paused';
  progress: number;
  currentStep?: string;
  estimatedTime?: string;
}

export default function WorkflowDemoPage() {
  const [userRequest, setUserRequest] = useState('');
  const [selectedWorkflowType, setSelectedWorkflowType] = useState<WorkflowType>('custom');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowPlan | null>(null);
  const [workflowResult, setWorkflowResult] = useState<any>(null);
  const [workflowSummary, setWorkflowSummary] = useState<string>('');
  const [activeWorkflows, setActiveWorkflows] = useState<WorkflowPlan[]>([]);
  const [workflowHistory, setWorkflowHistory] = useState<WorkflowPlan[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowPlan | null>(null);

  // Predefined example requests
  const exampleRequests = [
    {
      text: "Build a login page with form validation",
      type: 'creation' as WorkflowType,
      description: "Create a complete login page component"
    },
    {
      text: "Fix the styling issues in the header component",
      type: 'debugging' as WorkflowType,
      description: "Debug and fix CSS problems"
    },
    {
      text: "Improve the user profile component with better error handling",
      type: 'enhancement' as WorkflowType,
      description: "Enhance existing component functionality"
    },
    {
      text: "Analyze the project structure and find optimization opportunities",
      type: 'discovery' as WorkflowType,
      description: "Discover project insights and improvements"
    }
  ];

  useEffect(() => {
    // Load workflow status on component mount
    loadWorkflowStatus();
  }, []);

  const loadWorkflowStatus = async () => {
    try {
      const response = await fetch('/api/workflow/status');
      const data = await response.json();
      
      if (data.success) {
        setActiveWorkflows(data.activeWorkflows || []);
        setWorkflowHistory(data.workflowHistory || []);
      }
    } catch (error) {
      console.error('Error loading workflow status:', error);
    }
  };

  const executeComplexRequest = async () => {
    if (!userRequest.trim()) return;

    setIsExecuting(true);
    setCurrentWorkflow(null);
    setWorkflowResult(null);
    setWorkflowSummary('');

    try {
      const response = await fetch('/api/workflow/execute-complex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRequest: userRequest.trim(),
          workflowType: selectedWorkflowType
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCurrentWorkflow(data.plan);
        setWorkflowResult(data.result);
        setWorkflowSummary(data.summary);
        
        // Reload workflow status
        await loadWorkflowStatus();
      } else {
        console.error('Workflow execution failed:', data.error);
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const controlWorkflow = async (action: 'pause' | 'resume' | 'cancel', workflowId: string) => {
    try {
      const response = await fetch('/api/workflow/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, workflowId })
      });

      const data = await response.json();
      
      if (data.success) {
        // Reload workflow status
        await loadWorkflowStatus();
      } else {
        console.error('Workflow control failed:', data.error);
      }
    } catch (error) {
      console.error('Error controlling workflow:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'paused': return <Pause className="w-4 h-4 text-yellow-600" />;
      case 'executing': return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'executing': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'skipped': return <AlertCircle className="w-4 h-4 text-gray-600" />;
      case 'running': return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const selectExample = (example: typeof exampleRequests[0]) => {
    setUserRequest(example.text);
    setSelectedWorkflowType(example.type);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Multi-Tool Execution Demo
          </h1>
          <p className="text-lg text-slate-600">
            AI-powered autonomous workflow execution - like Cursor, but smarter
          </p>
        </div>

        {/* Main Execution Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input and Examples */}
          <div className="space-y-6">
            {/* Request Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI Request
                </CardTitle>
                <CardDescription>
                  Describe what you want the AI to accomplish
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="e.g., Build a login page with form validation, Fix styling issues, Improve error handling..."
                  value={userRequest}
                  onChange={(e) => setUserRequest(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workflow Type
                  </label>
                  <select
                    value={selectedWorkflowType}
                    onChange={(e) => setSelectedWorkflowType(e.target.value as WorkflowType)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="custom">Custom</option>
                    <option value="discovery">Discovery</option>
                    <option value="creation">Creation</option>
                    <option value="debugging">Debugging</option>
                    <option value="enhancement">Enhancement</option>
                  </select>
                </div>

                <Button
                  onClick={executeComplexRequest}
                  disabled={isExecuting || !userRequest.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Execute Request
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Example Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                  Example Requests
                </CardTitle>
                <CardDescription>
                  Try these pre-built examples to see the system in action
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {exampleRequests.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => selectExample(example)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900">{example.text}</div>
                    <div className="text-sm text-gray-600 mt-1">{example.description}</div>
                    <Badge variant="outline" className="mt-2">
                      {example.type}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Current Workflow */}
          <div className="space-y-6">
            {currentWorkflow ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="w-5 h-5 text-blue-600" />
                    Current Workflow
                  </CardTitle>
                  <CardDescription>
                    {currentWorkflow.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(currentWorkflow.status)}>
                      {currentWorkflow.status}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      {currentWorkflow.totalSteps} steps • {currentWorkflow.estimatedDuration}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {currentWorkflow.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3 p-2 rounded border">
                        {getStepStatusIcon(step.status)}
                        <div className="flex-1">
                          <div className="font-medium text-sm">{step.name}</div>
                          <div className="text-xs text-gray-600">{step.description}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {step.tool}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-gray-600" />
                    Ready to Execute
                  </CardTitle>
                  <CardDescription>
                    Enter a request above to see the AI plan and execute a workflow
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8 text-gray-500">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No workflow in progress</p>
                </CardContent>
              </Card>
            )}

            {/* Workflow Result */}
            {workflowResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Execution Result
                  </CardTitle>
                  <CardDescription>
                    Final status and completion details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge className={getStatusColor(workflowResult.status)}>
                        {workflowResult.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed Steps:</span>
                      <span>{workflowResult.completedSteps}/{workflowResult.totalSteps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed Steps:</span>
                      <span className={workflowResult.failedSteps > 0 ? 'text-red-600' : 'text-green-600'}>
                        {workflowResult.failedSteps}
                      </span>
                    </div>
                    {workflowResult.completedAt && workflowResult.startedAt && (
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>
                          {Math.round((workflowResult.completedAt - workflowResult.startedAt) / 1000)}s
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Active Workflows and History */}
          <div className="space-y-6">
            {/* Active Workflows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 text-blue-600" />
                  Active Workflows
                </CardTitle>
                <CardDescription>
                  Currently running or paused workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeWorkflows.length > 0 ? (
                  <div className="space-y-3">
                    {activeWorkflows.map((workflow) => (
                      <div key={workflow.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-sm truncate">{workflow.name}</div>
                          {getStatusIcon(workflow.status)}
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {workflow.completedSteps}/{workflow.totalSteps} steps
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => controlWorkflow('pause', workflow.id)}
                            disabled={workflow.status !== 'executing'}
                          >
                            <Pause className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => controlWorkflow('resume', workflow.id)}
                            disabled={workflow.status !== 'paused'}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => controlWorkflow('cancel', workflow.id)}
                          >
                            <Square className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No active workflows</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Workflow History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Workflow History
                </CardTitle>
                <CardDescription>
                  Recently completed workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                {workflowHistory.length > 0 ? (
                  <div className="space-y-2">
                    {workflowHistory.slice(0, 5).map((workflow) => (
                      <button
                        key={workflow.id}
                        onClick={() => setSelectedWorkflow(workflow)}
                        className="w-full text-left p-2 rounded border hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-sm truncate">{workflow.name}</div>
                          {getStatusIcon(workflow.status)}
                        </div>
                        <div className="text-xs text-gray-600">
                          {workflow.completedSteps}/{workflow.totalSteps} • {workflow.estimatedDuration}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No workflow history</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Workflow Summary */}
        {workflowSummary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Workflow Summary
              </CardTitle>
              <CardDescription>
                Comprehensive execution summary and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {workflowSummary}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Workflow Details */}
        {selectedWorkflow && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-600" />
                Workflow Details: {selectedWorkflow.name}
              </CardTitle>
              <CardDescription>
                Detailed view of workflow execution and results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedWorkflow.totalSteps}</div>
                    <div className="text-sm text-gray-600">Total Steps</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedWorkflow.completedSteps}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{selectedWorkflow.failedSteps}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{selectedWorkflow.complexity}</div>
                    <div className="text-sm text-gray-600">Complexity</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Execution Steps:</h4>
                  {selectedWorkflow.steps.map((step, index) => (
                    <div key={step.id} className="border rounded-lg p-3">
                      <div className="flex items-center gap-3 mb-2">
                        {getStepStatusIcon(step.status)}
                        <div className="flex-1">
                          <div className="font-medium">{step.name}</div>
                          <div className="text-sm text-gray-600">{step.description}</div>
                        </div>
                        <Badge variant="outline">{step.tool}</Badge>
                      </div>
                      
                      {step.result && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <div className="font-medium mb-1">Result:</div>
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(step.result, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      {step.error && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                          <div className="font-medium mb-1">Error:</div>
                          <div>{step.error}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
