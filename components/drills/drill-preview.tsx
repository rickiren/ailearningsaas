'use client';

import { useState } from 'react';
import { Edit, Copy, Trash2, Maximize2, Minimize2, Save, Target, Clock, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drill } from '@/types/drills';
import { cn } from '@/lib/utils';
import { useDrillStore } from '@/lib/drill-store';
import { ArtifactRenderer } from './artifact-renderer';

interface DrillPreviewProps {
  drill: Drill | null;
}

export function DrillPreview({ drill }: DrillPreviewProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCode, setEditedCode] = useState('');
  const { updateDrill, deleteDrill } = useDrillStore();

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
      await navigator.clipboard.writeText(drill.code);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this drill?')) {
      deleteDrill(drill.id);
    }
  };

  const handleSaveChanges = () => {
    if (drill && editedCode) {
      updateDrill(drill.id, { code: editedCode });
      setIsEditing(false);
    }
  };

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditedCode(drill.code);
    }
    setIsEditing(!isEditing);
  };

  const renderPreview = () => {
    if (drill.type === 'html') {
      return (
        <ArtifactRenderer
          language="html"
          code={drill.code}
          onSave={(updatedCode) => updateDrill(drill.id, { code: updatedCode })}
        />
      );
    } else if (drill.type === 'jsx') {
      return (
        <ArtifactRenderer
          language="jsx"
          code={drill.code}
          onSave={(updatedCode) => updateDrill(drill.id, { code: updatedCode })}
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
          <h2 className="text-xl font-semibold">{drill.title}</h2>
          <p className="text-sm text-muted-foreground">{drill.description}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Target className="h-4 w-4" />
              <span>{drill.skillName}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{drill.estimatedTime}m</span>
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
          {drill.learningObjectives.map((objective, index) => (
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
