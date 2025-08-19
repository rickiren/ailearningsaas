import { contextAwarenessClient, ProjectContext } from './context-awareness-client';

export interface CreateArtifactOptions {
  type: 'component' | 'page' | 'utility' | 'style' | 'test';
  name: string;
  content: string;
  path?: string;
  context?: string;
  followPatterns?: boolean;
}

export interface UpdateArtifactOptions {
  path: string;
  content: string;
  context?: string;
  preserveStructure?: boolean;
}

export interface ReadFileOptions {
  path: string;
  includeContext?: boolean;
  findRelated?: boolean;
  analyzePatterns?: boolean;
}

export interface ContextAwareResult {
  success: boolean;
  message: string;
  path?: string;
  content?: string;
  context?: ProjectContext;
  suggestions?: string[];
  relatedFiles?: string[];
  patterns?: any;
  warnings?: string[];
}

class AIEditingTools {
  private projectContext: ProjectContext | null = null;
  private contextCache: Map<string, any> = new Map();

  /**
   * Create a new artifact with context awareness
   */
  async createArtifact(options: CreateArtifactOptions): Promise<ContextAwareResult> {
    try {
      // Get project context
      const context = await this.getProjectContext();
      
      // Get context-aware suggestions
      const suggestions = await contextAwarenessClient.getContextAwareSuggestions(
        options.type as 'component' | 'page' | 'utility',
        options.name
      );
      
      // Determine final path
      let finalPath = options.path;
      if (!finalPath) {
        finalPath = suggestions.suggestedPath;
      }
      
      // For client-side, we can't actually create files, so we return the analysis
      return {
        success: true,
        message: `Would create ${options.type} at ${finalPath}`,
        path: finalPath,
        content: options.content,
        context,
        relatedFiles: suggestions.relatedFiles,
        patterns: suggestions.patterns
      };
      
    } catch (error) {
      console.error('Error creating artifact:', error);
      return {
        success: false,
        message: `Failed to create artifact: ${error}`,
        context: await this.getProjectContext()
      };
    }
  }

  /**
   * Update an existing artifact with context awareness
   */
  async updateArtifact(options: UpdateArtifactOptions): Promise<ContextAwareResult> {
    try {
      // Get project context
      const context = await this.getProjectContext();
      
      // For client-side, we can't actually update files, so we return the analysis
      return {
        success: true,
        message: `Would update ${options.path}`,
        path: options.path,
        content: options.content,
        context
      };
      
    } catch (error) {
      console.error('Error updating artifact:', error);
      return {
        success: false,
        message: `Failed to update artifact: ${error}`,
        context: await this.getProjectContext()
      };
    }
  }

  /**
   * Read file with enhanced context awareness
   */
  async readFile(options: ReadFileOptions): Promise<ContextAwareResult> {
    try {
      // Get project context
      const context = await this.getProjectContext();
      
      // For client-side, we can't actually read files, so we return the context
      let result: ContextAwareResult = {
        success: true,
        message: `Would read ${options.path}`,
        path: options.path,
        context
      };
      
      // Include additional context if requested
      if (options.includeContext) {
        const fileContext = await this.analyzeFileContext(options.path, context);
        result = { ...result, ...fileContext };
      }
      
      // Find related files if requested
      if (options.findRelated) {
        const relatedFiles = await contextAwarenessClient.findSimilarFiles(options.path, 'purpose');
        result.relatedFiles = relatedFiles;
      }
      
      // Analyze patterns if requested
      if (options.analyzePatterns) {
        const patterns = await this.analyzeFilePatterns(options.path, context);
        result.patterns = patterns;
      }
      
      return result;
      
    } catch (error) {
      console.error('Error reading file:', error);
      return {
        success: false,
        message: `Failed to read file: ${error}`,
        context: await this.getProjectContext()
      };
    }
  }

  /**
   * Read multiple related files for comprehensive context
   */
  async readMultipleFiles(filePaths: string[]): Promise<ContextAwareResult> {
    try {
      const context = await this.getProjectContext();
      const results = await contextAwarenessClient.readMultipleFiles(filePaths);
      
      return {
        success: true,
        message: `Successfully read ${filePaths.length} files`,
        content: JSON.stringify(results, null, 2),
        context,
        relatedFiles: filePaths
      };
      
    } catch (error) {
      console.error('Error reading multiple files:', error);
      return {
        success: false,
        message: `Failed to read multiple files: ${error}`,
        context: await this.getProjectContext()
      };
    }
  }

  /**
   * Analyze project structure and return comprehensive context
   */
  async analyzeProject(): Promise<ContextAwareResult> {
    try {
      const context = await contextAwarenessClient.analyzeProject();
      
      return {
        success: true,
        message: 'Project analysis completed successfully',
        context,
        content: JSON.stringify({
          summary: {
            projectType: context.projectType,
            framework: context.framework,
            totalFiles: context.analysis.totalFiles,
            totalComponents: context.analysis.totalComponents,
            totalPages: context.analysis.totalPages,
            complexity: context.analysis.complexity,
            architecture: context.analysis.architecture,
            techStack: context.analysis.techStack
          },
          recommendations: context.analysis.recommendations,
          patterns: context.patterns
        }, null, 2)
      };
      
    } catch (error) {
      console.error('Error analyzing project:', error);
      return {
        success: false,
        message: `Failed to analyze project: ${error}`
      };
    }
  }

  /**
   * Get context-aware suggestions for file operations
   */
  async getSuggestions(operation: 'create' | 'update' | 'refactor', fileType: string, name: string): Promise<ContextAwareResult> {
    try {
      const context = await this.getProjectContext();
      
      if (operation === 'create') {
        const suggestions = await contextAwarenessClient.getContextAwareSuggestions(
          fileType as 'component' | 'page' | 'utility',
          name
        );
        
        return {
          success: true,
          message: 'Context-aware suggestions generated',
          context,
          suggestions: [suggestions.suggestedPath],
          patterns: suggestions.patterns,
          relatedFiles: suggestions.relatedFiles
        };
      }
      
      return {
        success: false,
        message: `Operation ${operation} not supported for suggestions`,
        context
      };
      
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return {
        success: false,
        message: `Failed to get suggestions: ${error}`,
        context: await this.getProjectContext()
      };
    }
  }

  // Private helper methods

  private async getProjectContext(): Promise<ProjectContext> {
    if (!this.projectContext) {
      this.projectContext = await contextAwarenessClient.getProjectContext();
    }
    return this.projectContext;
  }

  private async analyzeFileContext(filePath: string, context: ProjectContext): Promise<Partial<ContextAwareResult>> {
    const patterns = await contextAwarenessClient.analyzeProject();
    
    return {
      patterns,
      suggestions: [`This is a file following ${context.projectType} patterns`]
    };
  }

  private async analyzeFilePatterns(filePath: string, context: ProjectContext): Promise<any> {
    const patterns = await contextAwarenessClient.analyzeProject();
    
    return {
      naming: patterns.patterns.namingConventions,
      structure: patterns.patterns.folderStructure,
      imports: [],
      exports: []
    };
  }

  private updateContextCache(filePath: string, type: string): void {
    // Invalidate relevant cache entries
    this.contextCache.delete('full_project_analysis');
    this.projectContext = null;
  }
}

// Export singleton instance
export const aiEditingTools = new AIEditingTools();




