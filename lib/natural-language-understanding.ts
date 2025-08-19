import { contextAwarenessClient, ProjectContext } from './context-awareness-client';
import { multiToolExecutor, WorkflowType } from './multi-tool-executor';

export interface IntentAnalysis {
  primaryIntent: 'build' | 'fix' | 'analyze' | 'explore' | 'enhance' | 'debug' | 'create' | 'modify' | 'understand' | 'optimize';
  confidence: number;
  subIntents: string[];
  entities: Entity[];
  context: RequestContext;
  complexity: 'simple' | 'medium' | 'complex';
  estimatedEffort: string;
}

export interface Entity {
  type: 'component' | 'file' | 'feature' | 'technology' | 'pattern' | 'issue' | 'requirement';
  value: string;
  confidence: number;
  context?: string;
}

export interface RequestContext {
  projectType: string;
  framework: string;
  currentFocus: string[];
  relatedFiles: string[];
  userPreferences: string[];
  constraints: string[];
  opportunities: string[];
}

export interface ClarificationQuestion {
  question: string;
  type: 'choice' | 'text' | 'file' | 'component';
  options?: string[];
  required: boolean;
  reasoning: string;
}

export interface ResponsePattern {
  type: 'immediate_action' | 'planning' | 'execution' | 'discovery' | 'completion' | 'error' | 'clarification';
  content: string;
  actions: Action[];
  explanations: string[];
  suggestions: string[];
  nextSteps: string[];
}

export interface Action {
  type: 'tool_call' | 'file_read' | 'analysis' | 'creation' | 'modification';
  description: string;
  reasoning: string;
  expectedOutcome: string;
}

export interface ConversationMemory {
  sessionId: string;
  userRequests: UserRequest[];
  projectContext: ProjectContext | null;
  workflowHistory: any[];
  userPreferences: Map<string, any>;
  lastFocus: string[];
  createdAt: Date;
  lastUpdated: Date;
}

export interface UserRequest {
  id: string;
  timestamp: Date;
  originalRequest: string;
  intent: IntentAnalysis;
  workflowType: WorkflowType;
  workflowId?: string;
  status: 'completed' | 'in_progress' | 'failed' | 'clarification_needed';
  result?: any;
  feedback?: string;
}

class NaturalLanguageUnderstanding {
  private conversationMemory: Map<string, ConversationMemory> = new Map();
  private intentPatterns: Map<string, RegExp[]> = new Map();
  private entityExtractors: Map<string, RegExp[]> = new Map();
  private responseTemplates: Map<string, string[]> = new Map();

  constructor() {
    this.initializePatterns();
    this.initializeResponseTemplates();
  }

  /**
   * Initialize intent recognition patterns
   */
  private initializePatterns() {
    // Build/Create patterns
    this.intentPatterns.set('build', [
      /build\s+(?:a\s+)?(\w+)/i,
      /create\s+(?:a\s+)?(\w+)/i,
      /make\s+(?:a\s+)?(\w+)/i,
      /develop\s+(?:a\s+)?(\w+)/i,
      /implement\s+(?:a\s+)?(\w+)/i
    ]);

    // Fix/Debug patterns
    this.intentPatterns.set('fix', [
      /fix\s+(?:the\s+)?(\w+)/i,
      /debug\s+(?:the\s+)?(\w+)/i,
      /resolve\s+(?:the\s+)?(\w+)/i,
      /troubleshoot\s+(?:the\s+)?(\w+)/i,
      /repair\s+(?:the\s+)?(\w+)/i
    ]);

    // Analyze/Explore patterns
    this.intentPatterns.set('analyze', [
      /analyze\s+(?:the\s+)?(\w+)/i,
      /examine\s+(?:the\s+)?(\w+)/i,
      /review\s+(?:the\s+)?(\w+)/i,
      /investigate\s+(?:the\s+)?(\w+)/i,
      /understand\s+(?:the\s+)?(\w+)/i
    ]);

    // Enhance/Improve patterns
    this.intentPatterns.set('enhance', [
      /improve\s+(?:the\s+)?(\w+)/i,
      /enhance\s+(?:the\s+)?(\w+)/i,
      /optimize\s+(?:the\s+)?(\w+)/i,
      /refactor\s+(?:the\s+)?(\w+)/i,
      /upgrade\s+(?:the\s+)?(\w+)/i
    ]);

    // Entity extraction patterns
    this.entityExtractors.set('component', [
      /component[s]?\s+(?:called\s+)?(\w+)/gi,
      /(\w+)\s+component/gi,
      /(\w+)\s+page/gi,
      /(\w+)\s+form/gi
    ]);

    this.entityExtractors.set('file', [
      /file[s]?\s+(?:called\s+)?(\w+)/gi,
      /(\w+)\.(?:tsx?|jsx?|vue|css|scss)/gi,
      /in\s+(\w+)/gi
    ]);

    this.entityExtractors.set('feature', [
      /feature[s]?\s+(?:called\s+)?(\w+)/gi,
      /(\w+)\s+functionality/gi,
      /(\w+)\s+capability/gi
    ]);
  }

  /**
   * Initialize response templates for different scenarios
   */
  private initializeResponseTemplates() {
    // Immediate action responses
    this.responseTemplates.set('immediate_action', [
      "I'll help you {action}. Let me start by {first_step}...",
      "Great! I'm going to {action}. First, I'll {first_step}...",
      "I understand you want to {action}. Let me begin by {first_step}..."
    ]);

    // Planning responses
    this.responseTemplates.set('planning', [
      "Here's my plan to {action}:\n\n{plan_steps}\n\nThis approach will {benefits}. Should I proceed?",
      "I've analyzed your request and here's what I'll do:\n\n{plan_steps}\n\nThis will {benefits}. Ready to start?",
      "Based on your request, here's my strategy:\n\n{plan_steps}\n\nThis approach {benefits}. Shall I begin?"
    ]);

    // Discovery responses
    this.responseTemplates.set('discovery', [
      "Interesting! I found {discovery}. This means {implication}.",
      "Great discovery: {discovery}. This suggests {implication}.",
      "I've discovered {discovery}. This indicates {implication}."
    ]);

    // Completion responses
    this.responseTemplates.set('completion', [
      "Perfect! I've successfully {action}. Here's what was accomplished:\n\n{summary}\n\n{next_suggestions}",
      "Excellent! The {action} is complete. Here's a summary:\n\n{summary}\n\n{next_suggestions}",
      "All done! I've {action}. Here's what happened:\n\n{summary}\n\n{next_suggestions}"
    ]);
  }

  /**
   * Analyze user request and understand intent
   */
  async analyzeRequest(userRequest: string, sessionId: string): Promise<IntentAnalysis> {
    try {
      // Get or create conversation memory
      const memory = this.getOrCreateMemory(sessionId);
      
      // Analyze the request
      const intent = this.detectIntent(userRequest);
      const entities = this.extractEntities(userRequest);
      const context = await this.analyzeContext(userRequest, memory);
      
      // Determine complexity and effort
      const complexity = this.assessComplexity(intent, entities, context);
      const estimatedEffort = this.estimateEffort(complexity, intent);
      
      // Update memory
      this.updateMemory(memory, userRequest, intent);
      
      return {
        primaryIntent: intent,
        confidence: this.calculateConfidence(intent, entities),
        subIntents: this.detectSubIntents(userRequest),
        entities,
        context,
        complexity,
        estimatedEffort
      };
    } catch (error) {
      console.error('Error analyzing request:', error);
      throw new Error(`Failed to analyze request: ${error}`);
    }
  }

  /**
   * Detect the primary intent of the request
   */
  private detectIntent(userRequest: string): IntentAnalysis['primaryIntent'] {
    const lowerRequest = userRequest.toLowerCase();
    
    // Check each intent pattern
    for (const [intent, patterns] of this.intentPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(userRequest)) {
          return intent as IntentAnalysis['primaryIntent'];
        }
      }
    }
    
    // Fallback analysis based on keywords
    if (lowerRequest.includes('build') || lowerRequest.includes('create') || lowerRequest.includes('make')) {
      return 'build';
    } else if (lowerRequest.includes('fix') || lowerRequest.includes('debug') || lowerRequest.includes('resolve')) {
      return 'fix';
    } else if (lowerRequest.includes('analyze') || lowerRequest.includes('examine') || lowerRequest.includes('review')) {
      return 'analyze';
    } else if (lowerRequest.includes('improve') || lowerRequest.includes('enhance') || lowerRequest.includes('optimize')) {
      return 'enhance';
    } else if (lowerRequest.includes('understand') || lowerRequest.includes('explore') || lowerRequest.includes('investigate')) {
      return 'explore';
    }
    
    return 'create'; // Default intent
  }

  /**
   * Extract entities from the request
   */
  private extractEntities(userRequest: string): Entity[] {
    const entities: Entity[] = [];
    
    for (const [type, patterns] of this.entityExtractors) {
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(userRequest)) !== null) {
          entities.push({
            type: type as Entity['type'],
            value: match[1] || match[0],
            confidence: 0.8,
            context: this.extractContext(match[0], userRequest)
          });
        }
      }
    }
    
    // Extract additional entities using heuristics
    const words = userRequest.split(/\s+/);
    for (const word of words) {
      if (word.match(/^[A-Z][a-z]+/) && !entities.some(e => e.value === word)) {
        entities.push({
          type: 'component',
          value: word,
          confidence: 0.6,
          context: 'Potential component name'
        });
      }
    }
    
    return entities;
  }

  /**
   * Analyze context based on project and conversation history
   */
  private async analyzeContext(userRequest: string, memory: ConversationMemory): Promise<RequestContext> {
    try {
      // Get project context if available
      const projectContext = memory.projectContext || await contextAwarenessClient.analyzeProject();
      
      // Analyze current focus areas
      const currentFocus = this.analyzeCurrentFocus(userRequest, memory);
      
      // Find related files
      const relatedFiles = await this.findRelatedFiles(userRequest, projectContext);
      
      // Detect user preferences
      const userPreferences = this.detectUserPreferences(userRequest, memory);
      
      // Identify constraints and opportunities
      const constraints = this.identifyConstraints(userRequest, projectContext);
      const opportunities = this.identifyOpportunities(userRequest, projectContext);
      
      return {
        projectType: projectContext.projectType,
        framework: projectContext.framework,
        currentFocus,
        relatedFiles,
        userPreferences,
        constraints,
        opportunities
      };
    } catch (error) {
      console.error('Error analyzing context:', error);
      return {
        projectType: 'unknown',
        framework: 'unknown',
        currentFocus: [],
        relatedFiles: [],
        userPreferences: [],
        constraints: [],
        opportunities: []
      };
    }
  }

  /**
   * Assess the complexity of the request
   */
  private assessComplexity(intent: string, entities: Entity[], context: RequestContext): 'simple' | 'medium' | 'complex' {
    let complexity = 0;
    
    // Intent complexity
    if (intent === 'build' || intent === 'create') complexity += 2;
    else if (intent === 'enhance' || intent === 'optimize') complexity += 3;
    else if (intent === 'fix' || intent === 'debug') complexity += 2;
    else if (intent === 'analyze' || intent === 'explore') complexity += 1;
    
    // Entity complexity
    complexity += entities.length * 0.5;
    
    // Context complexity
    if (context.constraints.length > 0) complexity += 1;
    if (context.relatedFiles.length > 3) complexity += 1;
    
    if (complexity <= 2) return 'simple';
    if (complexity <= 4) return 'medium';
    return 'complex';
  }

  /**
   * Estimate effort required
   */
  private estimateEffort(complexity: string, intent: string): string {
    const baseTime = complexity === 'simple' ? 2 : complexity === 'medium' ? 5 : 10;
    const intentMultiplier = intent === 'build' ? 1.5 : intent === 'enhance' ? 1.2 : 1;
    
    const totalMinutes = Math.round(baseTime * intentMultiplier);
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hours = Math.round(totalMinutes / 60);
    return `${hours}h`;
  }

  /**
   * Generate clarifying questions when information is missing
   */
  generateClarifyingQuestions(intent: IntentAnalysis, userRequest: string): ClarificationQuestion[] {
    const questions: ClarificationQuestion[] = [];
    
    // Check for missing essential information based on intent
    switch (intent.primaryIntent) {
      case 'build':
      case 'create':
        if (!intent.entities.some(e => e.type === 'component' || e.type === 'feature')) {
          questions.push({
            question: "What would you like me to create? (e.g., a component, page, utility, or feature)",
            type: 'choice',
            options: ['Component', 'Page', 'Utility', 'Feature', 'Other'],
            required: true,
            reasoning: "I need to know what type of artifact to create"
          });
        }
        if (!intent.entities.some(e => e.type === 'technology')) {
          questions.push({
            question: "Are there specific technologies or patterns you'd like me to use?",
            type: 'text',
            required: false,
            reasoning: "This helps me follow your project's conventions"
          });
        }
        break;
        
      case 'fix':
      case 'debug':
        if (!intent.entities.some(e => e.type === 'file' || e.type === 'component')) {
          questions.push({
            question: "Which file or component has the issue you'd like me to fix?",
            type: 'file',
            required: true,
            reasoning: "I need to know which specific code to examine"
          });
        }
        if (!userRequest.toLowerCase().includes('error') && !userRequest.toLowerCase().includes('issue')) {
          questions.push({
            question: "What specific problem are you experiencing? (e.g., error message, unexpected behavior, styling issue)",
            type: 'text',
            required: true,
            reasoning: "Understanding the problem helps me provide the right solution"
          });
        }
        break;
        
      case 'enhance':
      case 'optimize':
        if (!intent.entities.some(e => e.type === 'file' || e.type === 'component')) {
          questions.push({
            question: "Which file or component would you like me to enhance?",
            type: 'file',
            required: true,
            reasoning: "I need to know what to improve"
          });
        }
        if (!userRequest.toLowerCase().includes('performance') && !userRequest.toLowerCase().includes('quality')) {
          questions.push({
            question: "What aspect would you like me to improve? (e.g., performance, code quality, user experience, accessibility)",
            type: 'choice',
            options: ['Performance', 'Code Quality', 'User Experience', 'Accessibility', 'Other'],
            required: false,
            reasoning: "This helps me focus on the right improvements"
          });
        }
        break;
    }
    
    return questions;
  }

  /**
   * Generate intelligent response pattern
   */
  async generateResponsePattern(
    intent: IntentAnalysis, 
    userRequest: string, 
    sessionId: string,
    workflowType?: WorkflowType
  ): Promise<ResponsePattern> {
    try {
      const memory = this.getOrCreateMemory(sessionId);
      const actions = this.generateActions(intent, userRequest);
      const explanations = this.generateExplanations(intent, actions);
      const suggestions = this.generateSuggestions(intent, memory);
      const nextSteps = this.generateNextSteps(intent, actions);
      
      // Choose response template
      const templateType = this.selectResponseTemplate(intent, actions);
      const content = this.fillResponseTemplate(templateType, {
        action: this.describeAction(intent),
        first_step: actions[0]?.description || 'analyzing your request',
        plan_steps: actions.map(a => `• ${a.description}`).join('\n'),
        benefits: this.describeBenefits(intent, actions),
        discovery: this.describeDiscovery(intent),
        implication: this.describeImplication(intent),
        summary: this.generateSummary(intent, actions),
        next_suggestions: suggestions.join('\n')
      });
      
      return {
        type: templateType,
        content,
        actions,
        explanations,
        suggestions,
        nextSteps
      };
    } catch (error) {
      console.error('Error generating response pattern:', error);
      throw new Error(`Failed to generate response pattern: ${error}`);
    }
  }

  /**
   * Generate actions based on intent
   */
  private generateActions(intent: IntentAnalysis, userRequest: string): Action[] {
    const actions: Action[] = [];
    
    switch (intent.primaryIntent) {
      case 'build':
      case 'create':
        actions.push(
          {
            type: 'analysis',
            description: 'Analyze project structure and patterns',
            reasoning: 'Understanding existing conventions ensures consistency',
            expectedOutcome: 'Project context and coding patterns'
          },
          {
            type: 'file_read',
            description: 'Read similar existing components',
            reasoning: 'Learning from existing code maintains consistency',
            expectedOutcome: 'Patterns and best practices'
          },
          {
            type: 'creation',
            description: 'Create the new component with proper patterns',
            reasoning: 'Following established conventions',
            expectedOutcome: 'New component that fits the project'
          }
        );
        break;
        
      case 'fix':
      case 'debug':
        actions.push(
          {
            type: 'file_read',
            description: 'Read the problematic file',
            reasoning: 'Need to see the current code to identify issues',
            expectedOutcome: 'Understanding of the problem'
          },
          {
            type: 'analysis',
            description: 'Analyze the code for issues',
            reasoning: 'Systematic analysis finds root causes',
            expectedOutcome: 'Identified problems and solutions'
          },
          {
            type: 'modification',
            description: 'Apply the necessary fixes',
            reasoning: 'Resolving the identified issues',
            expectedOutcome: 'Fixed and improved code'
          }
        );
        break;
        
      case 'analyze':
      case 'explore':
        actions.push(
          {
            type: 'analysis',
            description: 'Analyze project structure and architecture',
            reasoning: 'Comprehensive understanding of the codebase',
            expectedOutcome: 'Project insights and recommendations'
          },
          {
            type: 'file_read',
            description: 'Read key files for deeper understanding',
            reasoning: 'Detailed examination reveals patterns and opportunities',
            expectedOutcome: 'Specific findings and suggestions'
          }
        );
        break;
        
      case 'enhance':
      case 'optimize':
        actions.push(
          {
            type: 'file_read',
            description: 'Read the target file for analysis',
            reasoning: 'Understanding current implementation',
            expectedOutcome: 'Current code structure and quality'
          },
          {
            type: 'analysis',
            description: 'Identify improvement opportunities',
            reasoning: 'Systematic analysis finds enhancement areas',
            expectedOutcome: 'List of improvements to implement'
          },
          {
            type: 'modification',
            description: 'Implement the identified improvements',
            reasoning: 'Applying enhancements systematically',
            expectedOutcome: 'Improved and optimized code'
          }
        );
        break;
    }
    
    return actions;
  }

  /**
   * Generate explanations for actions
   */
  private generateExplanations(intent: IntentAnalysis, actions: Action[]): string[] {
    const explanations: string[] = [];
    
    explanations.push(`I'm going to help you ${this.describeAction(intent)}.`);
    
    for (const action of actions) {
      explanations.push(`${action.description} - ${action.reasoning}`);
    }
    
    if (intent.context.opportunities.length > 0) {
      explanations.push(`I also noticed some opportunities: ${intent.context.opportunities.join(', ')}`);
    }
    
    return explanations;
  }

  /**
   * Generate proactive suggestions
   */
  private generateSuggestions(intent: IntentAnalysis, memory: ConversationMemory): string[] {
    const suggestions: string[] = [];
    
    // Suggest related improvements
    if (intent.primaryIntent === 'build' || intent.primaryIntent === 'create') {
      suggestions.push('Consider adding unit tests for the new component');
      suggestions.push('Think about accessibility features (ARIA labels, keyboard navigation)');
      suggestions.push('Document the component with JSDoc comments');
    }
    
    if (intent.primaryIntent === 'fix' || intent.primaryIntent === 'debug') {
      suggestions.push('Consider adding error boundaries to prevent similar issues');
      suggestions.push('Add logging to help with future debugging');
      suggestions.push('Consider adding unit tests to catch regressions');
    }
    
    if (intent.primaryIntent === 'enhance' || intent.primaryIntent === 'optimize') {
      suggestions.push('Consider performance monitoring for the improved code');
      suggestions.push('Add documentation for the new patterns');
      suggestions.push('Consider creating reusable utilities from the improvements');
    }
    
    return suggestions;
  }

  /**
   * Generate next steps
   */
  private generateNextSteps(intent: IntentAnalysis, actions: Action[]): string[] {
    const nextSteps: string[] = [];
    
    nextSteps.push('Review the changes I make');
    nextSteps.push('Test the functionality to ensure it works as expected');
    
    if (intent.primaryIntent === 'build' || intent.primaryIntent === 'create') {
      nextSteps.push('Consider integrating the new component into your app');
      nextSteps.push('Add any necessary styling or theming');
    }
    
    if (intent.primaryIntent === 'fix' || intent.primaryIntent === 'debug') {
      nextSteps.push('Verify the fix resolves the original issue');
      nextSteps.push('Test related functionality to ensure no regressions');
    }
    
    return nextSteps;
  }

  /**
   * Helper methods
   */
  private getOrCreateMemory(sessionId: string): ConversationMemory {
    if (!this.conversationMemory.has(sessionId)) {
      this.conversationMemory.set(sessionId, {
        sessionId,
        userRequests: [],
        projectContext: null,
        workflowHistory: [],
        userPreferences: new Map(),
        lastFocus: [],
        createdAt: new Date(),
        lastUpdated: new Date()
      });
    }
    return this.conversationMemory.get(sessionId)!;
  }

  private updateMemory(memory: ConversationMemory, userRequest: string, intent: string) {
    memory.lastUpdated = new Date();
    memory.lastFocus = [intent];
  }

  private detectSubIntents(userRequest: string): string[] {
    const subIntents: string[] = [];
    const lower = userRequest.toLowerCase();
    
    if (lower.includes('test')) subIntents.push('testing');
    if (lower.includes('style') || lower.includes('css')) subIntents.push('styling');
    if (lower.includes('performance')) subIntents.push('performance');
    if (lower.includes('accessibility')) subIntents.push('accessibility');
    if (lower.includes('responsive')) subIntents.push('responsive');
    
    return subIntents;
  }

  private calculateConfidence(intent: string, entities: Entity[]): number {
    let confidence = 0.5;
    
    if (entities.length > 0) confidence += 0.2;
    if (intent !== 'create') confidence += 0.1;
    
    return Math.min(confidence, 0.95);
  }

  private analyzeCurrentFocus(userRequest: string, memory: ConversationMemory): string[] {
    const focus: string[] = [];
    
    // Extract focus from current request
    if (userRequest.toLowerCase().includes('component')) focus.push('components');
    if (userRequest.toLowerCase().includes('page')) focus.push('pages');
    if (userRequest.toLowerCase().includes('style')) focus.push('styling');
    if (userRequest.toLowerCase().includes('test')) focus.push('testing');
    
    // Add recent focus from memory
    focus.push(...memory.lastFocus);
    
    return [...new Set(focus)];
  }

  private async findRelatedFiles(userRequest: string, projectContext: ProjectContext): Promise<string[]> {
    try {
      // Find files related to the request
      const relatedFiles: string[] = [];
      
      // Look for components mentioned
      const componentMatches = userRequest.match(/(\w+)\s+(?:component|page|form)/gi);
      if (componentMatches) {
        for (const match of componentMatches) {
          const componentName = match.split(/\s+/)[0];
          const similar = await contextAwarenessClient.findSimilarFiles(
            `${componentName}.tsx`,
            'name'
          );
          relatedFiles.push(...similar);
        }
      }
      
      return relatedFiles.slice(0, 5); // Limit to 5 related files
    } catch (error) {
      return [];
    }
  }

  private detectUserPreferences(userRequest: string, memory: ConversationMemory): string[] {
    const preferences: string[] = [];
    
    if (userRequest.toLowerCase().includes('typescript')) preferences.push('TypeScript');
    if (userRequest.toLowerCase().includes('test')) preferences.push('Testing');
    if (userRequest.toLowerCase().includes('style')) preferences.push('Styling');
    if (userRequest.toLowerCase().includes('accessibility')) preferences.push('Accessibility');
    
    return preferences;
  }

  private identifyConstraints(userRequest: string, projectContext: ProjectContext): string[] {
    const constraints: string[] = [];
    
    if (projectContext.framework === 'Next.js') {
      constraints.push('Next.js App Router conventions');
    }
    
    if (userRequest.toLowerCase().includes('mobile')) {
      constraints.push('Mobile-first responsive design');
    }
    
    return constraints;
  }

  private identifyOpportunities(userRequest: string, projectContext: ProjectContext): string[] {
    const opportunities: string[] = [];
    
    if (projectContext.analysis.complexity === 'high') {
      opportunities.push('Code organization improvements');
    }
    
    if (userRequest.toLowerCase().includes('component')) {
      opportunities.push('Reusable component patterns');
    }
    
    return opportunities;
  }

  private extractContext(match: string, fullRequest: string): string {
    const words = fullRequest.split(/\s+/);
    const matchIndex = words.findIndex(word => word.toLowerCase().includes(match.toLowerCase()));
    
    if (matchIndex > 0 && matchIndex < words.length - 1) {
      return `${words[matchIndex - 1]} ${words[matchIndex]} ${words[matchIndex + 1]}`;
    }
    
    return match;
  }

  private selectResponseTemplate(intent: IntentAnalysis, actions: Action[]): ResponsePattern['type'] {
    if (actions.length === 1) return 'immediate_action';
    if (actions.length > 1) return 'planning';
    return 'clarification';
  }

  private fillResponseTemplate(templateType: string, variables: Record<string, string>): string {
    const templates = this.responseTemplates.get(templateType) || ['{action}'];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  private describeAction(intent: IntentAnalysis): string {
    switch (intent.primaryIntent) {
      case 'build': return 'build what you requested';
      case 'create': return 'create what you need';
      case 'fix': return 'fix the issue';
      case 'debug': return 'debug the problem';
      case 'analyze': return 'analyze the code';
      case 'explore': return 'explore the project';
      case 'enhance': return 'enhance the code';
      case 'optimize': return 'optimize the performance';
      default: return 'help you';
    }
  }

  private describeBenefits(intent: IntentAnalysis, actions: Action[]): string {
    if (intent.primaryIntent === 'build' || intent.primaryIntent === 'create') {
      return 'ensure consistency with your existing codebase and follow best practices';
    } else if (intent.primaryIntent === 'fix' || intent.primaryIntent === 'debug') {
      return 'resolve the issue systematically and prevent similar problems';
    } else if (intent.primaryIntent === 'enhance' || intent.primaryIntent === 'optimize') {
      return 'improve code quality and maintainability';
    }
    return 'provide comprehensive analysis and actionable insights';
  }

  private describeDiscovery(intent: IntentAnalysis): string {
    return 'your project structure and coding patterns';
  }

  private describeImplication(intent: IntentAnalysis): string {
    return 'I can provide more targeted and effective solutions';
  }

  private generateSummary(intent: IntentAnalysis, actions: Action[]): string {
    const completedActions = actions.map(a => a.description).join(', ');
    return `Successfully completed: ${completedActions}`;
  }
}

// Export singleton instance
export const naturalLanguageUnderstanding = new NaturalLanguageUnderstanding();

// Export types
export type { 
  IntentAnalysis, 
  Entity, 
  RequestContext, 
  ClarificationQuestion, 
  ResponsePattern, 
  Action, 
  ConversationMemory, 
  UserRequest 
};
