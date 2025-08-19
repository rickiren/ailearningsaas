'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  FileText, 
  Code, 
  Search, 
  Lightbulb, 
  TrendingUp,
  Package,
  Layers,
  GitBranch,
  Settings
} from 'lucide-react';

interface ProjectContext {
  projectType: string;
  framework: string;
  version: string;
  dependencies: Record<string, string>;
  fileStructure: any;
  components: any[];
  pages: any[];
  utilities: any[];
  patterns: any;
  analysis: any;
}

export default function ContextDemoPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
  const [similarFiles, setSimilarFiles] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'structure' | 'patterns' | 'suggestions'>('overview');

  const analyzeProject = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/context/analyze-project');
      const data = await response.json();
      
      if (data.success) {
        setProjectContext(data.context);
      } else {
        console.error('Failed to analyze project:', data.error);
      }
    } catch (error) {
      console.error('Error analyzing project:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const findSimilarFiles = async (targetFile: string, criteria: 'content' | 'purpose' | 'name') => {
    try {
      const response = await fetch('/api/context/find-similar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFile, criteria })
      });
      
      const data = await response.json();
      if (data.success) {
        setSimilarFiles(data.similarFiles);
      }
    } catch (error) {
      console.error('Error finding similar files:', error);
    }
  };

  const getSuggestions = async (fileType: string, name: string) => {
    try {
      const response = await fetch('/api/context/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType, name })
      });
      
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  };

  const renderFileTree = (node: any, depth = 0) => {
    if (!node) return null;
    
    const indent = '  '.repeat(depth);
    const icon = node.type === 'directory' ? <FolderOpen className="w-4 h-4" /> : <FileText className="w-4 h-4" />;
    
    return (
      <div key={node.path} className="font-mono text-sm">
        <div className="flex items-center gap-2 py-1">
          {icon}
          <span className={node.type === 'directory' ? 'text-blue-600 font-medium' : 'text-gray-700'}>
            {node.name}
          </span>
          {node.isComponent && <Badge variant="secondary" className="text-xs">Component</Badge>}
          {node.isPage && <Badge variant="outline" className="text-xs">Page</Badge>}
          {node.isUtility && <Badge variant="destructive" className="text-xs">Utility</Badge>}
        </div>
        {node.children && node.children.map((child: any) => renderFileTree(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Context Awareness Demo
          </h1>
          <p className="text-lg text-slate-600">
            AI-powered project analysis and intelligent file operations
          </p>
        </div>

        {/* Main Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Project Analysis
            </CardTitle>
            <CardDescription>
              Analyze your project structure and get comprehensive context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={analyzeProject} 
                disabled={isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Project'}
              </Button>
              
              {projectContext && (
                <Button 
                  onClick={() => findSimilarFiles('app/page.tsx', 'purpose')}
                  variant="outline"
                >
                  Find Similar Files
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {projectContext && (
          <>
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-white p-1 rounded-lg border">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'structure', label: 'File Structure', icon: GitBranch },
                { id: 'patterns', label: 'Code Patterns', icon: Code },
                { id: 'suggestions', label: 'Suggestions', icon: Lightbulb }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        Project Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <Badge variant="outline">{projectContext.projectType}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Framework:</span>
                        <span className="font-medium">{projectContext.framework}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Version:</span>
                        <span className="font-medium">{projectContext.version}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Layers className="w-5 h-5 text-green-600" />
                        Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Files:</span>
                        <span className="font-medium">{projectContext.analysis.totalFiles}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Components:</span>
                        <span className="font-medium">{projectContext.analysis.totalComponents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pages:</span>
                        <span className="font-medium">{projectContext.analysis.totalPages}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Utilities:</span>
                        <span className="font-medium">{projectContext.analysis.totalUtilities}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Complexity:</span>
                        <Badge variant={
                          projectContext.analysis.complexity === 'high' ? 'destructive' :
                          projectContext.analysis.complexity === 'medium' ? 'default' : 'secondary'
                        }>
                          {projectContext.analysis.complexity}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Architecture:</span>
                        <Badge variant="outline">{projectContext.analysis.architecture}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tech Stack:</span>
                        <div className="flex gap-1">
                          {projectContext.analysis.techStack.map((tech: string) => (
                            <Badge key={tech} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* File Structure Tab */}
              {activeTab === 'structure' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitBranch className="w-5 h-5" />
                      File Structure
                    </CardTitle>
                    <CardDescription>
                      Hierarchical view of your project files and directories
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                      {renderFileTree(projectContext.fileStructure)}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Code Patterns Tab */}
              {activeTab === 'patterns' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Naming Conventions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Components:</span>
                        <Badge variant="outline">{projectContext.patterns.namingConventions.components}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Files:</span>
                        <Badge variant="outline">{projectContext.patterns.namingConventions.files}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Functions:</span>
                        <Badge variant="outline">{projectContext.patterns.namingConventions.functions}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Constants:</span>
                        <Badge variant="outline">{projectContext.patterns.namingConventions.constants}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Folder Structure</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Components:</span>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {projectContext.patterns.folderStructure.components}
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span>Pages:</span>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {projectContext.patterns.folderStructure.pages}
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span>Utilities:</span>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {projectContext.patterns.folderStructure.utilities}
                        </code>
                      </div>
                      <div className="flex justify-between">
                        <span>Styles:</span>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {projectContext.patterns.folderStructure.styles}
                        </code>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Suggestions Tab */}
              {activeTab === 'suggestions' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-yellow-600" />
                        Get Suggestions
                      </CardTitle>
                      <CardDescription>
                        Get context-aware suggestions for file operations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4 mb-4">
                        <Button 
                          onClick={() => getSuggestions('component', 'UserProfile')}
                          variant="outline"
                        >
                          Component Suggestions
                        </Button>
                        <Button 
                          onClick={() => getSuggestions('page', 'dashboard')}
                          variant="outline"
                        >
                          Page Suggestions
                        </Button>
                        <Button 
                          onClick={() => getSuggestions('utility', 'formatDate')}
                          variant="outline"
                        >
                          Utility Suggestions
                        </Button>
                      </div>

                      {suggestions && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-800 mb-2">Suggestions for {suggestions.suggestedName}</h4>
                          <div className="space-y-2 text-sm text-blue-700">
                            <div><strong>Suggested Path:</strong> {suggestions.suggestedPath}</div>
                            <div><strong>Related Files:</strong> {suggestions.relatedFiles?.length || 0} found</div>
                            {suggestions.relatedFiles?.map((file: string, index: number) => (
                              <div key={index} className="ml-4">• {file}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-green-600" />
                        Similar Files
                      </CardTitle>
                      <CardDescription>
                        Find files similar to a target file
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-4 mb-4">
                        <Button 
                          onClick={() => findSimilarFiles('app/page.tsx', 'content')}
                          variant="outline"
                        >
                          Find by Content
                        </Button>
                        <Button 
                          onClick={() => findSimilarFiles('app/page.tsx', 'purpose')}
                          variant="outline"
                        >
                          Find by Purpose
                        </Button>
                        <Button 
                          onClick={() => findSimilarFiles('app/page.tsx', 'name')}
                          variant="outline"
                        >
                          Find by Name
                        </Button>
                      </div>

                      {similarFiles.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h4 className="font-medium text-green-800 mb-2">Similar Files Found:</h4>
                          <div className="space-y-1 text-sm text-green-700">
                            {similarFiles.map((file, index) => (
                              <div key={index} className="ml-4">• {file}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </>
        )}

        {/* Recommendations */}
        {projectContext?.analysis?.recommendations && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                AI Recommendations
              </CardTitle>
              <CardDescription>
                Intelligent suggestions based on your project analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {projectContext.analysis.recommendations.map((rec: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-yellow-800">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
