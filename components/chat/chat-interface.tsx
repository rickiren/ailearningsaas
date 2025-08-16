'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';

import { useChatStore } from '@/lib/chat-store';
import { useArtifactStore } from '@/lib/artifact-store';
import { ConversationList } from './conversation-list';
import { JsonCodeBlock } from '../chat/json-code-block';
import { MindmapStore } from '@/lib/mindmap-store';

const EXAMPLE_PROMPTS = [
  "I want to create a learning path for JavaScript programming",
  "Help me design a course for digital marketing fundamentals",
  "Create a learning path for data science beginners",
  "I need to teach Python to complete beginners"
];

export function ChatInterface() {
  const { 
    messages, 
    clearMessages, 
    isLoading, 
    addMessage, 
    setLoading, 
    updateStreamingMessage, 
    finishStreamingMessage,
    streamingJson,
    currentConversationId,
    createNewConversation
  } = useChatStore();
  
  const { addArtifact, updateArtifact, setCurrentArtifact } = useArtifactStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [savedMindmaps, setSavedMindmaps] = useState<any[]>([]);
  const [showSavedMindmaps, setShowSavedMindmaps] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load saved mindmaps from database
  const loadSavedMindmaps = async () => {
    try {
      const projects = await MindmapStore.getUserMindmaps();
      setSavedMindmaps(projects);
    } catch (error) {
      console.error('Failed to load saved mindmaps:', error);
    }
  };

  // Handle artifact creation when streaming JSON is detected
  useEffect(() => {
    if (streamingJson && streamingJson.type === 'mindmap') {
      console.log('🎯 Chat interface detected streaming mindmap:', streamingJson);
      
      // Don't create artifacts here - let the chat input handle it
      // This prevents duplication since the chat input already creates artifacts
      // during the streaming process
    }
  }, [streamingJson]);

  // Handle loading a saved mindmap
  const handleLoadSavedMindmap = async (project: any) => {
    try {
      const mindmapData = await MindmapStore.loadMindmap(project.id);
      
      if (mindmapData) {
        // Create a new artifact with the loaded data
        const artifactId = await addArtifact({
          type: 'mindmap',
          title: project.title,
          data: mindmapData,
          metadata: { projectId: project.id }
        });
        
        if (artifactId) {
          setCurrentArtifact(artifactId);
          setShowSavedMindmaps(false);
          console.log('✅ Loaded saved mindmap:', project.id);
        }
      }
    } catch (error) {
      console.error('Failed to load saved mindmap:', error);
    }
  };

  const handleExampleClick = async (prompt: string) => {
    if (isLoading) return;
    
    // Add user message immediately
    addMessage({
      content: prompt,
      role: 'user',
    });

    setLoading(true);

    // Add empty assistant message for streaming
    const assistantMessageId = addMessage({
      content: '',
      role: 'assistant',
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: prompt,
          conversation_id: currentConversationId 
        }),
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

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let currentArtifactId = null;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              finishStreamingMessage(assistantMessageId);
              if (currentArtifactId) {
                updateArtifact(currentArtifactId, { isStreaming: false });
              }
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              
              if (parsed.content) {
                accumulatedContent += parsed.content;
                updateStreamingMessage(assistantMessageId, accumulatedContent);
              }

              // Handle artifact data
              if (parsed.artifact) {
                if (!currentArtifactId) {
                  // Create new artifact
                  currentArtifactId = await addArtifact({
                    type: parsed.artifact.type,
                    title: parsed.artifact.title,
                    data: parsed.artifact.data,
                    isStreaming: true,
                  });
                } else {
                  // Update existing artifact
                  updateArtifact(currentArtifactId, {
                    data: parsed.artifact.data,
                    isStreaming: true,
                  });
                }
              }
            } catch (parseError) {
              continue;
            }
          }
        }
      }

      finishStreamingMessage(assistantMessageId);

    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      updateStreamingMessage(assistantMessageId, `Sorry, I encountered an error: ${errorMessage}`);
      finishStreamingMessage(assistantMessageId);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Conversation Sidebar */}
      <div className="w-80 border-r bg-muted/10">
        <ConversationList />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">AI Learning Path Creator</h1>
              <p className="text-sm text-muted-foreground">
                Get help creating comprehensive learning paths for any skill
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (showSavedMindmaps) {
                    setShowSavedMindmaps(false);
                  } else {
                    loadSavedMindmaps();
                    setShowSavedMindmaps(true);
                  }
                }}
                className="gap-2"
              >
                <Map className="h-4 w-4" />
                {showSavedMindmaps ? 'Hide Saved' : 'View Saved Mindmaps'}
              </Button>
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearMessages}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Chat
                </Button>
              )}
            </div>
          </div>

          {/* Saved Mindmaps Dropdown */}
          {showSavedMindmaps && (
            <div className="mt-3 p-3 bg-muted/20 border rounded-lg">
              <h3 className="text-sm font-semibold mb-2">Saved Learning Paths</h3>
              {savedMindmaps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved mindmaps found.</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {savedMindmaps.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-2 bg-background rounded border hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleLoadSavedMindmap(project)}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{project.title}</h4>
                        {project.description && (
                          <p className="text-xs text-muted-foreground truncate">{project.description}</p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground ml-2">
                        {project.metadata?.totalNodes || 0} topics
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-4">
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Welcome to AI Learning Path Creator</h2>
                <p className="text-muted-foreground max-w-md">
                  Describe the skill or topic you want to teach, and I'll help you create a comprehensive learning path with modules, exercises, and resources.
                </p>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Try these examples:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXAMPLE_PROMPTS.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="text-left justify-start h-auto py-3 px-4 whitespace-normal"
                      onClick={() => handleExampleClick(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
                        ))}
            
            {/* Streaming JSON Display */}
            {streamingJson && (
              <div className="px-3 py-4">
                <JsonCodeBlock 
                  data={streamingJson.data}
                  title={`Learning Path: ${streamingJson.title}`}
                  isStreaming={!streamingJson.isComplete}
                />
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

        {/* Input */}
        <ChatInput />
      </div>
    </div>
  );
}