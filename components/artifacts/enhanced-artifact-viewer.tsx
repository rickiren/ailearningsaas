'use client';

import { useState, useMemo } from 'react';
import { Copy, Download, ChevronDown, ChevronRight, Eye, Code, FileText, Tag, Calendar, User, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Artifact } from '@/lib/artifact-storage';
import { SmoothArtifactRenderer } from './smooth-artifact-renderer';
import { SmoothHeight, FadeIn } from '../chat/smooth-animations';

interface EnhancedArtifactViewerProps {
  artifact: Artifact;
  showMetadata?: boolean;
  collapsible?: boolean;
  className?: string;
  isStreaming?: boolean;
}

const languageIcons: Record<string, React.ReactNode> = {
  typescript: <Code className="h-4 w-4" />,
  javascript: <Code className="h-4 w-4" />,
  tsx: <Code className="h-4 w-4" />,
  jsx: <Code className="h-4 w-4" />,
  html: <FileText className="h-4 w-4" />,
  css: <FileText className="h-4 w-4" />,
  markdown: <FileText className="h-4 w-4" />,
  json: <FileText className="h-4 w-4" />,
  python: <Code className="h-4 w-4" />,
  java: <Code className="h-4 w-4" />,
  cpp: <Code className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />
};

const languageNames: Record<string, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  tsx: 'TSX',
  jsx: 'JSX',
  html: 'HTML',
  css: 'CSS',
  markdown: 'Markdown',
  json: 'JSON',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
  text: 'Text'
};

export function EnhancedArtifactViewer({ 
  artifact, 
  showMetadata = true, 
  collapsible = true,
  className,
  isStreaming = false
}: EnhancedArtifactViewerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.metadata.title}.${artifact.metadata.language || 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Memoize the artifact data for the smooth renderer to prevent unnecessary re-renders
  const smoothArtifactData = useMemo(() => ({
    name: artifact.metadata.title,
    type: artifact.metadata.type,
    content: artifact.content,
    description: artifact.metadata.description,
    data: artifact.rawData,
    isStreaming
  }), [artifact.metadata.title, artifact.metadata.type, artifact.content, artifact.metadata.description, artifact.rawData, isStreaming]);

  const renderMindmapStructure = () => {
    if (!artifact.rawData) return null;

    return (
      <FadeIn>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200 hover:scale-105"
            >
              {showRawData ? <Eye className="h-4 w-4" /> : <Code className="h-4 w-4" />}
              {showRawData ? 'Show Structure' : 'Show Raw Data'}
            </button>
          </div>
          
          <SmoothHeight>
            {showRawData ? (
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-gray-200">
                <code>{JSON.stringify(artifact.rawData, null, 2)}</code>
              </pre>
            ) : (
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Mindmap Structure</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Title:</strong> {artifact.rawData.title || 'Untitled'}</p>
                    <p><strong>Description:</strong> {artifact.rawData.description || 'No description'}</p>
                    <p><strong>Topics:</strong> {artifact.rawData.children?.length || 0}</p>
                    <p><strong>Difficulty:</strong> {artifact.rawData.difficulty || 'Not specified'}</p>
                    <p><strong>Estimated Hours:</strong> {artifact.rawData.estimatedHours || 'Not specified'}</p>
                  </div>
                </div>
                
                {artifact.rawData.children && artifact.rawData.children.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h5 className="font-medium text-green-900 mb-2">Topics</h5>
                    <div className="space-y-2">
                      {artifact.rawData.children.slice(0, 5).map((child: any, index: number) => (
                        <div key={index} className="text-sm text-green-800">
                          • {child.title} {child.description && `- ${child.description}`}
                        </div>
                      ))}
                      {artifact.rawData.children.length > 5 && (
                        <div className="text-sm text-green-600">
                          ... and {artifact.rawData.children.length - 5} more topics
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SmoothHeight>
        </div>
      </FadeIn>
    );
  };

  const shouldUseSmootRenderer = () => {
    const { type } = artifact.metadata;
    return ['mindmap', 'component', 'html', 'interactive', 'drill', 'simulation', 'game', 'assessment', 'react'].includes(type);
  };

  return (
    <div className={cn(
      "border border-gray-200 rounded-lg overflow-hidden bg-white transition-all duration-300 hover:shadow-lg",
      className
    )}>
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {collapsible && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-gray-500 hover:text-gray-700 transition-all duration-200 hover:scale-110"
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
            
            <div className="flex items-center gap-2">
              {languageIcons[artifact.metadata.language || 'text'] || <FileText className="h-4 w-4" />}
              <span className="font-medium text-gray-900">{artifact.metadata.title}</span>
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                {languageNames[artifact.metadata.language || 'text'] || artifact.metadata.type}
              </span>
              {isStreaming && (
                <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  streaming
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-xs rounded transition-all duration-200",
                copied
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105"
              )}
            >
              <Copy className="h-3 w-3" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-all duration-200 hover:scale-105"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          </div>
        </div>

        {/* Metadata Bar */}
        <SmoothHeight>
          {showMetadata && (
            <FadeIn delay={100}>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {artifact.metadata.userId}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(artifact.metadata.created_at)}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    v{artifact.metadata.version}
                  </div>
                  
                  {artifact.metadata.size && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {formatFileSize(artifact.metadata.size)}
                    </div>
                  )}
                  
                  {artifact.metadata.framework && (
                    <div className="flex items-center gap-1">
                      <Code className="h-3 w-3" />
                      {artifact.metadata.framework}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <SmoothHeight>
                  {artifact.metadata.tags && artifact.metadata.tags.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <Tag className="h-3 w-3 text-gray-500" />
                      <div className="flex gap-1">
                        {artifact.metadata.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full transition-transform hover:scale-105"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </SmoothHeight>

                {/* Description */}
                <SmoothHeight>
                  {artifact.metadata.description && (
                    <div className="mt-2 text-sm text-gray-700">
                      {artifact.metadata.description}
                    </div>
                  )}
                </SmoothHeight>
              </div>
            </FadeIn>
          )}
        </SmoothHeight>
      </div>

      {/* Content */}
      <SmoothHeight>
        {!isCollapsed && (
          <div className="transition-all duration-300">
            {artifact.metadata.type === 'mindmap' && artifact.rawData ? (
              <div className="p-4">
                {renderMindmapStructure()}
              </div>
            ) : shouldUseSmootRenderer() ? (
              <div className="h-[600px]">
                <SmoothArtifactRenderer 
                  artifact={smoothArtifactData}
                  className="h-full"
                />
              </div>
            ) : (
              <div className="p-4">
                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap border border-gray-200">
                  {artifact.content}
                </pre>
              </div>
            )}
          </div>
        )}
      </SmoothHeight>
    </div>
  );
}