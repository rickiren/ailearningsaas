'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/input';
import { 
  Brain, 
  MessageSquare, 
  Zap, 
  Target, 
  Lightbulb, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Code,
  FileText,
  Workflow,
  Sparkles,
  BarChart3,
  Settings,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { 
  IntentAnalysis, 
  Entity, 
  ResponsePattern, 
  ClarificationQuestion 
} from '@/lib/natural-language-understanding';

interface DemoState {
  userRequest: string;
  sessionId: string;
  isAnalyzing: boolean;
  isExecuting: boolean;
  intent: IntentAnalysis | null;
  responsePattern: ResponsePattern | null;
  clarificationQuestions: ClarificationQuestion[];
  systemPrompt: string;
  workflowResult: any;
  workflowSummary: string;
  activeTab: 'analysis' | 'execution' | 'system-prompt' | 'examples';
}

export default function NLUDemoPage() {
  const [state, setState] = useState<DemoState>({
    userRequest: '',
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    isAnalyzing: false,
    isExecuting: false,
    intent: null,
    responsePattern: null,
    clarificationQuestions: [],
    systemPrompt: '',
    workflowResult: null,
    workflowSummary: '',
    activeTab: 'analysis'
  });

  // Predefined example requests
  const exampleRequests = [
    {
      text: "Build a login form component with validation",
      description: "Create a new component with form handling",
      category: 'creation'
    },
    {
      text: "Fix the styling issues in the header component",
      description: "Debug and resolve CSS problems",
      category: 'debugging'
    },
    {
      text: "Improve the user profile component with better error handling",
      description: "Enhance existing functionality",
      category: 'enhancement'
    },
    {
      text: "Analyze the project structure and find optimization opportunities",
      description: "Discover insights and improvements",
      category: 'analysis'
    },
    {
      text: "Create a responsive navigation menu",
      description: "Build a new navigation component",
      category: 'creation'
    },
    {
      text: "Debug the authentication flow",
      description: "Identify and fix auth issues",
      category: 'debugging'
    }
  ];

  useEffect(() => {
    // Generate system prompt on component mount
    generateSystemPrompt();
  }, []);

  const generateSystemPrompt = async () => {
    try {
      const response = await fetch('/api/nlu/system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId })
      });

      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({ ...prev, systemPrompt: data.systemPrompt }));
      }
    } catch (error) {
      console.error('Error generating system prompt:', error);
    }
  };

  const analyzeRequest = async () => {
    if (!state.userRequest.trim()) return;

    setState(prev => ({ ...prev, isAnalyzing: true }));

    try {
      const response = await fetch('/api/nlu/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRequest: state.userRequest.trim(),
          sessionId: state.sessionId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          intent: data.intent,
          responsePattern: data.responsePattern,
          clarificationQuestions: data.clarificationQuestions,
          isAnalyzing: false
        }));
      } else {
        console.error('Analysis failed:', data.error);
        setState(prev => ({ ...prev, isAnalyzing: false }));
      }
    } catch (error) {
      console.error('Error analyzing request:', error);
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  };

  const executeIntelligentWorkflow = async () => {
    if (!state.userRequest.trim()) return;

    setState(prev => ({ ...prev, isExecuting: true }));

    try {
      const response = await fetch('/api/nlu/execute-intelligent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userRequest: state.userRequest.trim(),
          sessionId: state.sessionId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          workflowResult: data.workflowResult,
          workflowSummary: data.summary,
          isExecuting: false
        }));
      } else {
        console.error('Workflow execution failed:', data.error);
        setState(prev => ({ ...prev, isExecuting: false }));
      }
    } catch (error) {
      console.error('Error executing workflow:', error);
      setState(prev => ({ ...prev, isExecuting: false }));
    }
  };

  const selectExample = (example: typeof exampleRequests[0]) => {
    setState(prev => ({ ...prev, userRequest: example.text }));
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'build':
      case 'create':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'fix':
      case 'debug':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'enhance':
      case 'optimize':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'analyze':
      case 'explore':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'component': return <Code className="w-4 h-4" />;
      case 'file': return <FileText className="w-4 h-4" />;
      case 'feature': return <Zap className="w-4 h-4" />;
      case 'technology': return <Settings className="w-4 h-4" />;
      case 'pattern': return <Workflow className="w-4 h-4" />;
      case 'issue': return <AlertCircle className="w-4 h-4" />;
      case 'requirement': return <Target className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'complex': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Natural Language Understanding Demo
          </h1>
          <p className="text-lg text-slate-600">
            AI-powered intelligent request analysis and conversational coding assistance
          </p>
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Input and Examples */}
          <div className="space-y-6">
            {/* Request Input */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  Natural Language Request
                </CardTitle>
                <CardDescription>
                  Describe what you want the AI to accomplish in natural language
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="e.g., Build a login form component, Fix styling issues, Improve error handling..."
                  value={state.userRequest}
                  onChange={(e) => setState(prev => ({ ...prev, userRequest: e.target.value }))}
                  className="min-h-[120px] resize-none"
                />
                
                <div className="flex gap-2">
                  <Button
                    onClick={analyzeRequest}
                    disabled={state.isAnalyzing || !state.userRequest.trim()}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {state.isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Analyze Request
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={executeIntelligentWorkflow}
                    disabled={state.isExecuting || !state.userRequest.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {state.isExecuting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Executing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Execute Workflow
                      </>
                    )}
                  </Button>
                </div>
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
                  Try these natural language examples to see the system in action
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
                      {example.category}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Analysis Results */}
          <div className="space-y-6">
            {/* Intent Analysis */}
            {state.intent && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Intent Analysis
                  </CardTitle>
                  <CardDescription>
                    AI's understanding of your request
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={getIntentColor(state.intent.primaryIntent)}>
                      {state.intent.primaryIntent}
                    </Badge>
                    <div className="text-sm text-gray-600">
                      {Math.round(state.intent.confidence * 100)}% confidence
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{state.intent.complexity}</div>
                      <div className="text-sm text-gray-600">Complexity</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{state.intent.estimatedEffort}</div>
                      <div className="text-sm text-gray-600">Estimated Effort</div>
                    </div>
                  </div>

                  {state.intent.subIntents.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Sub-Intents:</h4>
                      <div className="flex flex-wrap gap-2">
                        {state.intent.subIntents.map((subIntent, index) => (
                          <Badge key={index} variant="outline">
                            {subIntent}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {state.intent.entities.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Detected Entities:</h4>
                      <div className="space-y-2">
                        {state.intent.entities.map((entity, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            {getEntityIcon(entity.type)}
                            <div className="flex-1">
                              <div className="font-medium text-sm">{entity.value}</div>
                              <div className="text-xs text-gray-600">{entity.type}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(entity.confidence * 100)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Response Pattern */}
            {state.responsePattern && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-600" />
                    Response Pattern
                  </CardTitle>
                  <CardDescription>
                    AI's planned response and actions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800">
                      {state.responsePattern.content}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Planned Actions:</h4>
                    <div className="space-y-2">
                      {state.responsePattern.actions.map((action, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{action.description}</div>
                            <div className="text-xs text-gray-600">{action.reasoning}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {action.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Clarification and Results */}
          <div className="space-y-6">
            {/* Clarification Questions */}
            {state.clarificationQuestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Clarification Needed
                  </CardTitle>
                  <CardDescription>
                    AI needs more information to proceed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {state.clarificationQuestions.map((question, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="font-medium text-sm mb-2">{question.question}</div>
                        <div className="text-xs text-gray-600 mb-2">{question.reasoning}</div>
                        {question.options && (
                          <div className="flex flex-wrap gap-1">
                            {question.options.map((option, optIndex) => (
                              <Badge key={optIndex} variant="outline" className="text-xs">
                                {option}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Badge 
                          variant={question.required ? "destructive" : "outline"} 
                          className="mt-2 text-xs"
                        >
                          {question.required ? 'Required' : 'Optional'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Workflow Results */}
            {state.workflowResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Workflow Results
                  </CardTitle>
                  <CardDescription>
                    Results from intelligent workflow execution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge className={getIntentColor(state.workflowResult.status)}>
                        {state.workflowResult.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed Steps:</span>
                      <span>{state.workflowResult.completedSteps}/{state.workflowResult.totalSteps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed Steps:</span>
                      <span className={state.workflowResult.failedSteps > 0 ? 'text-red-600' : 'text-green-600'}>
                        {state.workflowResult.failedSteps}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-600" />
                  Session Information
                </CardTitle>
                <CardDescription>
                  Current session details and context
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Session ID:</span>
                    <span className="font-mono text-xs">{state.sessionId.substring(0, 20)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-green-600">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabbed Content */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'analysis', label: 'Analysis', icon: BarChart3 },
              { id: 'execution', label: 'Execution', icon: Play },
              { id: 'system-prompt', label: 'System Prompt', icon: Brain },
              { id: 'examples', label: 'Examples', icon: Sparkles }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setState(prev => ({ ...prev, activeTab: tab.id as any }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  state.activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg border p-6">
            {state.activeTab === 'analysis' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Request Analysis</h3>
                {state.intent ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900">Primary Intent</h4>
                        <p className="text-blue-700">{state.intent.primaryIntent}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-900">Confidence</h4>
                        <p className="text-green-700">{Math.round(state.intent.confidence * 100)}%</p>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-900">Complexity</h4>
                        <p className="text-purple-700">{state.intent.complexity}</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Project Context</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Type:</span> {state.intent.context.projectType}
                        </div>
                        <div>
                          <span className="text-gray-600">Framework:</span> {state.intent.context.framework}
                        </div>
                        <div>
                          <span className="text-gray-600">Focus:</span> {state.intent.context.currentFocus.join(', ')}
                        </div>
                        <div>
                          <span className="text-gray-600">Constraints:</span> {state.intent.context.constraints.length}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Enter a request above and click "Analyze Request" to see the analysis.</p>
                )}
              </div>
            )}

            {state.activeTab === 'execution' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Workflow Execution</h3>
                {state.workflowResult ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900">Execution Complete</h4>
                      <p className="text-green-700">Workflow executed successfully with {state.workflowResult.completedSteps} completed steps.</p>
                    </div>
                    
                    {state.workflowSummary && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">Workflow Summary</h4>
                        <pre className="whitespace-pre-wrap text-sm text-gray-800">
                          {state.workflowSummary}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Click "Execute Workflow" to run the intelligent workflow for your request.</p>
                )}
              </div>
            )}

            {state.activeTab === 'system-prompt' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Intelligent System Prompt</h3>
                {state.systemPrompt ? (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                      {state.systemPrompt}
                    </pre>
                  </div>
                ) : (
                  <p className="text-gray-500">Loading system prompt...</p>
                )}
              </div>
            )}

            {state.activeTab === 'examples' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Example Requests</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exampleRequests.map((example, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:border-purple-300 transition-colors">
                      <h4 className="font-medium mb-2">{example.text}</h4>
                      <p className="text-sm text-gray-600 mb-3">{example.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{example.category}</Badge>
                        <Button
                          size="sm"
                          onClick={() => selectExample(example)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Try This
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
