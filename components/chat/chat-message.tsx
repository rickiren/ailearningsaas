import { Message } from '@/types/chat';
import { Bot, User, FileText, CheckCircle, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/lib/chat-store';
import { processAIMessage, validateMindMapData } from '@/lib/utils';
import { useArtifactStore } from '@/lib/artifact-store';
import { MindmapStore } from '@/lib/mindmap-store';
import { useState } from 'react';
import { MindMapNode } from '@/types/artifacts';
import { ToolResultDisplay, ToolExecutionStatus } from './tool-result-display';
import { ThinkingIndicator, ToolExecutionProgress } from './thinking-indicator';

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
  const [copied, setCopied] = useState(false);
  
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
  
  // Handle copying message content
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayContent || message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

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

  // Check if message has tool execution data
  const hasToolExecution = message.metadata?.toolExecution;
  const hasToolResults = message.metadata?.toolResults;
  const hasToolStatus = message.metadata?.toolStatus;

  return (
    <div className={cn(
      'group relative w-full transition-all duration-200',
      isUser ? 'px-4 py-6 bg-background' : 'px-4 py-3'
    )}>
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4">
          {/* Avatar */}
          <div className={cn(
            'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm transition-all duration-200',
            isUser 
              ? 'bg-white border-slate-200 text-slate-700' 
              : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200'
          )}>
            {isUser ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-3">
              <span className={cn(
                'text-sm font-medium transition-colors',
                isUser ? 'text-slate-700' : 'text-slate-800'
              )}>
                {isUser ? 'You' : 'AI Learning Assistant'}
              </span>
              <span className="text-xs text-slate-500 font-normal">
                {isStreaming ? 'typing...' : message.timestamp.toLocaleTimeString()}
              </span>
              {hasMindmap && (
                <div className="flex items-center gap-1.5 text-xs">
                  <FileText className="h-3 w-3 text-blue-500" />
                  <span className="text-blue-600 font-medium">Mind Map</span>
                  {isCurrentMindmap && (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                </div>
              )}
            </div>

            {/* Message Text */}
            <div className={cn(
              'relative transition-all duration-200',
              isUser 
                ? 'rounded-2xl px-4 py-3 bg-blue-500 text-white shadow-sm' 
                : 'px-0 py-0 bg-transparent border-0 shadow-none'
            )}>
              <div className={cn(
                'text-sm leading-relaxed whitespace-pre-wrap break-words',
                isUser ? 'text-white user-message' : 'text-slate-800'
              )}>
                {displayContent}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse opacity-70" />
                )}
                {!isUser && !displayContent && !isStreaming && (
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                )}
              </div>
              
              {/* Copy Button - Only show on hover for non-user messages */}
              {!isUser && displayContent && (
                <button
                  onClick={handleCopy}
                  className={cn(
                    'absolute top-0 right-0 p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100',
                    'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800',
                    'hover:scale-105 active:scale-95'
                  )}
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              )}
            </div>

            {/* AI Thinking Process Indicator */}
            {!isUser && message.metadata?.thinking && (
              <ThinkingIndicator 
                thinking={message.metadata.thinking}
                className="mt-3"
              />
            )}

            {/* Tool Execution Progress */}
            {!isUser && message.metadata?.toolExecution && (
              <ToolExecutionProgress 
                toolExecution={message.metadata.toolExecution}
              />
            )}

            {/* Tool Execution Status */}
            {hasToolStatus && (
              <ToolExecutionStatus 
                status={hasToolStatus.status} 
                toolCount={hasToolStatus.toolCount} 
              />
            )}

            {/* Tool Execution Results */}
            {hasToolResults && Array.isArray(hasToolResults) && hasToolResults.map((toolResult: any, index: number) => (
              <ToolResultDisplay 
                key={`${toolResult.toolId || index}`}
                toolExecution={toolResult} 
              />
            ))}

            {/* Single Tool Execution Result */}
            {hasToolExecution && !hasToolResults && (
              <ToolResultDisplay toolExecution={hasToolExecution} />
            )}
            
            {/* Mindmap Preview - Only show if not currently streaming */}
            {hasMindmap && mindmapData && !isStreaming && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-slate-800">
                    {mindmapData.title || 'Untitled Mindmap'}
                  </h4>
                  <span className="text-xs text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full font-medium">
                    {mindmapData.children?.length || 0} topics
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                  {mindmapData.description || 'Learning path visualization'}
                </p>
                <button
                  onClick={handleLoadMindmap}
                  disabled={isLoadingMindmap}
                  className={cn(
                    "flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 transition-all duration-200 font-medium",
                    "hover:bg-blue-100 px-3 py-1.5 rounded-lg",
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
      </div>
    </div>
  );
}