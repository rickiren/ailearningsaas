import { Message } from '@/types/chat';
import { Bot, User, FileText, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/lib/chat-store';
import { parseMessageForJson, validateMindMapData } from '@/lib/utils';
import { useArtifactStore } from '@/lib/artifact-store';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const { isLoading, streamingMessageId } = useChatStore();
  const { currentArtifact } = useArtifactStore();
  const isStreaming = isLoading && message.id === streamingMessageId;
  
  // Check if this message contains mindmap JSON
  const mindmapData = !isUser && message.content ? parseMessageForJson(message.content) : null;
  const hasMindmap = mindmapData && mindmapData.type === 'mindmap' && validateMindMapData(mindmapData.data);
  
  // Check if this mindmap is currently displayed
  const isCurrentMindmap = currentArtifact?.type === 'mindmap' && 
    currentArtifact.data?.title === mindmapData?.data?.title;
  
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
          {message.content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-primary ml-1 animate-pulse" />
          )}
          {!isUser && !message.content && !isStreaming && (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          )}
        </div>
        
        {/* Mindmap Preview */}
        {hasMindmap && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-blue-900">
                {mindmapData.data.title}
              </h4>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                {mindmapData.data.children?.length || 0} topics
              </span>
            </div>
            <p className="text-xs text-blue-700 mb-2">
              {mindmapData.data.description || 'Learning path visualization'}
            </p>
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <span>Click to view full mind map →</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}