'use client';

import { useArtifactStore } from '@/lib/artifact-store';
import { MindMapCanvas } from './mind-map-canvas';
import { SkillAtomBuilder } from './skill-atom-builder';
import { DrillPreview } from './drill-preview';
import { WelcomeScreen } from './welcome-screen';
import { ProgressViewer } from './progress-viewer';
import { FileText, Map, Target, Play, BarChart3, Download, Share, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ARTIFACT_ICONS = {
  mindmap: Map,
  'skill-atom': Target,
  drill: Play,
  progress: BarChart3,
  welcome: FileText,
};

const ARTIFACT_TITLES = {
  mindmap: 'Learning Path Mind Map',
  'skill-atom': 'Skill Details',
  drill: 'Practice Drill',
  progress: 'Progress Overview',
  welcome: 'Getting Started',
};

export function ArtifactViewer() {
  const { currentArtifact, artifacts, cleanupDuplicates } = useArtifactStore();
  
  console.log('🎨 ArtifactViewer render:', {
    hasCurrentArtifact: !!currentArtifact,
    currentArtifactType: currentArtifact?.type,
    currentArtifactTitle: currentArtifact?.title,
    totalArtifacts: artifacts.length
  });

  const handleExport = () => {
    if (!currentArtifact) return;
    
    const dataStr = JSON.stringify(currentArtifact.data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentArtifact.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!currentArtifact) return;
    
    const shareData = {
      title: currentArtifact.title,
      text: `Check out this learning path: ${currentArtifact.title}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to copying URL
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleCleanup = async () => {
    try {
      const cleanedCount = await cleanupDuplicates();
      if (cleanedCount > 0) {
        alert(`Cleanup complete! Removed ${cleanedCount} duplicate artifacts.`);
      } else {
        alert('No duplicates found. Your artifacts are already clean!');
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Cleanup failed. Please check the console for details.');
    }
  };

  const renderArtifactContent = () => {
    if (!currentArtifact) {
      return <WelcomeScreen />;
    }

    switch (currentArtifact.type) {
      case 'mindmap':
        return <MindMapCanvas data={currentArtifact.data} isStreaming={currentArtifact.isStreaming} />;
      case 'skill-atom':
        return <SkillAtomBuilder data={currentArtifact.data} isStreaming={currentArtifact.isStreaming} />;
      case 'drill':
        return <DrillPreview data={currentArtifact.data} isStreaming={currentArtifact.isStreaming} />;
      case 'progress':
        return <ProgressViewer data={currentArtifact.data} isStreaming={currentArtifact.isStreaming} />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentArtifact ? (
              <>
                {(() => {
                  const Icon = ARTIFACT_ICONS[currentArtifact.type];
                  return <Icon className="h-5 w-5 text-primary" />;
                })()}
                <div>
                  <h1 className="text-lg font-semibold">{currentArtifact.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    {ARTIFACT_TITLES[currentArtifact.type]}
                    {currentArtifact.isStreaming && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-green-600 text-xs font-medium">Live</span>
                      </span>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h1 className="text-lg font-semibold">AI Learning Path Creator</h1>
                  <p className="text-sm text-muted-foreground">Start a conversation to begin</p>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {artifacts.length > 1 && (
              <Button variant="outline" size="sm" onClick={handleCleanup}>
                <Trash2 className="h-4 w-4" />
                Cleanup Duplicates
              </Button>
            )}
            {currentArtifact && (
              <>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Artifact Tabs */}
        {artifacts.length > 1 && (
          <div className="flex items-center gap-1 mt-4 overflow-x-auto">
            {artifacts.map((artifact) => {
              const Icon = ARTIFACT_ICONS[artifact.type];
              const isActive = currentArtifact?.id === artifact.id;
              
              return (
                <Button
                  key={artifact.id}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  className={cn(
                    'shrink-0 gap-2',
                    isActive && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => useArtifactStore.getState().setCurrentArtifact(artifact.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="truncate max-w-32">{artifact.title}</span>
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderArtifactContent()}
      </div>
    </div>
  );
}