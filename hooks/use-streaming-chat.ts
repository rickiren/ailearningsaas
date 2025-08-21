'use client';

import { useState, useRef, useCallback } from 'react';
import { useChatStore } from '@/lib/chat-store';
import { useArtifactStore } from '@/lib/artifact-store';

export interface StreamingState {
  isStreaming: boolean;
  streamingText: string;
  error: string | null;
  progress: number;
  stage: string;
}

export interface StreamingCallbacks {
  onStreamStart?: () => void;
  onStreamChunk?: (chunk: string, fullText: string) => void;
  onStreamComplete?: (fullText: string) => void;
  onStreamError?: (error: string) => void;
  onArtifactCreate?: (artifact: any) => void;
  onArtifactUpdate?: (artifactId: string, data: any) => void;
}

export function useStreamingChat() {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    streamingText: '',
    error: null,
    progress: 0,
    stage: 'idle'
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  const { 
    addMessage, 
    setLoading, 
    updateStreamingMessage, 
    finishStreamingMessage,
    currentConversationId,
    refreshConversations,
    addStreamingToolResult,
    setStreamingToolStatus,
    clearStreamingToolData
  } = useChatStore();

  const { createArtifact, updateArtifact, setCurrentArtifact } = useArtifactStore();

  const resetStreamingState = useCallback(() => {
    setStreamingState({
      isStreaming: false,
      streamingText: '',
      error: null,
      progress: 0,
      stage: 'idle'
    });
  }, []);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (readerRef.current) {
      readerRef.current.cancel();
    }
    resetStreamingState();
  }, [resetStreamingState]);

  const sendStreamingMessage = useCallback(async (
    message: string,
    callbacks: StreamingCallbacks = {}
  ) => {
    if (!message.trim() || streamingState.isStreaming) return null;

    if (!currentConversationId) {
      throw new Error('No conversation selected. Please start a new chat first.');
    }

    // Reset state and setup abort controller
    resetStreamingState();
    abortControllerRef.current = new AbortController();
    clearStreamingToolData();

    // Add user message immediately
    const userMessageId = addMessage({
      content: message,
      role: 'user',
    });

    if (!userMessageId) {
      throw new Error('Failed to add user message');
    }

    // Add empty assistant message for streaming
    const assistantMessageId = addMessage({
      content: '',
      role: 'assistant',
    });

    if (!assistantMessageId) {
      throw new Error('Failed to add assistant message');
    }

    setLoading(true);
    setStreamingState(prev => ({ 
      ...prev, 
      isStreaming: true, 
      stage: 'connecting',
      progress: 10
    }));

    callbacks.onStreamStart?.();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          conversation_id: currentConversationId 
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      readerRef.current = reader;
      setStreamingState(prev => ({ 
        ...prev, 
        stage: 'streaming',
        progress: 20
      }));

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let currentArtifactId: string | null = null;
      let toolResults: any[] = [];
      let toolStatus: any = null;
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              // Stream completed
              setStreamingState(prev => ({ 
                ...prev, 
                isStreaming: false, 
                stage: 'complete',
                progress: 100
              }));
              
              finishStreamingMessage(assistantMessageId);
              setLoading(false);
              
              if (currentArtifactId) {
                console.log('✅ Artifact streaming completed');
              }
              
              // Add tool results to the message metadata
              if (toolResults.length > 0 || toolStatus) {
                const { updateMessageMetadata } = useChatStore.getState();
                updateMessageMetadata(assistantMessageId, {
                  toolResults: toolResults.length > 0 ? toolResults : undefined,
                  toolStatus: toolStatus || undefined,
                });
              }
              
              callbacks.onStreamComplete?.(accumulatedContent);
              setTimeout(resetStreamingState, 1000);
              return { messageId: assistantMessageId, content: accumulatedContent };
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              
              // Handle conversation_id if returned
              if (parsed.conversation_id && !currentConversationId) {
                await refreshConversations(parsed.conversation_id);
              }
              
              // Handle streaming content
              if (parsed.content) {
                chunkCount++;
                accumulatedContent += parsed.content;
                
                // Update streaming state
                setStreamingState(prev => ({ 
                  ...prev, 
                  streamingText: accumulatedContent,
                  progress: Math.min(90, 20 + (chunkCount * 2))
                }));
                
                // Update the message in real-time
                updateStreamingMessage(assistantMessageId, accumulatedContent);
                
                callbacks.onStreamChunk?.(parsed.content, accumulatedContent);
              }

              // Handle tool execution status
              if (parsed.toolExecution?.status) {
                toolStatus = parsed.toolExecution;
                setStreamingToolStatus(toolStatus);
                
                setStreamingState(prev => ({ 
                  ...prev, 
                  stage: `tool-${parsed.toolExecution.status}`,
                  progress: parsed.toolExecution.status === 'executing' ? 70 : 
                           parsed.toolExecution.status === 'completed' ? 85 : prev.progress
                }));
              }

              // Handle tool execution results
              if (parsed.toolExecution?.toolId) {
                toolResults.push(parsed.toolExecution);
                addStreamingToolResult(parsed.toolExecution);
              }

              // Handle artifact data with streaming feedback
              if (parsed.artifact) {
                if (!currentArtifactId) {
                  // Create new artifact
                  currentArtifactId = await createArtifact({
                    type: parsed.artifact.type,
                    title: parsed.artifact.title,
                    content: JSON.stringify(parsed.artifact.data),
                    rawData: parsed.artifact.data
                  });
                  
                  if (currentArtifactId) {
                    setCurrentArtifact(currentArtifactId);
                    callbacks.onArtifactCreate?.(parsed.artifact);
                  }
                } else {
                  // Update existing artifact
                  updateArtifact(currentArtifactId, {
                    content: JSON.stringify(parsed.artifact.data),
                    rawData: parsed.artifact.data
                  });
                  
                  callbacks.onArtifactUpdate?.(currentArtifactId, parsed.artifact.data);
                }
              }
            } catch (parseError) {
              // Skip malformed JSON lines
              continue;
            }
          }
        }
      }

    } catch (error) {
      console.error('Streaming error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      setStreamingState(prev => ({ 
        ...prev, 
        isStreaming: false, 
        error: errorMessage,
        stage: 'error'
      }));
      
      // Update the assistant message with error
      updateStreamingMessage(assistantMessageId, `Sorry, I encountered an error: ${errorMessage}`);
      finishStreamingMessage(assistantMessageId);
      setLoading(false);
      
      callbacks.onStreamError?.(errorMessage);
      
      // Add error metadata to message
      const { updateMessageMetadata } = useChatStore.getState();
      updateMessageMetadata(assistantMessageId, {
        streamingError: errorMessage
      });
      
      setTimeout(resetStreamingState, 2000);
      throw error;
    }
  }, [
    streamingState.isStreaming,
    currentConversationId,
    addMessage,
    setLoading,
    updateStreamingMessage,
    finishStreamingMessage,
    refreshConversations,
    addStreamingToolResult,
    setStreamingToolStatus,
    clearStreamingToolData,
    createArtifact,
    updateArtifact,
    setCurrentArtifact,
    resetStreamingState
  ]);

  return {
    streamingState,
    sendStreamingMessage,
    abortStream,
    resetStreamingState,
    isStreaming: streamingState.isStreaming
  };
}