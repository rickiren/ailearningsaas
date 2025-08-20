'use client';

import { useState, useEffect } from 'react';
import { Copy, Code, Eye, Download, ExternalLink } from 'lucide-react';

// Function to convert React component code to HTML for iframe rendering
function convertReactToHtml(reactCode: string, componentName: string): string {
  // Check if the component uses styled-components or other complex dependencies
  if (reactCode.includes('styled-components') || reactCode.includes('styled.')) {
    // For styled-components, we need a more sophisticated approach
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
        The actual React code with styled-components is shown in the code section below.
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
  
  // For simple React components without complex dependencies
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
        
        // Try to render the component
        const root = ReactDOM.createRoot(document.getElementById('root'));
        
        // Extract the default export or named export
        let ComponentToRender;
        
        // Try to find the component in different ways
        if (typeof ${componentName} !== 'undefined') {
            ComponentToRender = ${componentName};
        } else if (typeof LandingPage !== 'undefined') {
            ComponentToRender = LandingPage;
        } else if (typeof App !== 'undefined') {
            ComponentToRender = App;
        } else {
            // Fallback - show an error
            ComponentToRender = () => React.createElement('div', {style: {color: 'red', padding: '20px'}}, 'Component could not be rendered. Check console for errors.');
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

interface Zero280Artifact {
  name?: string;
  type?: string;
  content?: string;
  description?: string;
  preview?: string;
  // Support for both old and new artifact structures
  metadata?: {
    title?: string;
    type?: string;
    description?: string;
  };
  data?: any;
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
    // Debug logging for artifact structure
    console.log('Rendering artifact:', artifact);
    
    // Get artifact properties with fallbacks for different structures
    const artifactName = artifact.name || artifact.metadata?.title || 'Untitled';
    const artifactType = artifact.type || artifact.metadata?.type || 'unknown';
    const artifactContent = artifact.content || artifact.data || '';
    const artifactDescription = artifact.description || artifact.metadata?.description || '';
    
    console.log('Artifact details:', { artifactName, artifactType, contentLength: artifactContent.length });
    
    // Render the artifact content based on type
    if (artifactType === 'html') {
      setRenderedContent(
        <iframe
          key={`iframe-${artifactName}-${Date.now()}`} // Force re-render when content changes
          srcDoc={artifactContent}
          className="w-full h-full border-0"
          title={`Preview of ${artifactName}`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          onLoad={() => {
            console.log('HTML artifact iframe loaded successfully');
          }}
          onError={(e) => {
            console.error('HTML artifact iframe failed to load:', e);
          }}
        />
      );
    } else if (artifactType === 'component' || artifactType === 'react') {
      // For React components, convert to HTML for iframe rendering
      const htmlContent = convertReactToHtml(artifactContent, artifactName);
      
      setRenderedContent(
        <iframe
          key={`iframe-react-${artifactName}-${Date.now()}`} // Force re-render when content changes
          srcDoc={htmlContent}
          className="w-full h-full border-0"
          title={`Preview of ${artifactName}`}
          sandbox="allow-scripts allow-same-origin allow-forms"
          onLoad={() => {
            console.log('React component iframe loaded successfully');
          }}
          onError={(e) => {
            console.error('React component iframe failed to load:', e);
          }}
        />
      );
    } else {
      // For other types, show the content as code in a simple format
      setRenderedContent(
        <div className="bg-gray-900 text-gray-100 h-full overflow-auto">
          <div className="p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap">{artifactContent}</pre>
          </div>
        </div>
      );
    }
  }, [artifact]);

  const handleCopy = async () => {
    try {
      const content = artifact.content || artifact.data || '';
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const artifactName = artifact.name || artifact.metadata?.title || 'untitled';
    const artifactType = artifact.type || artifact.metadata?.type || 'txt';
    const content = artifact.content || artifact.data || '';
    
    const extension = artifactType === 'html' ? 'html' : 
                     artifactType === 'component' || artifactType === 'react' ? 'tsx' : 'txt';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${artifactName}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {artifact.name || artifact.metadata?.title || 'Untitled'}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {artifact.type || artifact.metadata?.type || 'unknown'}
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'preview' ? (
          <div className="w-full h-full">
            {renderedContent}
          </div>
        ) : (
          <div className="bg-gray-900 h-full overflow-auto">
            <div className="p-4">
              <div className="text-gray-400 text-sm font-mono">
                <pre className="whitespace-pre-wrap text-gray-300">{artifact.content || artifact.data}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
