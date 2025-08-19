import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

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

class ContextAwarenessServer {
  private projectRoot: string;
  private contextCache: Map<string, ProjectContext> = new Map();
  private fileAnalysisCache: Map<string, any> = new Map();

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Analyze the entire project and return comprehensive context
   */
  async analyzeProject(): Promise<ProjectContext> {
    const cacheKey = 'full_project_analysis';
    
    // Check cache first
    if (this.contextCache.has(cacheKey)) {
      const cached = this.contextCache.get(cacheKey)!;
      // Return cached if less than 5 minutes old
      if (Date.now() - cached.lastUpdated.getTime() < 5 * 60 * 1000) {
        return cached;
      }
    }

    try {
      // Analyze package.json
      const packageInfo = await this.analyzePackageJson();
      
      // Analyze file structure
      const fileStructure = await this.analyzeFileStructure();
      
      // Detect components, pages, and utilities
      const components = await this.detectComponents();
      const pages = await this.detectPages();
      const utilities = await this.detectUtilities();
      
      // Analyze code patterns
      const patterns = await this.analyzeCodePatterns();
      
      // Generate project analysis
      const analysis = this.generateProjectAnalysis({
        components,
        pages,
        utilities,
        patterns,
        fileStructure
      });

      const context: ProjectContext = {
        projectType: this.detectProjectType(packageInfo),
        framework: packageInfo.framework || 'unknown',
        version: packageInfo.version || 'unknown',
        dependencies: packageInfo.dependencies || {},
        devDependencies: packageInfo.devDependencies || {},
        scripts: packageInfo.scripts || {},
        fileStructure,
        components,
        pages,
        utilities,
        patterns,
        analysis,
        lastUpdated: new Date()
      };

      // Cache the result
      this.contextCache.set(cacheKey, context);
      
      return context;
    } catch (error) {
      console.error('Error analyzing project:', error);
      throw new Error(`Failed to analyze project: ${error}`);
    }
  }

  /**
   * Read multiple related files for better context
   */
  async readMultipleFiles(filePaths: string[]): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    
    for (const filePath of filePaths) {
      try {
        const fullPath = path.join(this.projectRoot, filePath);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          results[filePath] = content;
        } else {
          results[filePath] = `File not found: ${filePath}`;
        }
      } catch (error) {
        results[filePath] = `Error reading file: ${error}`;
      }
    }
    
    return results;
  }

  /**
   * Find similar files based on content/purpose
   */
  async findSimilarFiles(targetFile: string, criteria: 'content' | 'purpose' | 'name'): Promise<string[]> {
    try {
      const targetPath = path.join(this.projectRoot, targetFile);
      if (!fs.existsSync(targetPath)) {
        return [];
      }

      const targetContent = fs.readFileSync(targetPath, 'utf-8');
      const targetName = path.basename(targetFile, path.extname(targetFile));
      
      const similarFiles: Array<{ path: string; score: number }> = [];
      
      // Get all relevant files
      const allFiles = await this.getAllProjectFiles();
      
      for (const file of allFiles) {
        if (file === targetFile) continue;
        
        let score = 0;
        
        try {
          const filePath = path.join(this.projectRoot, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const fileName = path.basename(file, path.extname(file));
          
          if (criteria === 'content') {
            const commonWords = this.findCommonWords(targetContent, content);
            score = commonWords.length / Math.max(targetContent.split(' ').length, content.split(' ').length);
          } else if (criteria === 'purpose') {
            score = this.analyzePurposeSimilarity(targetFile, file, targetContent, content);
          } else if (criteria === 'name') {
            score = this.calculateNameSimilarity(targetName, fileName);
          }
          
          if (score > 0.3) {
            similarFiles.push({ path: file, score });
          }
        } catch (error) {
          continue;
        }
      }
      
      return similarFiles
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(f => f.path);
        
    } catch (error) {
      console.error('Error finding similar files:', error);
      return [];
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
    const context = await this.analyzeProject();
    const patterns = context.patterns;
    
    let suggestedPath: string;
    let suggestedName: string;
    
    if (fileType === 'component') {
      suggestedPath = patterns.folderStructure.components;
      suggestedName = this.applyNamingConvention(name, patterns.namingConventions.components);
    } else if (fileType === 'page') {
      suggestedPath = patterns.folderStructure.pages;
      suggestedName = this.applyNamingConvention(name, patterns.namingConventions.pages);
    } else {
      suggestedPath = patterns.folderStructure.utilities;
      suggestedName = this.applyNamingConvention(name, patterns.namingConventions.functions);
    }
    
    const relatedFiles = await this.findRelatedFiles(fileType, name);
    
    return {
      suggestedPath: path.join(suggestedPath, suggestedName),
      suggestedName,
      relatedFiles,
      patterns
    };
  }

  // Private helper methods
  private async analyzePackageJson(): Promise<any> {
    try {
      const packagePath = path.join(this.projectRoot, 'package.json');
      if (!fs.existsSync(packagePath)) {
        return {};
      }
      
      const content = fs.readFileSync(packagePath, 'utf-8');
      const packageJson = JSON.parse(content);
      
      return {
        framework: this.detectFramework(packageJson),
        version: packageJson.version,
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        scripts: packageJson.scripts || {}
      };
    } catch (error) {
      console.error('Error analyzing package.json:', error);
      return {};
    }
  }

  private async analyzeFileStructure(): Promise<FileNode> {
    const rootNode: FileNode = {
      name: path.basename(this.projectRoot),
      path: '.',
      type: 'directory',
      children: []
    };

    try {
      const files = await glob('**/*', {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.git/**', '.next/**', 'dist/**', 'build/**']
      });

      for (const file of files) {
        const fullPath = path.join(this.projectRoot, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isFile()) {
          const node: FileNode = {
            name: path.basename(file),
            path: file,
            type: 'file',
            size: stat.size,
            extension: path.extname(file),
            isComponent: this.isComponentFile(file),
            isPage: this.isPageFile(file),
            isUtility: this.isUtilityFile(file)
          };
          
          this.addFileToTree(rootNode, file, node);
        }
      }
      
      return rootNode;
    } catch (error) {
      console.error('Error analyzing file structure:', error);
      return rootNode;
    }
  }

  private async detectComponents(): Promise<ComponentInfo[]> {
    const components: ComponentInfo[] = [];
    
    try {
      const componentFiles = await glob('**/*.{tsx,jsx,vue}', {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**']
      });

      for (const file of componentFiles) {
        if (this.isComponentFile(file)) {
          const componentInfo = await this.analyzeComponent(file);
          if (componentInfo) {
            components.push(componentInfo);
          }
        }
      }
    } catch (error) {
      console.error('Error detecting components:', error);
    }
    
    return components;
  }

  private async detectPages(): Promise<PageInfo[]> {
    const pages: PageInfo[] = [];
    
    try {
      const pageFiles = await glob('**/*.{tsx,jsx,vue}', {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**']
      });

      for (const file of pageFiles) {
        if (this.isPageFile(file)) {
          const pageInfo = await this.analyzePage(file);
          if (pageInfo) {
            pages.push(pageInfo);
          }
        }
      }
    } catch (error) {
      console.error('Error detecting pages:', error);
    }
    
    return pages;
  }

  private async detectUtilities(): Promise<UtilityInfo[]> {
    const utilities: UtilityInfo[] = [];
    
    try {
      const utilityFiles = await glob('**/*.{ts,js}', {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.next/**', 'dist/**', 'build/**']
      });

      for (const file of utilityFiles) {
        if (this.isUtilityFile(file)) {
          const utilityInfo = await this.analyzeUtility(file);
          if (utilityInfo) {
            utilities.push(utilityInfo);
          }
        }
      }
    } catch (error) {
      console.error('Error detecting utilities:', error);
    }
    
    return utilities;
  }

  private async analyzeComponent(filePath: string): Promise<ComponentInfo | null> {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      const imports = this.extractImports(content);
      const exports = this.extractExports(content);
      const props = this.extractProps(content);
      
      return {
        name: path.basename(filePath, path.extname(filePath)),
        path: filePath,
        type: this.detectComponentType(filePath),
        props,
        dependencies: this.extractDependencies(content),
        imports,
        exports,
        patterns: this.extractComponentPatterns(content)
      };
    } catch (error) {
      console.error(`Error analyzing component ${filePath}:`, error);
      return null;
    }
  }

  private async analyzePage(filePath: string): Promise<PageInfo | null> {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      return {
        name: path.basename(filePath, path.extname(filePath)),
        path: filePath,
        route: this.extractRoute(filePath),
        components: this.extractImportedComponents(content),
        dependencies: this.extractDependencies(content)
      };
    } catch (error) {
      console.error(`Error analyzing page ${filePath}:`, error);
      return null;
    }
  }

  private async analyzeUtility(filePath: string): Promise<UtilityInfo | null> {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      return {
        name: path.basename(filePath, path.extname(filePath)),
        path: filePath,
        type: this.detectUtilityType(content),
        exports: this.extractExports(content),
        imports: this.extractImports(content),
        dependencies: this.extractDependencies(content)
      };
    } catch (error) {
      console.error(`Error analyzing utility ${filePath}:`, error);
      return null;
    }
  }

  private detectProjectType(packageInfo: any): ProjectContext['projectType'] {
    const deps = { ...packageInfo.dependencies, ...packageInfo.devDependencies };
    
    if (deps.next) return 'nextjs';
    if (deps.react) return 'react';
    if (deps.vue) return 'vue';
    if (deps['@angular/core']) return 'angular';
    
    return 'unknown';
  }

  private detectFramework(packageJson: any): string {
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    if (deps.next) return 'Next.js';
    if (deps.react) return 'React';
    if (deps.vue) return 'Vue.js';
    if (deps['@angular/core']) return 'Angular';
    
    return 'Unknown';
  }

  private isComponentFile(filePath: string): boolean {
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);
    
    return (
      (ext === '.tsx' || ext === '.jsx' || ext === '.vue') &&
      (name[0] === name[0]?.toUpperCase() || name.includes('Component'))
    );
  }

  private isPageFile(filePath: string): boolean {
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);
    
    return (
      (ext === '.tsx' || ext === '.jsx' || ext === '.vue') &&
      (name === 'page' || name === 'index' || filePath.includes('pages/') || filePath.includes('app/'))
    );
  }

  private isUtilityFile(filePath: string): boolean {
    const ext = path.extname(filePath);
    const name = path.basename(filePath, ext);
    
    return (
      (ext === '.ts' || ext === '.js') &&
      (name.includes('util') || name.includes('helper') || name.includes('service') || 
       filePath.includes('lib/') || filePath.includes('utils/'))
    );
  }

  private async getAllProjectFiles(): Promise<string[]> {
    try {
      return await glob('**/*', {
        cwd: this.projectRoot,
        ignore: ['node_modules/**', '.git/**', '.next/**', 'dist/**', 'build/**']
      });
    } catch (error) {
      console.error('Error getting project files:', error);
      return [];
    }
  }

  private addFileToTree(root: FileNode, filePath: string, fileNode: FileNode) {
    const parts = filePath.split('/');
    let current = root;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      let child = current.children?.find(c => c.name === part);
      
      if (!child) {
        child = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          type: 'directory',
          children: []
        };
        current.children = current.children || [];
        current.children.push(child);
      }
      
      current = child;
    }
    
    if (current.children) {
      current.children.push(fileNode);
    }
  }

  private extractImports(content: string): string[] {
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"`]([^'"`]+)['"`]/g;
    const imports: string[] = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  private extractExports(content: string): string[] {
    const exportRegex = /export\s+(?:default\s+)?(?:{[^}]*}|\w+)/g;
    const exports: string[] = [];
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[0]);
    }
    
    return exports;
  }

  private extractProps(content: string): string[] {
    const propsRegex = /interface\s+(\w+Props)\s*\{[^}]*\}/g;
    const props: string[] = [];
    let match;
    
    while ((match = propsRegex.exec(content)) !== null) {
      props.push(match[1]);
    }
    
    return props;
  }

  private extractDependencies(content: string): string[] {
    const deps = new Set<string>();
    
    const imports = this.extractImports(content);
    imports.forEach(imp => deps.add(imp));
    
    const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
    let match;
    while ((match = requireRegex.exec(content)) !== null) {
      deps.add(match[1]);
    }
    
    return Array.from(deps);
  }

  private extractImportedComponents(content: string): string[] {
    const imports = this.extractImports(content);
    return imports.filter(imp => 
      imp.includes('.tsx') || imp.includes('.jsx') || imp.includes('.vue')
    );
  }

  private extractRoute(filePath: string): string {
    if (filePath.includes('pages/')) {
      return filePath.replace('pages/', '').replace(/\.(tsx|jsx|vue)$/, '');
    }
    if (filePath.includes('app/')) {
      return filePath.replace('app/', '').replace(/\.(tsx|jsx|vue)$/, '');
    }
    return filePath;
  }

  private detectComponentType(filePath: string): ComponentInfo['type'] {
    const ext = path.extname(filePath);
    if (ext === '.tsx' || ext === '.jsx') return 'react';
    if (ext === '.vue') return 'vue';
    return 'vanilla';
  }

  private detectUtilityType(content: string): UtilityInfo['type'] {
    if (content.includes('class ')) return 'class';
    if (content.includes('const ') && content.includes('=')) return 'constant';
    return 'function';
  }

  private extractComponentPatterns(content: string): ComponentPatterns {
    return {
      namingConventions: 'PascalCase',
      fileExtensions: ['.tsx'],
      importPatterns: this.extractImports(content),
      exportPatterns: this.extractExports(content),
      folderStructure: {
        components: 'components/',
        pages: 'pages/',
        utilities: 'lib/',
        styles: 'styles/'
      }
    };
  }

  private async analyzeCodePatterns(): Promise<CodePatterns> {
    const cacheKey = 'code_patterns';
    
    if (this.fileAnalysisCache.has(cacheKey)) {
      return this.fileAnalysisCache.get(cacheKey);
    }

    try {
      const patterns: CodePatterns = {
        namingConventions: await this.analyzeNamingConventions(),
        fileExtensions: await this.analyzeFileExtensions(),
        importPatterns: await this.analyzeImportPatterns(),
        exportPatterns: await this.analyzeExportPatterns(),
        folderStructure: await this.analyzeFolderStructure()
      };

      this.fileAnalysisCache.set(cacheKey, patterns);
      return patterns;
    } catch (error) {
      console.error('Error detecting code patterns:', error);
      return this.getDefaultPatterns();
    }
  }

  private async analyzeNamingConventions(): Promise<CodePatterns['namingConventions']> {
    return {
      components: 'PascalCase',
      files: 'PascalCase',
      functions: 'camelCase',
      constants: 'UPPER_SNAKE_CASE'
    };
  }

  private async analyzeFileExtensions(): Promise<CodePatterns['fileExtensions']> {
    return {
      components: ['.tsx', '.jsx', '.vue'],
      pages: ['.tsx', '.jsx', '.vue'],
      utilities: ['.ts', '.js'],
      styles: ['.css', '.scss', '.module.css']
    };
  }

  private async analyzeImportPatterns(): Promise<string[]> {
    return [
      'import { Component } from "./Component"',
      'import Component from "./Component"',
      'import * as Utils from "./utils"'
    ];
  }

  private async analyzeExportPatterns(): Promise<string[]> {
    return [
      'export default Component',
      'export { Component }',
      'export const utility = {}'
    ];
  }

  private async analyzeFolderStructure(): Promise<CodePatterns['folderStructure']> {
    return {
      components: 'components/',
      pages: 'app/',
      utilities: 'lib/',
      styles: 'styles/'
    };
  }

  private getDefaultPatterns(): CodePatterns {
    return {
      namingConventions: {
        components: 'PascalCase',
        files: 'PascalCase',
        functions: 'camelCase',
        constants: 'UPPER_SNAKE_CASE'
      },
      fileExtensions: {
        components: ['.tsx', '.jsx'],
        pages: ['.tsx', '.jsx'],
        utilities: ['.ts', '.js'],
        styles: ['.css', '.scss']
      },
      importPatterns: [],
      exportPatterns: [],
      folderStructure: {
        components: 'components/',
        pages: 'app/',
        utilities: 'lib/',
        styles: 'styles/'
      }
    };
  }

  private findCommonWords(text1: string, text2: string): string[] {
    const words1 = new Set(text1.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    
    return Array.from(words1).filter(word => words2.has(word));
  }

  private analyzePurposeSimilarity(file1: string, file2: string, content1: string, content2: string): number {
    let score = 0;
    
    if (path.dirname(file1) === path.dirname(file2)) score += 0.3;
    if (path.extname(file1) === path.extname(file2)) score += 0.2;
    
    const commonWords = this.findCommonWords(content1, content2);
    score += Math.min(commonWords.length * 0.1, 0.5);
    
    return score;
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const words1 = name1.toLowerCase().split(/[-_]/);
    const words2 = name2.toLowerCase().split(/[-_]/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private async findRelatedFiles(fileType: string, name: string): Promise<string[]> {
    const context = await this.analyzeProject();
    
    if (fileType === 'component') {
      return context.components
        .filter(c => c.name.toLowerCase().includes(name.toLowerCase()))
        .map(c => c.path);
    } else if (fileType === 'page') {
      return context.pages
        .filter(p => p.name.toLowerCase().includes(name.toLowerCase()))
        .map(p => p.path);
    } else {
      return context.utilities
        .filter(u => u.name.toLowerCase().includes(name.toLowerCase()))
        .map(u => u.path);
    }
  }

  private generateProjectAnalysis(data: {
    components: ComponentInfo[];
    pages: PageInfo[];
    utilities: UtilityInfo[];
    patterns: CodePatterns;
    fileStructure: FileNode;
  }): ProjectAnalysis {
    const totalFiles = this.countFiles(data.fileStructure);
    const totalComponents = data.components.length;
    const totalPages = data.pages.length;
    const totalUtilities = data.utilities.length;
    
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (totalFiles > 100 || totalComponents > 20) complexity = 'high';
    else if (totalFiles > 50 || totalComponents > 10) complexity = 'medium';
    
    let architecture: 'monolithic' | 'modular' | 'microservices' = 'modular';
    if (totalFiles > 200) architecture = 'monolithic';
    else if (totalFiles < 20) architecture = 'microservices';
    
    const techStack = this.detectTechStack(data);
    const recommendations = this.generateRecommendations(data, complexity);
    
    return {
      totalFiles,
      totalComponents,
      totalPages,
      totalUtilities,
      complexity,
      architecture,
      techStack,
      recommendations
    };
  }

  private countFiles(node: FileNode): number {
    let count = 0;
    if (node.type === 'file') count = 1;
    if (node.children) {
      count += node.children.reduce((sum, child) => sum + this.countFiles(child), 0);
    }
    return count;
  }

  private detectTechStack(data: any): string[] {
    const techStack: string[] = [];
    
    if (data.components.some((c: ComponentInfo) => c.type === 'react')) techStack.push('React');
    if (data.components.some((c: ComponentInfo) => c.type === 'vue')) techStack.push('Vue.js');
    if (data.patterns.fileExtensions.styles.includes('.scss')) techStack.push('Sass');
    if (data.patterns.fileExtensions.utilities.includes('.ts')) techStack.push('TypeScript');
    
    return techStack;
  }

  private generateRecommendations(data: any, complexity: string): string[] {
    const recommendations: string[] = [];
    
    if (complexity === 'high') {
      recommendations.push('Consider breaking down large components into smaller, reusable pieces');
      recommendations.push('Implement a component library for consistency');
    }
    
    if (data.components.length > 20) {
      recommendations.push('Organize components into feature-based folders');
    }
    
    if (!data.patterns.folderStructure.components) {
      recommendations.push('Create a dedicated components folder for better organization');
    }
    
    return recommendations;
  }

  private applyNamingConvention(name: string, convention: string): string {
    switch (convention) {
      case 'PascalCase':
        return name.split(/[-_\s]/).map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join('');
      case 'camelCase':
        return name.split(/[-_\s]/).map((word, index) => 
          index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join('');
      case 'kebab-case':
        return name.toLowerCase().replace(/[-_\s]+/g, '-');
      case 'snake_case':
        return name.toLowerCase().replace(/[-_\s]+/g, '_');
      default:
        return name;
    }
  }
}

// Export singleton instance
export const contextAwarenessServer = new ContextAwarenessServer(process.cwd());

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
