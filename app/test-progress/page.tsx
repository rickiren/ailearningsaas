'use client';

import { useState } from 'react';
import { ThinkingIndicator } from '@/components/chat/thinking-indicator';
import { ToolExecutionProgress } from '@/components/chat/tool-execution-progress';
import { ProgressSummary } from '@/components/chat/progress-summary';
import { useProgressTracker, progressHelpers } from '@/lib/progress-tracker';
import { Button } from '@/components/ui/button';

export default function TestProgressPage() {
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  
  const { 
    isThinking, 
    thinkingMessage, 
    isActive, 
    executions,
    startThinking,
    stopThinking,
    startMessageExecution,
    completeMessageExecution
  } = useProgressTracker();

  const runDemo = () => {
    setIsDemoRunning(true);
    
    // Start progress tracking
    const messageId = `demo_${Date.now()}`;
    startMessageExecution(messageId);
    startThinking(messageId, "Starting comprehensive demo...");
    
    // Simulate various tool executions
    setTimeout(() => {
      progressHelpers.simulateFileRead('app/page.tsx');
    }, 500);
    
    setTimeout(() => {
      progressHelpers.simulateFileRead('components/header.tsx');
    }, 1000);
    
    setTimeout(() => {
      progressHelpers.simulateFileWrite('components/landing-page.tsx');
    }, 2000);
    
    setTimeout(() => {
      progressHelpers.simulateArtifactCreation('landing page');
    }, 3500);
    
    setTimeout(() => {
      progressHelpers.simulateDatabaseQuery('SELECT * FROM users');
    }, 4500);
    
    setTimeout(() => {
      progressHelpers.simulateFileWrite('styles/landing.css');
    }, 5500);
    
    // Complete the demo
    setTimeout(() => {
      stopThinking();
      completeMessageExecution();
      setIsDemoRunning(false);
    }, 7000);
  };

  const resetDemo = () => {
    useProgressTracker.getState().reset();
    setIsDemoRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Progress Indicators Demo
          </h1>
          <p className="text-lg text-slate-600">
            Watch the AI agent work in real-time with comprehensive progress tracking
          </p>
        </div>

        {/* Demo Controls */}
        <div className="flex justify-center gap-4">
          <Button 
            onClick={runDemo} 
            disabled={isDemoRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isDemoRunning ? 'Demo Running...' : 'Start Demo'}
          </Button>
          <Button 
            onClick={resetDemo} 
            variant="outline"
          >
            Reset Demo
          </Button>
        </div>

        {/* Progress Indicators */}
        <div className="space-y-6">
          {/* Thinking Indicator */}
          {isThinking && (
            <ThinkingIndicator 
              isThinking={isThinking} 
              message={thinkingMessage}
            />
          )}
          
          {/* Tool Execution Progress */}
          {isActive && executions.length > 0 && (
            <ToolExecutionProgress 
              executions={executions}
              isActive={isActive}
            />
          )}
          
          {/* Progress Summary */}
          {!isActive && executions.length > 0 && (
            <ProgressSummary 
              executions={executions}
            />
          )}
        </div>

        {/* Instructions */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-3">
            How it works:
          </h3>
          <ul className="space-y-2 text-slate-600">
            <li>• <strong>Thinking Indicator:</strong> Shows AI analysis with elapsed time and animated brain icon</li>
            <li>• <strong>Tool Execution Progress:</strong> Real-time status updates for each tool with progress bars</li>
            <li>• <strong>Progress Summary:</strong> Grouped tool categories with expandable details and statistics</li>
            <li>• <strong>Status Badges:</strong> Color-coded status indicators (pending, running, success, error)</li>
            <li>• <strong>Real-time Updates:</strong> Progress updates as tools execute with smooth animations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
