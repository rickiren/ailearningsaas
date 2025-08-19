import { contextAwarenessClient, ProjectContext } from './context-awareness-client';
import { aiEditingTools, CreateArtifactOptions, UpdateArtifactOptions, ReadFileOptions } from './ai-editing-tools';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  tool: string;
  parameters: Record<string, any>;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  startTime?: number;
  endTime?: number;
  retryCount: number;
  maxRetries: number;
}

export interface WorkflowPlan {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'planning' | 'executing' | 'completed' | 'failed' | 'paused';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  context: ProjectContext | null;
  userRequest: string;
  estimatedDuration: string;
  complexity: 'simple' | 'medium' | 'complex';
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    executionTime: number;
    toolUsed: string;
    parameters: Record<string, any>;
  };
}

export interface WorkflowExecutionOptions {
  maxRetries?: number;
  timeout?: number;
  continueOnFailure?: boolean;
  showProgress?: boolean;
  autoRetry?: boolean;
}

export type WorkflowType = 'discovery' | 'creation' | 'debugging' | 'enhancement' | 'custom';

class MultiToolExecutor {
  private activeWorkflows: Map<string, WorkflowPlan> = new Map();
  private workflowHistory: WorkflowPlan[] = [];
  private toolRegistry: Map<string, Function> = new Map();
  private maxConcurrentWorkflows = 5;
  private defaultMaxRetries = 3;
  private defaultTimeout = 300000; // 5 minutes

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * Register available tools for the executor
   */
  private registerDefaultTools() {
    // Context awareness tools
    this.toolRegistry.set('analyze_project', this.executeAnalyzeProject.bind(this));
    this.toolRegistry.set('read_file', this.executeReadFile.bind(this));
    this.toolRegistry.set('read_multiple_files', this.executeReadMultipleFiles.bind(this));
    this.toolRegistry.set('find_similar_files', this.executeFindSimilarFiles.bind(this));
    this.toolRegistry.set('get_suggestions', this.executeGetSuggestions.bind(this));
    
    // AI editing tools
    this.toolRegistry.set('create_artifact', this.executeCreateArtifact.bind(this));
    this.toolRegistry.set('update_artifact', this.executeUpdateArtifact.bind(this));
    this.toolRegistry.set('analyze_file', this.executeAnalyzeFile.bind(this));
    
    // Workflow management tools
    this.toolRegistry.set('plan_workflow', this.executePlanWorkflow.bind(this));
    this.toolRegistry.set('execute_workflow', this.executeWorkflow.bind(this));
    this.toolRegistry.set('pause_workflow', this.executePauseWorkflow.bind(this));
    this.toolRegistry.set('resume_workflow', this.executeResumeWorkflow.bind(this));
  }

  /**
   * Plan a complex workflow based on user request
   */
  async planWorkflow(userRequest: string, workflowType: WorkflowType = 'custom'): Promise<WorkflowPlan> {
    try {
      // Analyze the project first to understand context
      const context = await contextAwarenessClient.analyzeProject();
      
      // Generate workflow steps based on request type and content
      const steps = await this.generateWorkflowSteps(userRequest, workflowType, context);
      
      const plan: WorkflowPlan = {
        id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: this.generateWorkflowName(userRequest),
        description: `Workflow to: ${userRequest}`,
        steps,
        status: 'planning',
        createdAt: new Date(),
        totalSteps: steps.length,
        completedSteps: 0,
        failedSteps: 0,
        context,
        userRequest,
        estimatedDuration: this.estimateWorkflowDuration(steps),
        complexity: this.assessWorkflowComplexity(steps)
      };

      return plan;
    } catch (error) {
      console.error('Error planning workflow:', error);
      throw new Error(`Failed to plan workflow: ${error}`);
    }
  }

  /**
   * Execute a planned workflow autonomously
   */
  async executeWorkflow(plan: WorkflowPlan, options: WorkflowExecutionOptions = {}): Promise<WorkflowPlan> {
    const executionOptions = {
      maxRetries: options.maxRetries || this.defaultMaxRetries,
      timeout: options.timeout || this.defaultTimeout,
      continueOnFailure: options.continueOnFailure || false,
      showProgress: options.showProgress || true,
      autoRetry: options.autoRetry || true
    };

    try {
      // Update workflow status
      plan.status = 'executing';
      plan.startedAt = new Date();
      this.activeWorkflows.set(plan.id, plan);

      // Execute steps in dependency order
      const executionOrder = this.topologicalSort(plan.steps);
      
      for (const stepId of executionOrder) {
        const step = plan.steps.find(s => s.id === stepId);
        if (!step) continue;

        // Check dependencies
        if (!this.canExecuteStep(step, plan.steps)) {
          step.status = 'skipped';
          continue;
        }

        // Execute the step
        await this.executeStep(step, plan, executionOptions);
        
        // Update progress
        if (step.status === 'completed') {
          plan.completedSteps++;
        } else if (step.status === 'failed') {
          plan.failedSteps++;
        }

        // Check if we should continue on failure
        if (step.status === 'failed' && !executionOptions.continueOnFailure) {
          plan.status = 'failed';
          break;
        }
      }

      // Finalize workflow
      if (plan.failedSteps === 0) {
        plan.status = 'completed';
      } else if (plan.completedSteps > 0) {
        plan.status = 'completed'; // Partial completion
      } else {
        plan.status = 'failed';
      }

      plan.completedAt = new Date();
      this.activeWorkflows.delete(plan.id);
      this.workflowHistory.push(plan);

      return plan;
    } catch (error) {
      console.error('Error executing workflow:', error);
      plan.status = 'failed';
      plan.completedAt = new Date();
      this.activeWorkflows.delete(plan.id);
      this.workflowHistory.push(plan);
      throw error;
    }
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(step: WorkflowStep, plan: WorkflowPlan, options: WorkflowExecutionOptions): Promise<void> {
    step.status = 'running';
    step.startTime = Date.now();

    try {
      // Get the tool function
      const toolFunction = this.toolRegistry.get(step.tool);
      if (!toolFunction) {
        throw new Error(`Tool '${step.tool}' not found`);
      }

      // Execute the tool
      const result = await toolFunction(step.parameters, plan);
      
      // Update step with result
      step.result = result;
      step.status = 'completed';
      step.endTime = Date.now();

      // Share context with dependent steps
      this.shareContextBetweenSteps(step, plan.steps);

    } catch (error) {
      console.error(`Error executing step ${step.name}:`, error);
      
      // Handle retries
      if (step.retryCount < options.maxRetries && options.autoRetry) {
        step.retryCount++;
        step.status = 'pending';
        step.error = `Retry ${step.retryCount}/${options.maxRetries}: ${error}`;
        
        // Wait before retry
        await this.delay(1000 * step.retryCount);
        
        // Retry the step
        await this.executeStep(step, plan, options);
      } else {
        step.status = 'failed';
        step.error = error instanceof Error ? error.message : String(error);
        step.endTime = Date.now();
      }
    }
  }

  /**
   * Generate workflow steps based on user request and type
   */
  private async generateWorkflowSteps(userRequest: string, workflowType: WorkflowType, context: ProjectContext): Promise<WorkflowStep[]> {
    const steps: WorkflowStep[] = [];
    let stepId = 1;

    // Common initial step: analyze project context
    steps.push({
      id: `step_${stepId++}`,
      name: 'Analyze Project Context',
      description: 'Understand the current project structure and patterns',
      tool: 'analyze_project',
      parameters: {},
      dependencies: [],
      status: 'pending',
      retryCount: 0,
      maxRetries: 2
    });

    // Generate type-specific steps
    switch (workflowType) {
      case 'discovery':
        steps.push(...this.generateDiscoverySteps(userRequest, stepId));
        break;
      case 'creation':
        steps.push(...this.generateCreationSteps(userRequest, stepId));
        break;
      case 'debugging':
        steps.push(...this.generateDebuggingSteps(userRequest, stepId));
        break;
      case 'enhancement':
        steps.push(...this.generateEnhancementSteps(userRequest, stepId));
        break;
      default:
        steps.push(...this.generateCustomSteps(userRequest, stepId));
    }

    // Add final analysis step
    steps.push({
      id: `step_${stepId++}`,
      name: 'Final Analysis',
      description: 'Analyze results and provide summary',
      tool: 'analyze_file',
      parameters: { type: 'summary' },
      dependencies: steps.slice(1).map(s => s.id), // Depend on all other steps
      status: 'pending',
      retryCount: 0,
      maxRetries: 1
    });

    return steps;
  }

  /**
   * Generate discovery workflow steps
   */
  private generateDiscoverySteps(userRequest: string, startId: number): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    let stepId = startId;

    // Read key project files
    steps.push({
      id: `step_${stepId++}`,
      name: 'Read Project Structure',
      description: 'Read key configuration and structure files',
      tool: 'read_multiple_files',
      parameters: {
        filePaths: ['package.json', 'tsconfig.json', 'next.config.ts']
      },
      dependencies: ['step_1'],
      status: 'pending',
      retryCount: 0,
      maxRetries: 2
    });

    // Find similar patterns
    steps.push({
      id: `step_${stepId++}`,
      name: 'Find Similar Patterns',
      description: 'Identify existing patterns in the codebase',
      tool: 'find_similar_files',
      parameters: {
        targetFile: 'app/page.tsx',
        criteria: 'purpose'
      },
      dependencies: ['step_1'],
      status: 'pending',
      retryCount: 0,
      maxRetries: 2
    });

    return steps;
  }

  /**
   * Generate creation workflow steps
   */
  private generateCreationSteps(userRequest: string, startId: number): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    let stepId = startId;

    // Analyze existing similar components
    steps.push({
      id: `step_${stepId++}`,
      name: 'Analyze Similar Components',
      description: 'Read existing components to understand patterns',
      tool: 'read_multiple_files',
      parameters: {
        filePaths: ['components/ui/button.tsx', 'components/ui/input.tsx']
      },
      dependencies: ['step_1'],
      status: 'pending',
      retryCount: 0,
      maxRetries: 2
    });

    // Get context-aware suggestions
    steps.push({
      id: `step_${stepId++}`,
      name: 'Get Component Suggestions',
      description: 'Get intelligent suggestions for component creation',
      tool: 'get_suggestions',
      parameters: {
        fileType: 'component',
        name: 'NewComponent'
      },
      dependencies: [`step_${startId}`],
      status: 'pending',
      retryCount: 0,
      maxRetries: 2
    });

    // Create the component
    steps.push({
      id: `step_${stepId++}`,
      name: 'Create Component',
      description: 'Create the new component with proper patterns',
      tool: 'create_artifact',
      parameters: {
        type: 'component',
        name: 'NewComponent',
        content: '// Component content will be generated',
        followPatterns: true
      },
      dependencies: [`step_${startId + 1}`],
      status: 'pending',
      retryCount: 0,
      maxRetries: 2
    });

    return steps;
  }

  /**
   * Generate debugging workflow steps
   */
  private generateDebuggingSteps(userRequest: string, startId: number): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    let stepId = startId;

    // Read error logs or problematic files
    steps.push({
      id: `step_${stepId++}`,
      name: 'Read Problem Files',
      description: 'Read files mentioned in error messages',
      tool: 'read_multiple_files',
      parameters: {
        filePaths: ['app/page.tsx', 'components/Button.tsx']
      },
      dependencies: ['step_1'],
      status: 'pending',
      retryCount: 0,
      maxRetries: 2
    });

    // Analyze the issues
    steps.push({
      id: `step_${stepId++}`,
      name: 'Analyze Issues',
      description: 'Identify and analyze the problems',
      tool: 'analyze_file',
      parameters: {
        type: 'debug',
        files: ['app/page.tsx', 'components/Button.tsx']
      },
      dependencies: [`step_${startId}`],
      status: 'pending',
      retryCount: 0,
      maxRetries: 2
    });

    // Apply fixes
    steps.push({
      id: `step_${stepId++}`,
      name: 'Apply Fixes',
      description: 'Apply the identified fixes',
      tool: 'update_artifact',
      parameters: {
        path: 'app/page.tsx',
        content: '// Fixed content will be generated',
        preserveStructure: true
      },
      dependencies: [`step_${startId + 1}`],
      status: 'pending',
      retryCount: 0,
      maxRetries: 2
    });

    return steps;
  }

  /**
   * Generate enhancement workflow steps
   */
  private generateEnhancementSteps(userRequest: string, startId: number): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    let stepId = startId;

    // Read existing code for analysis
    steps.push({
      id: `step_${stepId++}`,
      name: 'Read Existing Code',
      description: 'Read the code that needs enhancement',
      tool: 'read_multiple_files',
      parameters: {
        filePaths: ['app/page.tsx', 'components/Header.tsx']
      },
      dependencies: ['step_1'],
      status: 'pending',
      retryCount: 0,
      maxRetries: 2
    });

    // Analyze for improvements
    steps.push({
      id: `step_${stepId++}`,
      name: 'Analyze for Improvements',
      description: 'Identify areas for enhancement',
      tool: 'analyze_file',
      parameters: {
        type: 'enhancement',
        files: ['app/page.tsx', 'components/Header.tsx']
      },
      dependencies: [`step_${startId}`],
      status: 'pending',
      retryCount: 0,
      maxRetries: 2
    });

    // Implement enhancements
    steps.push({
      id: `step_${stepId++}`,
      name: 'Implement Enhancements',
      description: 'Apply the identified improvements',
      tool: 'update_artifact',
      parameters: {
        path: 'app/page.tsx',
        content: '// Enhanced content will be generated',
        preserveStructure: true
      },
      dependencies: [`step_${startId + 1}`],
      status: 'pending',
      retryCount: 0,
      maxRetries: 2
    });

    return steps;
  }

  /**
   * Generate custom workflow steps based on request analysis
   */
  private generateCustomSteps(userRequest: string, startId: number): WorkflowStep[] {
    const steps: WorkflowStep[] = [];
    let stepId = startId;

    // Analyze the request to determine steps
    if (userRequest.toLowerCase().includes('create') || userRequest.toLowerCase().includes('build')) {
      steps.push(...this.generateCreationSteps(userRequest, stepId));
    } else if (userRequest.toLowerCase().includes('fix') || userRequest.toLowerCase().includes('debug')) {
      steps.push(...this.generateDebuggingSteps(userRequest, stepId));
    } else if (userRequest.toLowerCase().includes('improve') || userRequest.toLowerCase().includes('enhance')) {
      steps.push(...this.generateEnhancementSteps(userRequest, stepId));
    } else {
      steps.push(...this.generateDiscoverySteps(userRequest, stepId));
    }

    return steps;
  }

  /**
   * Execute a complex request with autonomous workflow execution
   */
  async executeComplexRequest(userRequest: string, workflowType: WorkflowType = 'custom'): Promise<{
    plan: WorkflowPlan;
    result: WorkflowPlan;
    summary: string;
  }> {
    try {
      // Step 1: Plan the workflow
      console.log('🤔 Planning workflow for:', userRequest);
      const plan = await this.planWorkflow(userRequest, workflowType);
      
      // Step 2: Execute the workflow
      console.log('🚀 Executing workflow:', plan.name);
      const result = await this.executeWorkflow(plan);
      
      // Step 3: Generate summary
      const summary = this.generateWorkflowSummary(result);
      
      return { plan, result, summary };
    } catch (error) {
      console.error('Error executing complex request:', error);
      throw error;
    }
  }

  /**
   * Generate a comprehensive workflow summary
   */
  private generateWorkflowSummary(workflow: WorkflowPlan): string {
    const totalTime = workflow.completedAt && workflow.startedAt 
      ? Math.round((workflow.completedAt.getTime() - workflow.startedAt.getTime()) / 1000)
      : 0;

    const successRate = workflow.totalSteps > 0 
      ? Math.round((workflow.completedSteps / workflow.totalSteps) * 100)
      : 0;

    let summary = `🎯 **Workflow Summary: ${workflow.name}**\n\n`;
    summary += `**Status:** ${workflow.status}\n`;
    summary += `**Completion:** ${workflow.completedSteps}/${workflow.totalSteps} steps (${successRate}%)\n`;
    summary += `**Duration:** ${totalTime}s\n`;
    summary += `**Complexity:** ${workflow.complexity}\n\n`;

    if (workflow.failedSteps > 0) {
      summary += `⚠️ **Failed Steps:** ${workflow.failedSteps}\n\n`;
    }

    summary += `**Steps Executed:**\n`;
    workflow.steps.forEach((step, index) => {
      const status = step.status === 'completed' ? '✅' : 
                    step.status === 'failed' ? '❌' : 
                    step.status === 'skipped' ? '⏭️' : '⏳';
      summary += `${status} ${index + 1}. ${step.name}\n`;
      
      if (step.status === 'failed' && step.error) {
        summary += `   Error: ${step.error}\n`;
      }
    });

    return summary;
  }

  // Tool execution methods
  private async executeAnalyzeProject(parameters: any, plan: WorkflowPlan): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();
      const context = await contextAwarenessClient.analyzeProject();
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: context,
        metadata: {
          executionTime,
          toolUsed: 'analyze_project',
          parameters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeReadFile(parameters: any, plan: WorkflowPlan): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();
      const result = await aiEditingTools.readFile(parameters as ReadFileOptions);
      const executionTime = Date.now() - startTime;

      return {
        success: result.success,
        data: result,
        error: result.success ? undefined : result.message,
        metadata: {
          executionTime,
          toolUsed: 'read_file',
          parameters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeReadMultipleFiles(parameters: any, plan: WorkflowPlan): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();
      const result = await aiEditingTools.readMultipleFiles(parameters.filePaths);
      const executionTime = Date.now() - startTime;

      return {
        success: result.success,
        data: result,
        error: result.success ? undefined : result.message,
        metadata: {
          executionTime,
          toolUsed: 'read_multiple_files',
          parameters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeFindSimilarFiles(parameters: any, plan: WorkflowPlan): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();
      const result = await contextAwarenessClient.findSimilarFiles(
        parameters.targetFile,
        parameters.criteria
      );
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          executionTime,
          toolUsed: 'find_similar_files',
          parameters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeGetSuggestions(parameters: any, plan: WorkflowPlan): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();
      const result = await contextAwarenessClient.getContextAwareSuggestions(
        parameters.fileType,
        parameters.name
      );
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          executionTime,
          toolUsed: 'get_suggestions',
          parameters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeCreateArtifact(parameters: any, plan: WorkflowPlan): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();
      const result = await aiEditingTools.createArtifact(parameters as CreateArtifactOptions);
      const executionTime = Date.now() - startTime;

      return {
        success: result.success,
        data: result,
        error: result.success ? undefined : result.message,
        metadata: {
          executionTime,
          toolUsed: 'create_artifact',
          parameters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeUpdateArtifact(parameters: any, plan: WorkflowPlan): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();
      const result = await aiEditingTools.updateArtifact(parameters as UpdateArtifactOptions);
      const executionTime = Date.now() - startTime;

      return {
        success: result.success,
        data: result,
        error: result.success ? undefined : result.message,
        metadata: {
          executionTime,
          toolUsed: 'update_artifact',
          parameters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeAnalyzeFile(parameters: any, plan: WorkflowPlan): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();
      
      // This is a custom analysis step that combines multiple tools
      let analysisResult = {};
      
      if (parameters.type === 'summary') {
        // Generate workflow summary
        analysisResult = {
          type: 'workflow_summary',
          totalSteps: plan.totalSteps,
          completedSteps: plan.completedSteps,
          failedSteps: plan.failedSteps,
          successRate: Math.round((plan.completedSteps / plan.totalSteps) * 100),
          recommendations: this.generateRecommendations(plan)
        };
      } else if (parameters.type === 'debug') {
        // Analyze files for debugging
        analysisResult = {
          type: 'debug_analysis',
          files: parameters.files,
          issues: ['Sample issue 1', 'Sample issue 2'],
          suggestions: ['Fix import statement', 'Update component props']
        };
      } else if (parameters.type === 'enhancement') {
        // Analyze files for enhancement
        analysisResult = {
          type: 'enhancement_analysis',
          files: parameters.files,
          improvements: ['Add TypeScript types', 'Improve error handling'],
          suggestions: ['Extract reusable components', 'Add unit tests']
        };
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: analysisResult,
        metadata: {
          executionTime,
          toolUsed: 'analyze_file',
          parameters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executePlanWorkflow(parameters: any, plan: WorkflowPlan): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();
      const newPlan = await this.planWorkflow(parameters.userRequest, parameters.workflowType);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: newPlan,
        metadata: {
          executionTime,
          toolUsed: 'plan_workflow',
          parameters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeWorkflow(parameters: any, plan: WorkflowPlan): Promise<ToolExecutionResult> {
    try {
      const startTime = Date.now();
      const result = await this.executeWorkflow(plan, parameters.options);
      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        metadata: {
          executionTime,
          toolUsed: 'execute_workflow',
          parameters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executePauseWorkflow(parameters: any, plan: WorkflowPlan): Promise<ToolExecutionResult> {
    try {
      plan.status = 'paused';
      return {
        success: true,
        data: { message: 'Workflow paused' },
        metadata: {
          executionTime: 0,
          toolUsed: 'pause_workflow',
          parameters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async executeResumeWorkflow(parameters: any, plan: WorkflowPlan): Promise<ToolExecutionResult> {
    try {
      plan.status = 'executing';
      return {
        success: true,
        data: { message: 'Workflow resumed' },
        metadata: {
          executionTime: 0,
          toolUsed: 'resume_workflow',
          parameters
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Helper methods
  private generateWorkflowName(userRequest: string): string {
    const words = userRequest.split(' ').slice(0, 3);
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Workflow';
  }

  private estimateWorkflowDuration(steps: WorkflowStep[]): string {
    const estimatedSeconds = steps.length * 30; // 30 seconds per step
    if (estimatedSeconds < 60) return `${estimatedSeconds}s`;
    const minutes = Math.ceil(estimatedSeconds / 60);
    return `${minutes}m`;
  }

  private assessWorkflowComplexity(steps: WorkflowStep[]): 'simple' | 'medium' | 'complex' {
    if (steps.length <= 3) return 'simple';
    if (steps.length <= 6) return 'medium';
    return 'complex';
  }

  private topologicalSort(steps: WorkflowStep[]): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];

    const visit = (stepId: string) => {
      if (temp.has(stepId)) {
        throw new Error('Circular dependency detected');
      }
      if (visited.has(stepId)) return;

      temp.add(stepId);
      const step = steps.find(s => s.id === stepId);
      if (step) {
        for (const dep of step.dependencies) {
          visit(dep);
        }
      }
      temp.delete(stepId);
      visited.add(stepId);
      order.push(stepId);
    };

    for (const step of steps) {
      if (!visited.has(step.id)) {
        visit(step.id);
      }
    }

    return order;
  }

  private canExecuteStep(step: WorkflowStep, allSteps: WorkflowStep[]): boolean {
    for (const depId of step.dependencies) {
      const dep = allSteps.find(s => s.id === depId);
      if (!dep || dep.status !== 'completed') {
        return false;
      }
    }
    return true;
  }

  private shareContextBetweenSteps(completedStep: WorkflowStep, allSteps: WorkflowStep[]): void {
    // Share relevant context with dependent steps
    for (const step of allSteps) {
      if (step.dependencies.includes(completedStep.id) && completedStep.result?.data) {
        // Update step parameters with context from completed step
        if (completedStep.result.data.context) {
          step.parameters.context = completedStep.result.data.context;
        }
        if (completedStep.result.data.path) {
          step.parameters.filePath = completedStep.result.data.path;
        }
      }
    }
  }

  private generateRecommendations(workflow: WorkflowPlan): string[] {
    const recommendations: string[] = [];
    
    if (workflow.failedSteps > 0) {
      recommendations.push('Review failed steps and consider retrying with different parameters');
    }
    
    if (workflow.completedSteps < workflow.totalSteps) {
      recommendations.push('Complete remaining steps to finish the workflow');
    }
    
    if (workflow.complexity === 'complex') {
      recommendations.push('Consider breaking down complex workflows into smaller, focused ones');
    }
    
    return recommendations;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods for workflow management
  getActiveWorkflows(): WorkflowPlan[] {
    return Array.from(this.activeWorkflows.values());
  }

  getWorkflowHistory(): WorkflowPlan[] {
    return this.workflowHistory;
  }

  getWorkflowById(id: string): WorkflowPlan | undefined {
    return this.activeWorkflows.get(id) || this.workflowHistory.find(w => w.id === id);
  }

  pauseWorkflow(id: string): boolean {
    const workflow = this.activeWorkflows.get(id);
    if (workflow && workflow.status === 'executing') {
      workflow.status = 'paused';
      return true;
    }
    return false;
  }

  resumeWorkflow(id: string): boolean {
    const workflow = this.activeWorkflows.get(id);
    if (workflow && workflow.status === 'paused') {
      workflow.status = 'executing';
      return true;
    }
    return false;
  }

  cancelWorkflow(id: string): boolean {
    const workflow = this.activeWorkflows.get(id);
    if (workflow) {
      workflow.status = 'failed';
      this.activeWorkflows.delete(id);
      this.workflowHistory.push(workflow);
      return true;
    }
    return false;
  }
}

// Export singleton instance
export const multiToolExecutor = new MultiToolExecutor();

// Export types
export type { 
  WorkflowStep, 
  WorkflowPlan, 
  ToolExecutionResult, 
  WorkflowExecutionOptions,
  WorkflowType 
};
