import { Message } from '@/types/chat';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/lib/chat-store';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const { isLoading, streamingMessageId } = useChatStore();
  const isStreaming = isLoading && message.id === streamingMessageId;
  
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
      </div>
    </div>
  );
}