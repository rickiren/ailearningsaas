import { Message } from '@/types/chat';
import { Bot, User, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/lib/chat-store';
import { processAIMessage, validateMindMapData } from '@/lib/utils';
import { useArtifactStore } from '@/lib/artifact-store';
import { MindmapStore } from '@/lib/mindmap-store';
import { useState } from 'react';
import { MindMapNode } from '@/types/artifacts';

interface ChatMessageProps {
  message: Message;
}

// Type guard to check if data is a valid MindMapNode
function isMindMapNode(data: any): data is MindMapNode {
  return data && typeof data === 'object' && 'id' in data && 'title' in data;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const { isLoading, streamingMessageId } = useChatStore();
  const { currentArtifact, setCurrentArtifact, addArtifact } = useArtifactStore();
  const isStreaming = isLoading && message.id === streamingMessageId;
  const [isLoadingMindmap, setIsLoadingMindmap] = useState(false);
  
  // Process AI message to separate conversational text from JSON
  const { displayContent, jsonData } = !isUser && message.content 
    ? processAIMessage(message.content) 
    : { displayContent: message.content, jsonData: null };
  
  // Check if this message contains mindmap JSON
  const hasMindmap = jsonData && jsonData.type === 'mindmap' && validateMindMapData(jsonData.data);
  
  // Safely get mindmap data
  const mindmapData = hasMindmap && jsonData?.data && isMindMapNode(jsonData.data) ? jsonData.data : null;
  
  // Check if this mindmap is currently displayed
  const isCurrentMindmap = currentArtifact?.type === 'mindmap' && 
    currentArtifact.data?.title === mindmapData?.title;
  
  // Handle loading mindmap from database
  const handleLoadMindmap = async () => {
    if (!hasMindmap || !mindmapData) return;
    
    setIsLoadingMindmap(true);
    try {
      // First, try to find an existing artifact with this title
      const existingArtifact = useArtifactStore.getState().artifacts.find(
        artifact => artifact.type === 'mindmap' && artifact.title === mindmapData.title
      );
      
      if (existingArtifact) {
        // If we have an existing artifact, set it as current
        setCurrentArtifact(existingArtifact.id);
        console.log('✅ Loaded existing mindmap artifact:', existingArtifact.id);
      } else {
        // Try to find it in the database by title
        const projects = await MindmapStore.getUserMindmaps();
        const matchingProject = projects.find(project => project.title === mindmapData.title);
        
        if (matchingProject) {
          // Load the mindmap from database
          const loadedMindmapData = await MindmapStore.loadMindmap(matchingProject.id);
          
          if (loadedMindmapData) {
            // Create a new artifact with the loaded data
            const artifactId = await addArtifact({
              type: 'mindmap',
              title: mindmapData.title,
              data: loadedMindmapData,
              metadata: { projectId: matchingProject.id }
            });
            
            if (artifactId) {
              setCurrentArtifact(artifactId);
              console.log('✅ Loaded mindmap from database:', matchingProject.id);
            }
          }
        } else {
          // If not found in database, create a new artifact from the JSON data
          const artifactId = await addArtifact({
            type: 'mindmap',
            title: mindmapData.title,
            data: mindmapData
          });
          
          if (artifactId) {
            setCurrentArtifact(artifactId);
            console.log('✅ Created new mindmap artifact from JSON data');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error loading mindmap:', error);
      // Fallback: create artifact from JSON data
      try {
        const artifactId = await addArtifact({
          type: 'mindmap',
          title: mindmapData.title,
          data: mindmapData
        });
        
        if (artifactId) {
          setCurrentArtifact(artifactId);
          console.log('✅ Created fallback mindmap artifact');
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
      }
    } finally {
      setIsLoadingMindmap(false);
    }
  };

  return (
    <div className={cn('flex w-full px-3 py-4 gap-3', {
      'bg-muted/30': !isUser,
    })}>
      {/* Avatar */}
      <div className={cn(
        'flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-md border shadow',
        isUser 
          ? 'bg-background' 
          : 'bg-primary text-primary-foreground'
      )}>
        {isUser ? (
          <User className="h-3 w-3" />
        ) : (
          <Bot className="h-3 w-3" />
        )}
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold">
            {isUser ? 'You' : 'AI Learning Assistant'}
          </span>
          <span className="text-xs text-muted-foreground">
            {isStreaming ? 'typing...' : message.timestamp.toLocaleTimeString()}
          </span>
          {hasMindmap && (
            <div className="flex items-center gap-1 text-xs">
              <FileText className="h-3 w-3 text-blue-500" />
              <span className="text-blue-600 font-medium">Mind Map</span>
              {isCurrentMindmap && (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
            </div>
          )}
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words max-w-none">
          {displayContent}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
          )}
          {!isUser && !displayContent && !isStreaming && (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          )}
        </div>
        
        {/* Mindmap Preview - Only show if not currently streaming */}
        {hasMindmap && mindmapData && !isStreaming && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-blue-900">
                {mindmapData.title || 'Untitled Mindmap'}
              </h4>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                {mindmapData.children?.length || 0} topics
              </span>
            </div>
            <p className="text-xs text-blue-700 mb-2">
              {mindmapData.description || 'Learning path visualization'}
            </p>
            <button
              onClick={handleLoadMindmap}
              disabled={isLoadingMindmap}
              className={cn(
                "flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 transition-colors",
                isLoadingMindmap && "opacity-50 cursor-not-allowed"
              )}
            >
              {isLoadingMindmap ? (
                <>
                  <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Loading mind map...</span>
                </>
              ) : (
                <>
                  <span>Click to view full mind map →</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}