'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Copy, Code, Eye, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmoothHeight, FadeIn } from '../chat/smooth-animations';

// Function to convert React component code to HTML for iframe rendering
function convertReactToHtml(reactCode: string, componentName: string): string {
  if (reactCode.includes('styled-components') || reactCode.includes('styled.')) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${componentName} Preview</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: #f8fafc;
            color: #1f2937;
        }
        .preview-notice {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
        }
        .mock-landing {
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            min-height: 80vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-align: center;
            border-radius: 12px;
        }
        .mock-content {
            max-width: 600px;
            padding: 40px;
        }
        .mock-title {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        .mock-subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
            margin-bottom: 2rem;
        }
        .mock-button {
            background: white;
            color: #4f46e5;
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .mock-button:hover {
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="preview-notice">
        ⚠️ <strong>React Component Preview:</strong> This is a visual representation of your ${componentName} component.
    </div>
    <div class="mock-landing">
        <div class="mock-content">
            <h1 class="mock-title">Beautiful Landing Page</h1>
            <p class="mock-subtitle">A modern, responsive landing page with smooth animations and modern design elements.</p>
            <button class="mock-button">Get Started</button>
        </div>
    </div>
</body>
</html>`;
  }
  
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${componentName} Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: white;
        }
        * {
            box-sizing: border-box;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        ${reactCode}
        
        const root = ReactDOM.createRoot(document.getElementById('root'));
        
        let ComponentToRender;
        
        if (typeof ${componentName} !== 'undefined') {
            ComponentToRender = ${componentName};
        } else if (typeof LandingPage !== 'undefined') {
            ComponentToRender = LandingPage;
        } else if (typeof App !== 'undefined') {
            ComponentToRender = App;
        } else {
            ComponentToRender = () => React.createElement('div', {style: {color: 'red', padding: '20px'}}, 'Component could not be rendered.');
        }
        
        try {
            root.render(React.createElement(ComponentToRender));
        } catch (error) {
            console.error('Render error:', error);
            root.render(React.createElement('div', {style: {color: 'red', padding: '20px'}}, 'Error rendering component: ' + error.message));
        }
    </script>
</body>
</html>`;
  
  return htmlTemplate;
}

interface SmoothArtifactProps {
  artifact: {
    name?: string;
    type?: string;
    content?: string;
    description?: string;
    preview?: string;
    metadata?: {
      title?: string;
      type?: string;
      description?: string;
    };
    data?: any;
    isStreaming?: boolean;
  };
  className?: string;
}

export function SmoothArtifactRenderer({ artifact, className = '' }: SmoothArtifactProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [isUpdating, setIsUpdating] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [stableContent, setStableContent] = useState<string>('');
  const [previousContent, setPreviousContent] = useState<string>('');
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get artifact properties with fallbacks
  const artifactName = artifact.name || artifact.metadata?.title || 'Untitled';
  const artifactType = artifact.type || artifact.metadata?.type || 'unknown';
  const artifactContent = artifact.content || artifact.data || '';
  const artifactDescription = artifact.description || artifact.metadata?.description || '';

  // Debounced content update to prevent constant re-rendering
  const updateContent = useCallback((newContent: string) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Show updating indicator
    setIsUpdating(true);
    setRenderError(null);
    
    updateTimeoutRef.current = setTimeout(() => {
      if (newContent !== stableContent) {
        setPreviousContent(stableContent);
        setStableContent(newContent);
      }
      setIsUpdating(false);
    }, artifact.isStreaming ? 500 : 100); // Longer delay while streaming
  }, [stableContent, artifact.isStreaming]);

  // Update content when artifact changes
  useEffect(() => {
    updateContent(artifactContent);
  }, [artifactContent, updateContent]);

  // Handle iframe loading
  const handleIframeLoad = useCallback(() => {
    setRenderError(null);
    setIsUpdating(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setRenderError('Failed to render content');
    setIsUpdating(false);
  }, []);

  // Generate stable iframe content
  const getIframeContent = useCallback(() => {
    if (!stableContent) return '<div>Loading...</div>';
    
    if (artifactType === 'html' || artifactType === 'interactive' || 
        artifactType === 'drill' || artifactType === 'simulation' || 
        artifactType === 'game' || artifactType === 'assessment') {
      return stableContent;
    } else if (artifactType === 'component' || artifactType === 'react') {
      return convertReactToHtml(stableContent, artifactName);
    }
    
    return `<pre style="padding: 20px; margin: 0; background: #1f2937; color: #e5e7eb; font-family: monospace; overflow: auto; height: 100vh;">${stableContent}</pre>`;
  }, [stableContent, artifactType, artifactName]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifactContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const extension = artifactType === 'html' ? 'html' : 
                     artifactType === 'component' || artifactType === 'react' ? 'tsx' : 'txt';
    const blob = new Blob([artifactContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifactName}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    setRenderError(null);
    setIsUpdating(true);
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.srcDoc = getIframeContent();
        }
      }, 100);
    }
  };

  return (
    <div className={cn("h-full flex flex-col bg-white", className)}>
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{artifactName}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {artifactType}
              </span>
              {artifact.isStreaming && (
                <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  streaming
                </div>
              )}
              {isUpdating && (
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  updating
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('preview')}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs rounded transition-all duration-200",
                  viewMode === 'preview'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                )}
              >
                <Eye className="w-3 h-3" />
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 text-xs rounded transition-all duration-200",
                  viewMode === 'code'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                )}
              >
                <Code className="w-3 h-3" />
                Code
              </button>
            </div>

            {renderError && (
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                title="Refresh content"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}

            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-xs rounded transition-all duration-200",
                copied
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-105"
              )}
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-all duration-200 hover:scale-105"
            >
              <Download className="w-3 h-3" />
              Download
            </button>
          </div>
        </div>

        {/* Error Display */}
        <SmoothHeight>
          {renderError && (
            <FadeIn>
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{renderError}</span>
                <button 
                  onClick={handleRefresh}
                  className="ml-auto text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </FadeIn>
          )}
        </SmoothHeight>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Loading Overlay */}
        {isUpdating && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Updating content...
            </div>
          </div>
        )}

        {viewMode === 'preview' ? (
          <div className="w-full h-full">
            {(artifactType === 'html' || artifactType === 'interactive' || 
              artifactType === 'drill' || artifactType === 'simulation' || 
              artifactType === 'game' || artifactType === 'assessment' ||
              artifactType === 'component' || artifactType === 'react') ? (
              <iframe
                ref={iframeRef}
                srcDoc={getIframeContent()}
                className="w-full h-full border-0 transition-opacity duration-300"
                title={`Preview of ${artifactName}`}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                style={{ opacity: isUpdating ? 0.7 : 1 }}
              />
            ) : (
              <div className="bg-gray-900 text-gray-100 h-full overflow-auto transition-opacity duration-300" style={{ opacity: isUpdating ? 0.7 : 1 }}>
                <div className="p-4">
                  <pre className="text-sm font-mono whitespace-pre-wrap">{stableContent}</pre>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-900 h-full overflow-auto transition-opacity duration-300" style={{ opacity: isUpdating ? 0.7 : 1 }}>
            <div className="p-4">
              <div className="text-gray-400 text-sm font-mono">
                <pre className="whitespace-pre-wrap text-gray-300">{artifactContent}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}