'use client';

import { useState, useEffect } from 'react';
import { Edit, Copy, Trash2, Maximize2, Minimize2, Save, Target, Clock, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drill } from '@/types/drills';
import { cn } from '@/lib/utils';
import { useDrillStore } from '@/lib/drill-store';
import { ArtifactRenderer } from './artifact-renderer';

interface DrillPreviewProps {
  drill: Drill | null;
  onDrillUpdate?: (drill: Drill) => void;
  onCodeUpdate?: (code: string) => void;
}

export function DrillPreview({ drill, onDrillUpdate, onCodeUpdate }: DrillPreviewProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [localDrill, setLocalDrill] = useState<Drill | null>(drill);
  const { updateDrill, deleteDrill, lastUpdated } = useDrillStore();
  
  // This will automatically re-render when AI updates content
  useEffect(() => {
    if (drill && lastUpdated) {
      // Force re-render of preview with new content
      console.log('Drill content updated, re-rendering preview');
      setLocalDrill(drill);
    }
  }, [drill?.code, lastUpdated]);

  // Update local drill when prop changes
  useEffect(() => {
    setLocalDrill(drill);
    setIsUpdating(false);
  }, [drill]);

  // Remove the problematic useEffect that was causing infinite loops
  // The onDrillUpdate will be called directly when needed

  // Handle real-time code updates from chat
  const handleCodeUpdate = (newCode: string) => {
    if (localDrill) {
      setIsUpdating(true);
      const updatedDrill = { ...localDrill, code: newCode };
      setLocalDrill(updatedDrill);
      
      // Update the store
      updateDrill(localDrill.id, { code: newCode });
      
      // Notify parent component
      if (onCodeUpdate) {
        onCodeUpdate(newCode);
      }
      
      // Clear updating state after a short delay
      setTimeout(() => setIsUpdating(false), 2000);
    }
  };

  if (!drill) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/5">
        <div className="text-center">
          <Code className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No Drill Selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a drill from the sidebar or create a new one to get started
          </p>
        </div>
      </div>
    );
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(localDrill?.code || '');
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDelete = () => {
    if (localDrill && confirm('Are you sure you want to delete this drill?')) {
      deleteDrill(localDrill.id);
    }
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditedCode(localDrill?.code || '');
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = () => {
    if (localDrill && editedCode) {
      updateDrill(localDrill.id, { code: editedCode });
      setLocalDrill({ ...localDrill, code: editedCode });
      setIsEditing(false);
    }
  };

  const renderPreview = () => {
    if (localDrill?.type === 'html') {
      return (
        <ArtifactRenderer
          language="html"
          code={localDrill.code}
          onSave={(updatedCode) => handleCodeUpdate(updatedCode)}
          isUpdating={isUpdating}
        />
      );
    } else if (localDrill?.type === 'jsx') {
      return (
        <ArtifactRenderer
          language="jsx"
          code={localDrill.code}
          onSave={(updatedCode) => handleCodeUpdate(updatedCode)}
          isUpdating={isUpdating}
        />
      );
    }
    
    return (
      <div className="w-full h-full bg-muted/10 flex items-center justify-center">
        <div className="text-center">
          <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Preview not available for this drill type</p>
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      'h-full flex flex-col',
      isFullScreen ? 'fixed inset-0 z-50 bg-background' : 'relative'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{localDrill?.title}</h2>
          <p className="text-sm text-muted-foreground">{localDrill?.description}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4" />
              <span>{localDrill?.skillName}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{localDrill?.estimatedTime}m</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditToggle}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? 'View' : 'Edit'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullScreen(!isFullScreen)}
          >
            {isFullScreen ? (
              <Minimize2 className="h-4 w-4 mr-2" />
            ) : (
              <Maximize2 className="h-4 w-4 mr-2" />
            )}
            {isFullScreen ? 'Exit' : 'Full'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Learning Objectives */}
      <div className="px-4 py-3 bg-muted/5 border-b">
        <h4 className="text-sm font-medium mb-2">Learning Objectives:</h4>
        <div className="flex flex-wrap gap-2">
          {localDrill?.learningObjectives.map((objective, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
            >
              {objective}
            </span>
          ))}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-hidden">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 p-4">
              <textarea
                value={editedCode}
                onChange={(e) => setEditedCode(e.target.value)}
                className="w-full h-full p-4 font-mono text-sm bg-muted/10 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter your code here..."
              />
            </div>
            <div className="p-4 border-t bg-muted/5">
              <Button onClick={handleSaveChanges} className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          renderPreview()
        )}
      </div>
    </div>
  );
}
