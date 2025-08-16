'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JsonCodeBlockProps {
  data: any;
  title: string;
  isStreaming?: boolean;
}

export function JsonCodeBlock({ data, title, isStreaming = false }: JsonCodeBlockProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border rounded-lg bg-muted/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-muted/30 border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm">{title}</h3>
          {isStreaming && (
            <div className="flex items-center gap-1 text-primary">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <span className="text-xs font-medium">Live</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 p-0"
          >
            {isCollapsed ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={cn("h-6 w-6 p-0", copied && "text-green-600")}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-6 w-6 p-0"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3">
          <div className="bg-background rounded border overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <pre className="text-xs p-3">
                <code>{JSON.stringify(data, null, 2)}</code>
              </pre>
            </div>
            {isStreaming && (
              <div className="border-t bg-muted/20 p-2 text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span>Generating complete structure...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
