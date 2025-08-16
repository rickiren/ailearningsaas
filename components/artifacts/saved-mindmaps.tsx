'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useArtifactStore } from '@/lib/artifact-store';
import { Project } from '@/lib/supabase';
import { FolderOpen, Trash2, Plus } from 'lucide-react';

interface SavedMindmapsProps {
  onLoadMindmap: (projectId: string) => void;
}

export function SavedMindmaps({ onLoadMindmap }: SavedMindmapsProps) {
  const [savedMindmaps, setSavedMindmaps] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getSavedMindmaps, loadMindmapFromDatabase } = useArtifactStore();

  useEffect(() => {
    loadSavedMindmaps();
  }, []);

  const loadSavedMindmaps = async () => {
    setIsLoading(true);
    try {
      const mindmaps = await getSavedMindmaps();
      setSavedMindmaps(mindmaps);
    } catch (error) {
      console.error('Failed to load saved mindmaps:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMindmap = async (projectId: string) => {
    try {
      const artifactId = await loadMindmapFromDatabase(projectId);
      if (artifactId) {
        onLoadMindmap(projectId);
      }
    } catch (error) {
      console.error('Failed to load mindmap:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTotalNodes = (metadata: any) => {
    return metadata?.totalNodes || 'Unknown';
  };

  const getTotalHours = (metadata: any) => {
    return metadata?.estimatedTotalHours || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">Loading saved mindmaps...</p>
      </div>
    );
  }

  if (savedMindmaps.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Saved Mindmaps</h3>
        <p className="text-muted-foreground text-sm">
          Start a conversation to create your first learning path mindmap
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved Learning Paths</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadSavedMindmaps}
          className="text-xs"
        >
          Refresh
        </Button>
      </div>
      
      <div className="space-y-3">
        {savedMindmaps.map((mindmap) => (
          <div
            key={mindmap.id}
            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium mb-1">{mindmap.title}</h4>
                {mindmap.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {mindmap.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Nodes: {getTotalNodes(mindmap.metadata)}</span>
                  <span>Hours: {getTotalHours(mindmap.metadata)}</span>
                  <span>Created: {formatDate(mindmap.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadMindmap(mindmap.id)}
                  className="h-8 px-3"
                >
                  <FolderOpen className="h-4 w-4 mr-1" />
                  Load
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
