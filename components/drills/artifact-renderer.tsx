'use client';

import { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, RefreshCw, Code, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ArtifactRendererProps {
  language: 'html' | 'jsx' | 'javascript';
  code: string;
  onSave?: (code: string) => void;
  className?: string;
}

export function ArtifactRenderer({
  language,
  code,
  onSave,
  className
}: ArtifactRendererProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'html'>('preview');
  const [currentCode, setCurrentCode] = useState(code);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentCode(code);
    setError(null);
  }, [code]);

  const renderArtifact = () => {
    if (language === 'html') {
      return (
        <iframe
          ref={iframeRef}
          srcDoc={currentCode}
          className="w-full h-full border-0 bg-white"
          title="Artifact Preview"
          sandbox="allow-scripts allow-same-origin allow-forms"
          onLoad={() => setError(null)}
          onError={() => setError('Failed to load HTML artifact')}
        />
      );
    } else if (language === 'jsx' || language === 'javascript') {
      return (
        <div className="w-full h-full bg-muted/10 flex items-center justify-center">
          <div className="text-center p-8">
            <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">React Component Preview</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This is a React component. The preview will be rendered in the main application.
            </p>
            <div className="bg-background p-4 rounded-lg border text-left max-w-full overflow-auto">
              <pre className="text-xs">
                <code>{currentCode}</code>
              </pre>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="w-full h-full bg-muted/10 flex items-center justify-center">
        <div className="text-center">
          <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Preview not available for this language</p>
        </div>
      </div>
    );
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
    setError(null);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(currentCode);
    }
  };

  return (
    <div className={cn(
      'h-full flex flex-col bg-background',
      isFullScreen ? 'fixed inset-0 z-50' : 'relative',
      className
    )}>
                        {/* Header */}
                  <div className="flex items-center justify-between p-4 border-b bg-background">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                          {language.toUpperCase()}
                        </span>
                        
                        {/* Tabs */}
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setActiveTab('preview')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                              activeTab === 'preview'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => setActiveTab('html')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                              activeTab === 'html'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                            }`}
                          >
                            HTML
                          </button>
                        </div>
                      </div>
                    </div>
        
                            <div className="flex items-center space-x-2">
                      {language === 'html' && activeTab === 'preview' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRefresh}
                          title="Refresh Preview"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
          
          {onSave && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              title="Save Artifact"
            >
              <Square className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
          >
            {isFullScreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

                        {/* Content Area */}
                  <div className="flex-1 overflow-hidden">
                    {activeTab === 'html' ? (
                      <div className="h-full p-4">
                        <div className="h-full bg-muted/10 border rounded-lg overflow-hidden">
                          <div className="px-4 py-2 bg-muted/20 border-b text-xs font-medium text-muted-foreground">
                            Generated Code ({currentCode.length} characters)
                          </div>
                          <textarea
                            value={currentCode}
                            onChange={(e) => setCurrentCode(e.target.value)}
                            className="w-full h-full p-4 font-mono text-xs bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Code will appear here..."
                          />
                        </div>
                      </div>
                    ) : (
                      renderArtifact()
                    )}
                  </div>

                        {/* Footer Info */}
                  <div className="px-4 py-2 bg-muted/5 border-t text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Language: {language}</span>
                      <span>{activeTab === 'html' ? 'Code View' : 'Live Preview'} • {currentCode.length} characters</span>
                    </div>
                  </div>
    </div>
  );
}
