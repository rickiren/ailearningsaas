'use client';

import { useState, useEffect } from 'react';
import { Copy, Code, Eye, Download, ExternalLink } from 'lucide-react';

interface Zero280Artifact {
  name: string;
  type: string;
  content: string;
  description: string;
  preview: string;
}

interface Zero280ArtifactRendererProps {
  artifact: Zero280Artifact;
  className?: string;
}

export function Zero280ArtifactRenderer({ artifact, className = '' }: Zero280ArtifactRendererProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [renderedContent, setRenderedContent] = useState<React.ReactNode>(null);

  useEffect(() => {
    // Render the artifact content based on type
    if (artifact.type === 'html') {
      setRenderedContent(
        <div className="w-full h-full">
          <iframe
            srcDoc={artifact.content}
            className="w-full border rounded"
            style={{ height: '500px', minHeight: '400px' }}
            title={`Preview of ${artifact.name}`}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      );
    } else if (artifact.type === 'component' || artifact.type === 'react') {
      // For React components, we'll show the code and a note about rendering
      setRenderedContent(
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <Code className="w-12 h-12 mx-auto mb-2" />
            <p>React Component: {artifact.name}</p>
            <p className="text-sm">{artifact.description}</p>
          </div>
          <div className="bg-gray-100 rounded p-3 text-sm text-gray-600 font-mono text-left overflow-auto max-h-64">
            <pre>{artifact.content}</pre>
          </div>
        </div>
      );
    } else {
      // For other types, show the content as code
      setRenderedContent(
        <div className="bg-gray-100 rounded p-3 text-sm text-gray-600 font-mono overflow-auto max-h-64">
          <pre>{artifact.content}</pre>
        </div>
      );
    }
  }, [artifact]);

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
    const extension = artifact.type === 'html' ? 'html' : 
                     artifact.type === 'component' || artifact.type === 'react' ? 'tsx' : 'txt';
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifact.name}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{artifact.name}</span>
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                {artifact.type}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Eye className="w-3 h-3" />
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                  viewMode === 'code'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Code className="w-3 h-3" />
                Code
              </button>
            </div>

            <button
              onClick={handleCopy}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                copied
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          </div>
        </div>

        {/* Description */}
        {artifact.description && (
          <div className="mt-2 text-sm text-gray-700">
            {artifact.description}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {viewMode === 'preview' ? (
          <div className="w-full">
            {renderedContent}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
            <div className="text-gray-400 text-sm font-mono">
              <pre className="whitespace-pre-wrap text-gray-300">{artifact.content}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
