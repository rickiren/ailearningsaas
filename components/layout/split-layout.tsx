'use client';

import { useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ChevronLeft, ChevronRight, MessageCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useArtifactStore } from '@/lib/artifact-store';
import { useAIEditingFeedback, AIEditingFeedback } from '@/components/artifacts/ai-editing-feedback';

interface SplitLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  className?: string;
}

export function SplitLayout({ leftPanel, rightPanel, className }: SplitLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileTabMode, setIsMobileTabMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'artifact' | 'chat'>('artifact');
  const { currentArtifact } = useArtifactStore();
  const { feedbacks, removeFeedback } = useAIEditingFeedback();

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={cn('h-screen bg-background', className)}>
      {/* AI Editing Feedback */}
      {feedbacks.map((feedback) => (
        <AIEditingFeedback
          key={feedback.id}
          message={feedback.message}
          type={feedback.type}
          duration={feedback.duration}
          onClose={() => removeFeedback(feedback.id)}
        />
      ))}
      
      {/* Mobile/Tablet View */}
      <div className="lg:hidden h-full">
        <div className="flex h-full flex-col">
          {/* Tab Switcher */}
          <div className="flex border-b bg-background">
            <Button
              variant={activeTab === 'artifact' ? 'default' : 'ghost'}
              className="rounded-none border-r flex-1"
              onClick={() => setActiveTab('artifact')}
            >
              <FileText className="h-4 w-4 mr-2" />
              {currentArtifact?.title || 'Learning Path'}
            </Button>
            <Button
              variant={activeTab === 'chat' ? 'default' : 'ghost'}
              className="rounded-none flex-1"
              onClick={() => setActiveTab('chat')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat
            </Button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'artifact' ? (
              <div className="h-full">{leftPanel}</div>
            ) : (
              <div className="h-full">{rightPanel}</div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block h-full">
        <PanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Artifact Viewer */}
          <Panel 
            defaultSize={70} 
            minSize={30}
            className="relative"
          >
            <div className="h-full bg-background border-r">
              {leftPanel}
            </div>
          </Panel>

          {/* Resize Handle */}
          <PanelResizeHandle className="w-2 bg-border hover:bg-accent transition-colors relative group">
            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-border group-hover:bg-primary transition-colors" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 bg-muted-foreground/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </PanelResizeHandle>

          {/* Right Panel - Chat Sidebar */}
          <Panel 
            defaultSize={30} 
            minSize={25}
            maxSize={50}
            className="relative"
          >
            <div className="h-full bg-muted/10">
              {rightPanel}
            </div>

            {/* Collapse Button */}
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 -left-6 z-10 h-8 w-8 p-0 rounded-full shadow-md bg-background border"
              onClick={toggleCollapse}
            >
              {isCollapsed ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}