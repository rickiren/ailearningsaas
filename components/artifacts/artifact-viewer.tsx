'use client';

import { useState } from 'react';
import { Copy, Download, ChevronDown, ChevronRight, Eye, Code, FileText, Tag, Calendar, User, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Artifact } from '@/lib/artifact-storage';

interface ArtifactViewerProps {
  artifact: Artifact;
  showMetadata?: boolean;
  collapsible?: boolean;
  className?: string;
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

export function ArtifactViewer({ 
  artifact, 
  showMetadata = true, 
  collapsible = true,
  className 
}: ArtifactViewerProps) {
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

  const renderContent = () => {
    const { type, language } = artifact.metadata;
    
    // For mindmaps, show structured data
    if (type === 'mindmap' && artifact.rawData) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRawData(!showRawData)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showRawData ? <Eye className="h-4 w-4" /> : <Code className="h-4 w-4" />}
              {showRawData ? 'Show Structure' : 'Show Raw Data'}
            </button>
          </div>
          
          {showRawData ? (
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{JSON.stringify(artifact.rawData, null, 2)}</code>
            </pre>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Mindmap Structure</h4>
                <div className="text-sm text-blue-800">
                  <p><strong>Title:</strong> {artifact.rawData.title || 'Untitled'}</p>
                  <p><strong>Description:</strong> {artifact.rawData.description || 'No description'}</p>
                  <p><strong>Topics:</strong> {artifact.rawData.children?.length || 0}</p>
                  <p><strong>Difficulty:</strong> {artifact.rawData.difficulty || 'Not specified'}</p>
                  <p><strong>Estimated Hours:</strong> {artifact.rawData.estimatedHours || 'Not specified'}</p>
                </div>
              </div>
              
              {artifact.rawData.children && artifact.rawData.children.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
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
        </div>
      );
    }

    // For code artifacts, show with syntax highlighting
    if (['component', 'function', 'class', 'interface', 'type'].includes(type) || 
        ['typescript', 'javascript', 'tsx', 'jsx', 'python', 'java', 'cpp'].includes(language || '')) {
      return (
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
          <code>{artifact.content}</code>
        </pre>
      );
    }

    // For HTML, show rendered preview
    if (type === 'html' || language === 'html') {
      return (
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div dangerouslySetInnerHTML={{ __html: artifact.content }} />
          </div>
          <details className="bg-gray-50 p-3 rounded-lg">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">View HTML Source</summary>
            <pre className="mt-2 text-xs text-gray-600 overflow-x-auto">
              <code>{artifact.content}</code>
            </pre>
          </details>
        </div>
      );
    }

    // For markdown, show formatted text
    if (type === 'markdown' || language === 'markdown') {
      return (
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap">{artifact.content}</div>
        </div>
      );
    }

    // For JSON, show formatted
    if (type === 'json' || language === 'json') {
      try {
        const parsed = JSON.parse(artifact.content);
        return (
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{JSON.stringify(parsed, null, 2)}</code>
          </pre>
        );
      } catch {
        return (
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{artifact.content}</code>
          </pre>
        );
      }
    }

    // Default: show as plain text
    return (
      <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
        {artifact.content}
      </pre>
    );
  };

  return (
    <div className={cn("border border-gray-200 rounded-lg overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {collapsible && (
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
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
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors",
                copied
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <Copy className="h-3 w-3" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          </div>
        </div>

        {/* Metadata Bar */}
        {showMetadata && (
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
            {artifact.metadata.tags && artifact.metadata.tags.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <Tag className="h-3 w-3 text-gray-500" />
                <div className="flex gap-1">
                  {artifact.metadata.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {artifact.metadata.description && (
              <div className="mt-2 text-sm text-gray-700">
                {artifact.metadata.description}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4">
          {renderContent()}
        </div>
      )}
    </div>
  );
}