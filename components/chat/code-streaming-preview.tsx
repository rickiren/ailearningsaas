'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Code, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeStreamingPreviewProps {
  artifactName: string;
  artifactType: string;
  isStreaming: boolean;
  streamedContent: string;
  finalContent?: string;
  className?: string;
}

export function CodeStreamingPreview({ 
  artifactName, 
  artifactType, 
  isStreaming, 
  streamedContent, 
  finalContent,
  className = '' 
}: CodeStreamingPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const contentToShow = finalContent || streamedContent;
  const isComplete = !isStreaming;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contentToShow);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getLanguageFromType = (type: string) => {
    switch (type) {
      case 'component':
      case 'react':
        return 'tsx';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'javascript':
        return 'javascript';
      default:
        return 'text';
    }
  };

  const getFileExtension = (type: string) => {
    switch (type) {
      case 'component':
      case 'react':
        return '.tsx';
      case 'html':
        return '.html';
      case 'css':
        return '.css';
      case 'javascript':
        return '.js';
      default:
        return '.txt';
    }
  };

  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-gray-900">{artifactName}</span>
              <span className="text-xs text-gray-500 bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {artifactType}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Streaming indicator */}
            {isStreaming && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span>Building...</span>
              </div>
            )}

            {/* Completion indicator */}
            {isComplete && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Complete</span>
              </div>
            )}

            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors",
                copied
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            
            {/* Download button for completed artifacts */}
            {isComplete && (
              <button
                onClick={() => {
                  const blob = new Blob([contentToShow], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${artifactName}${getFileExtension(artifactType)}`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
            )}
            
            {/* Close button for completed artifacts */}
            {isComplete && (
              <button
                onClick={() => {
                  // This will need to be handled by the parent component
                  // For now, we'll just hide it by setting a local state
                  setIsExpanded(false);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
          <span>
            {isStreaming ? 'Streaming code in real-time...' : 'Code generation complete'}
          </span>
          <span className="font-mono">
            {artifactName}{getFileExtension(artifactType)}
          </span>
        </div>
      </div>

      {/* Code Content */}
      {isExpanded && (
        <div className="relative">
          {/* Code editor-like interface with fixed dimensions */}
          <div className="bg-gray-900 text-gray-100 overflow-hidden rounded-b-lg">
            {/* File header bar */}
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-400 bg-gray-800 border-b border-gray-700">
              <div className="flex space-x-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="ml-2 font-medium">{artifactName}{getFileExtension(artifactType)}</span>
            </div>
            
            {/* Code content with fixed height and scrolling */}
            <div className="relative">
              {/* Line numbers - fixed position */}
              <div className="absolute left-0 top-0 bg-gray-800 text-gray-400 text-xs font-mono py-4 px-3 border-r border-gray-700 select-none w-12 h-full">
                {contentToShow.split('\n').map((_, index) => (
                  <div key={index} className="text-right pr-2 leading-6">
                    {index + 1}
                  </div>
                ))}
              </div>
              
              {/* Code content - scrollable with padding for line numbers */}
              <div className="pl-12 pr-4 py-4 overflow-auto" style={{ height: '400px' }}>
                <pre className="text-sm font-mono leading-6">
                  <code className={`language-${getLanguageFromType(artifactType)}`}>
                    {contentToShow}
                    {isStreaming && (
                      <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1"></span>
                    )}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
