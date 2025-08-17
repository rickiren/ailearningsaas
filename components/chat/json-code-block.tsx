'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, Eye, EyeOff, Check } from 'lucide-react';
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
    <div className="mx-4 mb-6 border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 bg-blue-500 rounded-full" />
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
          {isStreaming && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.1s'}} />
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}} />
              </div>
              <span className="text-xs font-medium">Live</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0 text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-all duration-200 rounded-lg"
          >
            {isCollapsed ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={cn(
              "h-8 w-8 p-0 text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-all duration-200 rounded-lg",
              copied && "text-green-600 hover:text-green-700 hover:bg-green-50"
            )}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0 text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-all duration-200 rounded-lg"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4">
          <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <pre className="text-xs p-4 text-slate-700 leading-relaxed">
                <code>{JSON.stringify(data, null, 2)}</code>
              </pre>
            </div>
            {isStreaming && (
              <div className="border-t border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.1s'}} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}} />
                  </div>
                  <span className="font-medium">Generating complete structure...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
