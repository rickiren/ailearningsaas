import { create } from 'zustand';
import { ToolExecution } from '@/components/chat/tool-execution-progress';

interface ProgressState {
  // Current execution state
  isActive: boolean;
  currentMessageId: string | null;
  
  // Tool executions
  executions: ToolExecution[];
  
  // Thinking state
  isThinking: boolean;
  thinkingStartTime: number | null;
  thinkingMessage: string;
  
  // Actions
  startThinking: (messageId: string, message?: string) => void;
  stopThinking: () => void;
  
  addToolExecution: (execution: Omit<ToolExecution, 'id' | 'startTime'>) => string;
  updateToolExecution: (id: string, updates: Partial<ToolExecution>) => void;
  completeToolExecution: (id: string, result?: any, error?: string) => void;
  
  startMessageExecution: (messageId: string) => void;
  completeMessageExecution: () => void;
  
  reset: () => void;
}

export const useProgressTracker = create<ProgressState>((set, get) => ({
  // Initial state
  isActive: false,
  currentMessageId: null,
  executions: [],
  isThinking: false,
  thinkingStartTime: null,
  thinkingMessage: "Analyzing your request...",
  
  // Start thinking state
  startThinking: (messageId: string, message = "Analyzing your request...") => {
    set({
      isThinking: true,
      thinkingStartTime: Date.now(),
      thinkingMessage: message,
      currentMessageId: messageId,
      isActive: true
    });
  },
  
  // Stop thinking state
  stopThinking: () => {
    set({
      isThinking: false,
      thinkingStartTime: null,
      thinkingMessage: "Analyzing your request..."
    });
  },
  
  // Add new tool execution
  addToolExecution: (execution) => {
    const id = `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newExecution: ToolExecution = {
      ...execution,
      id,
      startTime: Date.now(),
      status: 'pending'
    };
    
    set(state => ({
      executions: [...state.executions, newExecution]
    }));
    
    // Automatically start the execution after a short delay
    setTimeout(() => {
      get().updateToolExecution(id, { status: 'running' });
    }, 100);
    
    return id;
  },
  
  // Update tool execution
  updateToolExecution: (id: string, updates: Partial<ToolExecution>) => {
    set(state => ({
      executions: state.executions.map(exec =>
        exec.id === id ? { ...exec, ...updates } : exec
      )
    }));
  },
  
  // Complete tool execution
  completeToolExecution: (id: string, result?: any, error?: string) => {
    const status: 'success' | 'error' = error ? 'error' : 'success';
    
    set(state => ({
      executions: state.executions.map(exec =>
        exec.id === id 
          ? { 
              ...exec, 
              status, 
              endTime: Date.now(),
              result: result || undefined,
              error: error || undefined
            }
          : exec
      )
    }));
  },
  
  // Start message execution
  startMessageExecution: (messageId: string) => {
    set({
      currentMessageId: messageId,
      isActive: true,
      executions: []
    });
  },
  
  // Complete message execution
  completeMessageExecution: () => {
    set({
      isActive: false,
      currentMessageId: null,
      isThinking: false,
      thinkingStartTime: null
    });
  },
  
  // Reset all state
  reset: () => {
    set({
      isActive: false,
      currentMessageId: null,
      executions: [],
      isThinking: false,
      thinkingStartTime: null,
      thinkingMessage: "Analyzing your request..."
    });
  }
}));

// Helper functions for common tool operations
export const progressHelpers = {
  // Simulate file reading
  simulateFileRead: (filePath: string, duration = 1500) => {
    const tracker = useProgressTracker.getState();
    const executionId = tracker.addToolExecution({
      toolId: 'read_file',
      toolName: 'Read File',
      status: 'pending'
    });
    
    setTimeout(() => {
      tracker.completeToolExecution(executionId, {
        message: `Successfully read ${filePath}`,
        path: filePath,
        contentLength: 1024,
        totalLines: 25
      });
    }, duration);
    
    return executionId;
  },
  
  // Simulate file writing
  simulateFileWrite: (filePath: string, duration = 2000) => {
    const tracker = useProgressTracker.getState();
    const executionId = tracker.addToolExecution({
      toolId: 'write_file',
      toolName: 'Write File',
      status: 'pending'
    });
    
    setTimeout(() => {
      tracker.completeToolExecution(executionId, {
        message: `Successfully created ${filePath}`,
        path: filePath,
        type: 'component'
      });
    }, duration);
    
    return executionId;
  },
  
  // Simulate artifact creation
  simulateArtifactCreation: (artifactType: string, duration = 1800) => {
    const tracker = useProgressTracker.getState();
    const executionId = tracker.addToolExecution({
      toolId: 'create_artifact',
      toolName: 'Create Artifact',
      status: 'pending'
    });
    
    setTimeout(() => {
      tracker.completeToolExecution(executionId, {
        message: `Successfully created ${artifactType} artifact`,
        type: artifactType
      });
    }, duration);
    
    return executionId;
  },
  
  // Simulate database query
  simulateDatabaseQuery: (query: string, duration = 1200) => {
    const tracker = useProgressTracker.getState();
    const executionId = tracker.addToolExecution({
      toolId: 'database_query',
      toolName: 'Database Query',
      status: 'pending'
    });
    
    setTimeout(() => {
      tracker.completeToolExecution(executionId, {
        message: `Query executed successfully`,
        query: query,
        resultCount: 5
      });
    }, duration);
    
    return executionId;
  }
};
