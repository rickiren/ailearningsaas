// Client-side safe context awareness types and interfaces
// This file provides the same types as the server version but without Node.js dependencies

export interface ProjectContext {
  projectType: 'react' | 'nextjs' | 'vue' | 'angular' | 'vanilla' | 'unknown';
  framework: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  fileStructure: FileNode;
  components: ComponentInfo[];
  utilities: UtilityInfo[];
  pages: PageInfo[];
  patterns: CodePatterns;
  analysis: ProjectAnalysis;
  lastUpdated: Date;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  extension?: string;
  isComponent?: boolean;
  isPage?: boolean;
  isUtility?: boolean;
}

export interface ComponentInfo {
  name: string;
  path: string;
  type: 'react' | 'vue' | 'angular' | 'vanilla';
  props?: string[];
  dependencies: string[];
  imports: string[];
  exports: string[];
  patterns: ComponentPatterns;
}

export interface UtilityInfo {
  name: string;
  path: string;
  type: 'function' | 'class' | 'constant';
  exports: string[];
  imports: string[];
  dependencies: string[];
}

export interface PageInfo {
  name: string;
  path: string;
  route: string;
  components: string[];
  dependencies: string[];
}

export interface CodePatterns {
  namingConventions: {
    components: string;
    files: string;
    functions: string;
    constants: string;
  };
  fileExtensions: {
    components: string[];
    pages: string[];
    utilities: string[];
    styles: string[];
  };
  importPatterns: string[];
  exportPatterns: string[];
  folderStructure: {
    components: string;
    pages: string;
    utilities: string;
    styles: string;
  };
}

export interface ProjectAnalysis {
  totalFiles: number;
  totalComponents: number;
  totalPages: number;
  totalUtilities: number;
  complexity: 'low' | 'medium' | 'high';
  architecture: 'monolithic' | 'modular' | 'microservices';
  techStack: string[];
  recommendations: string[];
}

// Client-side context awareness class that communicates with the server
export class ContextAwarenessClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  }

  /**
   * Analyze the entire project and return comprehensive context
   */
  async analyzeProject(): Promise<ProjectContext> {
    try {
      const response = await fetch(`${this.baseUrl}/api/context/analyze-project`);
      const data = await response.json();
      
      if (data.success) {
        return data.context;
      } else {
        throw new Error(data.error || 'Failed to analyze project');
      }
    } catch (error) {
      console.error('Error analyzing project:', error);
      throw new Error(`Failed to analyze project: ${error}`);
    }
  }

  /**
   * Read multiple related files for better context
   */
  async readMultipleFiles(filePaths: string[]): Promise<Record<string, string>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/context/read-multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePaths })
      });
      
      const data = await response.json();
      if (data.success) {
        return data.results;
      } else {
        throw new Error(data.error || 'Failed to read multiple files');
      }
    } catch (error) {
      console.error('Error reading multiple files:', error);
      throw new Error(`Failed to read multiple files: ${error}`);
    }
  }

  /**
   * Find similar files based on content/purpose
   */
  async findSimilarFiles(targetFile: string, criteria: 'content' | 'purpose' | 'name'): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/context/find-similar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFile, criteria })
      });
      
      const data = await response.json();
      if (data.success) {
        return data.similarFiles;
      } else {
        throw new Error(data.error || 'Failed to find similar files');
      }
    } catch (error) {
      console.error('Error finding similar files:', error);
      throw new Error(`Failed to find similar files: ${error}`);
    }
  }

  /**
   * Get context-aware suggestions for file creation
   */
  async getContextAwareSuggestions(fileType: 'component' | 'page' | 'utility', name: string): Promise<{
    suggestedPath: string;
    suggestedName: string;
    relatedFiles: string[];
    patterns: any;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/context/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType, name })
      });
      
      const data = await response.json();
      if (data.success) {
        return data.suggestions;
      } else {
        throw new Error(data.error || 'Failed to get suggestions');
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw new Error(`Failed to get suggestions: ${error}`);
    }
  }

  /**
   * Get project context with caching
   */
  async getProjectContext(): Promise<ProjectContext> {
    return this.analyzeProject();
  }
}

// Export singleton instance for client-side use
export const contextAwarenessClient = new ContextAwarenessClient();

// Export types for use in other modules
export type { 
  ProjectContext, 
  FileNode, 
  ComponentInfo, 
  UtilityInfo, 
  PageInfo, 
  CodePatterns, 
  ProjectAnalysis 
};
