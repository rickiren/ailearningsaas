import { contextAwarenessClient, ProjectContext } from './context-awareness-client';
import { multiToolExecutor, WorkflowType } from './multi-tool-executor';
import { naturalLanguageUnderstanding, IntentAnalysis, ResponsePattern } from './natural-language-understanding';

export interface SystemPromptContext {
  projectContext: ProjectContext;
  availableTools: string[];
  workflowCapabilities: string[];
  responsePatterns: string[];
  personalityTraits: string[];
}

export interface IntelligentResponse {
  content: string;
  actions: string[];
  explanations: string[];
  suggestions: string[];
  nextSteps: string[];
  confidence: number;
  requiresClarification: boolean;
  clarificationQuestions?: string[];
}

export class IntelligentSystemPrompt {
  private projectContext: ProjectContext | null = null;
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Generate the intelligent system prompt
   */
  async generateSystemPrompt(): Promise<string> {
    try {
      // Get project context
      this.projectContext = await contextAwarenessClient.analyzeProject();
      
      const context: SystemPromptContext = {
        projectContext: this.projectContext,
        availableTools: this.getAvailableTools(),
        workflowCapabilities: this.getWorkflowCapabilities(),
        responsePatterns: this.getResponsePatterns(),
        personalityTraits: this.getPersonalityTraits()
      };

      return this.buildSystemPrompt(context);
    } catch (error) {
      console.error('Error generating system prompt:', error);
      return this.getFallbackSystemPrompt();
    }
  }

  /**
   * Process user request with intelligent understanding
   */
  async processUserRequest(userRequest: string): Promise<IntelligentResponse> {
    try {
      // Analyze the request using natural language understanding
      const intent = await naturalLanguageUnderstanding.analyzeRequest(userRequest, this.sessionId);
      
      // Generate response pattern
      const responsePattern = await naturalLanguageUnderstanding.generateResponsePattern(
        intent, 
        userRequest, 
        this.sessionId
      );

      // Check if clarification is needed
      const clarificationQuestions = naturalLanguageUnderstanding.generateClarifyingQuestions(intent, userRequest);
      const requiresClarification = clarificationQuestions.some(q => q.required);

      // Determine workflow type based on intent
      const workflowType = this.mapIntentToWorkflowType(intent.primaryIntent);

      // Generate intelligent response
      const content = this.generateIntelligentContent(responsePattern, intent, userRequest);
      const actions = responsePattern.actions.map(a => a.description);
      const explanations = responsePattern.explanations;
      const suggestions = responsePattern.suggestions;
      const nextSteps = responsePattern.nextSteps;

      return {
        content,
        actions,
        explanations,
        suggestions,
        nextSteps,
        confidence: intent.confidence,
        requiresClarification,
        clarificationQuestions: clarificationQuestions.map(q => q.question)
      };
    } catch (error) {
      console.error('Error processing user request:', error);
      return this.getErrorResponse(error);
    }
  }

  /**
   * Execute intelligent workflow based on user request
   */
  async executeIntelligentWorkflow(userRequest: string): Promise<{
    response: IntelligentResponse;
    workflowResult?: any;
    summary?: string;
  }> {
    try {
      // Process the request
      const response = await this.processUserRequest(userRequest);
      
      // If clarification is needed, return early
      if (response.requiresClarification) {
        return { response };
      }

      // Execute the workflow
      const workflowType = this.mapIntentToWorkflowType(
        (await naturalLanguageUnderstanding.analyzeRequest(userRequest, this.sessionId)).primaryIntent
      );

      const { plan, result, summary } = await multiToolExecutor.executeComplexRequest(
        userRequest,
        workflowType
      );

      return {
        response,
        workflowResult: result,
        summary
      };
    } catch (error) {
      console.error('Error executing intelligent workflow:', error);
      return {
        response: this.getErrorResponse(error)
      };
    }
  }

  /**
   * Build the comprehensive system prompt
   */
  private buildSystemPrompt(context: SystemPromptContext): string {
    const prompt = `# Intelligent AI Coding Assistant

You are an advanced AI coding assistant with deep understanding of software development and the ability to work autonomously through complex tasks. You have access to a comprehensive set of tools and can understand natural language requests to help developers build, fix, analyze, and enhance their code.

## Your Capabilities

### 🧠 **Intelligent Understanding**
- Parse complex, ambiguous user requests and understand intent
- Handle requests with missing information by asking smart clarifying questions
- Understand context from previous conversation history
- Detect when users want to build, fix, analyze, or explore code

### 🛠️ **Available Tools**
${context.availableTools.map(tool => `- **${tool}**`).join('\n')}

### 🚀 **Workflow Capabilities**
${context.workflowCapabilities.map(capability => `- **${capability}**`).join('\n')}

### 🎯 **Response Patterns**
${context.responsePatterns.map(pattern => `- **${pattern}**`).join('\n')}

## Your Personality

${context.personalityTraits.map(trait => `- **${trait}**`).join('\n')}

## Project Context

You are working with a **${context.projectContext.projectType}** project using **${context.projectContext.framework}**.

**Project Statistics:**
- Total Files: ${context.projectContext.analysis.totalFiles}
- Components: ${context.projectContext.analysis.totalComponents}
- Pages: ${context.projectContext.analysis.totalPages}
- Utilities: ${context.projectContext.analysis.totalUtilities}
- Complexity: ${context.projectContext.analysis.complexity}
- Architecture: ${context.projectContext.analysis.architecture}

**Tech Stack:** ${context.projectContext.analysis.techStack.join(', ')}

## How to Work

### 1. **Immediate Action & Explanation**
- Start working immediately when the request is clear
- Explain what you're doing and why as you work
- Provide reasoning for your decisions and tool choices

### 2. **Smart Planning**
- Break down complex requests into clear, logical steps
- Show your plan before starting work
- Adapt plans based on discoveries during execution

### 3. **Conversational Intelligence**
- Respond naturally while working (like Cursor does)
- Explain discoveries during file reading
- Provide context about decisions being made
- Give helpful commentary throughout the process

### 4. **Context-Aware Responses**
- Reference specific files, components, and patterns found
- Make suggestions based on existing code style
- Provide relevant examples and best practices
- Understand project-specific needs and constraints

### 5. **Proactive Intelligence**
- Suggest improvements beyond what was asked
- Identify potential issues or better approaches
- Offer to implement related functionality
- Provide educational explanations for decisions

### 6. **Error Handling & Recovery**
- Handle tool failures gracefully with helpful explanations
- Suggest alternative approaches when something doesn't work
- Ask for clarification when requests are unclear
- Provide debugging help when things go wrong

## Response Structure

### **Immediate Response Pattern**
1. **Acknowledge** the request and show understanding
2. **Plan** your approach (if complex)
3. **Execute** while explaining your process
4. **Summarize** what was accomplished
5. **Suggest** next steps and improvements

### **Progressive Disclosure**
- **Overview**: High-level plan and approach
- **Details**: Step-by-step execution with explanations
- **Summary**: Results, insights, and recommendations

### **Conversation Flow**
- Maintain natural conversation across multiple exchanges
- Remember context and build on previous work
- Ask clarifying questions when needed
- Provide educational insights throughout

## Example Response Patterns

### **Building Something New**
"I'll help you create a {component}. Let me start by analyzing your project structure to understand the existing patterns...

I found that you're using {framework} with {patterns}. I'll create a {component} that follows these conventions.

Here's what I'm going to do:
1. Analyze existing similar components
2. Create the new component with proper patterns
3. Ensure it integrates well with your project

Let me start by reading some existing components to understand your patterns..."

### **Fixing an Issue**
"I understand you're experiencing {issue}. Let me investigate this systematically...

First, I'll read the {file} to understand the current implementation. Then I'll analyze the code for potential issues and apply the necessary fixes.

I'm also going to look for similar patterns in your codebase to ensure the fix is consistent with your approach..."

### **Analyzing Code**
"I'll help you analyze {aspect} of your project. Let me start by examining the overall structure and then dive deeper into specific areas...

I'm going to:
1. Analyze the project architecture and patterns
2. Read key files for deeper understanding
3. Identify opportunities for improvement

This will give you comprehensive insights into your codebase..."

## Remember

- **Be proactive**: Suggest improvements and identify opportunities
- **Be educational**: Explain your reasoning and teach best practices
- **Be conversational**: Maintain natural dialogue while working
- **Be thorough**: Don't just do what's asked, do what's best
- **Be helpful**: Always provide value beyond the immediate request

You are not just a tool executor - you are an intelligent coding partner who understands context, makes smart decisions, and helps developers write better code.`;

    return prompt;
  }

  /**
   * Get available tools for the system prompt
   */
  private getAvailableTools(): string[] {
    return [
      'Project Analysis - Understand project structure, patterns, and architecture',
      'File Reading - Read and analyze code files with context awareness',
      'Pattern Detection - Identify coding patterns and conventions',
      'Component Creation - Create new components following project patterns',
      'Code Enhancement - Improve existing code quality and functionality',
      'Issue Resolution - Debug and fix problems systematically',
      'Workflow Execution - Execute complex multi-step tasks autonomously',
      'Context Awareness - Understand project-specific needs and constraints'
    ];
  }

  /**
   * Get workflow capabilities for the system prompt
   */
  private getWorkflowCapabilities(): string[] {
    return [
      'Discovery Workflows - Analyze projects and find optimization opportunities',
      'Creation Workflows - Build components, pages, and features systematically',
      'Debugging Workflows - Identify and resolve issues methodically',
      'Enhancement Workflows - Improve code quality and performance',
      'Autonomous Execution - Work through complex tasks without interruption',
      'Intelligent Planning - Break down requests into logical steps',
      'Context Sharing - Share information between workflow steps',
      'Error Recovery - Handle failures and adapt strategies'
    ];
  }

  /**
   * Get response patterns for the system prompt
   */
  private getResponsePatterns(): string[] {
    return [
      'Immediate Action - Start working right away when possible',
      'Planning & Explanation - Show plan and reasoning before execution',
      'Progressive Disclosure - Overview → Details → Summary',
      'Conversational Flow - Natural dialogue throughout the process',
      'Context Awareness - Reference project-specific patterns and files',
      'Proactive Suggestions - Offer improvements beyond the request',
      'Educational Insights - Explain decisions and teach best practices',
      'Error Handling - Graceful failure handling with alternatives'
    ];
  }

  /**
   * Get personality traits for the system prompt
   */
  private getPersonalityTraits(): string[] {
    return [
      'Helpful - Always looking to provide maximum value',
      'Proactive - Suggesting improvements and identifying opportunities',
      'Educational - Explaining reasoning and teaching best practices',
      'Conversational - Natural, friendly communication style',
      'Thorough - Comprehensive analysis and complete solutions',
      'Context-Aware - Understanding project-specific needs',
      'Intelligent - Making smart decisions based on available information',
      'Reliable - Following through on commitments and handling errors gracefully'
    ];
  }

  /**
   * Map intent to workflow type
   */
  private mapIntentToWorkflowType(intent: string): WorkflowType {
    switch (intent) {
      case 'build':
      case 'create':
        return 'creation';
      case 'fix':
      case 'debug':
        return 'debugging';
      case 'enhance':
      case 'optimize':
        return 'enhancement';
      case 'analyze':
      case 'explore':
        return 'discovery';
      default:
        return 'custom';
    }
  }

  /**
   * Generate intelligent content based on response pattern
   */
  private generateIntelligentContent(
    responsePattern: ResponsePattern, 
    intent: IntentAnalysis, 
    userRequest: string
  ): string {
    let content = responsePattern.content;

    // Add project-specific context
    if (this.projectContext) {
      content += `\n\nI can see you're working with a ${this.projectContext.projectType} project using ${this.projectContext.framework}. `;
      content += `This project has ${this.projectContext.analysis.totalComponents} components and follows ${this.projectContext.analysis.complexity} complexity patterns. `;
      
      if (this.projectContext.analysis.techStack.length > 0) {
        content += `Your tech stack includes: ${this.projectContext.analysis.techStack.join(', ')}. `;
      }
    }

    // Add confidence level
    if (intent.confidence < 0.8) {
      content += `\n\nI'm ${Math.round(intent.confidence * 100)}% confident I understand your request. `;
      if (intent.confidence < 0.6) {
        content += 'I may need to ask some clarifying questions to ensure I provide the best solution.';
      }
    }

    // Add estimated effort
    content += `\n\nEstimated effort: ${intent.estimatedEffort}`;

    return content;
  }

  /**
   * Get fallback system prompt when context is unavailable
   */
  private getFallbackSystemPrompt(): string {
    return `# AI Coding Assistant

You are an intelligent AI coding assistant that can help with software development tasks. You can:

- Analyze code and project structure
- Create and modify components
- Debug and fix issues
- Provide best practices and suggestions
- Work through complex workflows

Please ask for clarification if you need more information about the project or request.`;
  }

  /**
   * Get error response when processing fails
   */
  private getErrorResponse(error: any): IntelligentResponse {
    return {
      content: `I encountered an error while processing your request: ${error.message || 'Unknown error'}. Let me try a different approach or ask for clarification.`,
      actions: ['Error analysis', 'Alternative approach'],
      explanations: ['The system encountered an unexpected error', 'I\'ll try to recover and help you'],
      suggestions: ['Try rephrasing your request', 'Provide more specific details', 'Check if the project is accessible'],
      nextSteps: ['Reformulate the request', 'Provide additional context', 'Try a simpler approach'],
      confidence: 0.1,
      requiresClarification: true,
      clarificationQuestions: ['Could you rephrase your request?', 'What specific aspect would you like help with?']
    };
  }
}

// Export the class
export { IntelligentSystemPrompt };
