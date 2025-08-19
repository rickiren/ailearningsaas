'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, Map, Sparkles, Plus, FileText, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { ArtifactViewer } from '@/components/artifacts/artifact-viewer';

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
    updateMessageMetadata,
    streamingJson,
    currentConversationId,
    createNewConversation,
    refreshConversations,
    addStreamingToolResult,
    setStreamingToolStatus,
    clearStreamingToolData
  } = useChatStore();
  
  const { createArtifact, updateArtifact, setCurrentArtifact } = useArtifactStore();
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
      // Check if an artifact with this title already exists
      const existingArtifact = useArtifactStore.getState().hasArtifact(project.title, project.id);
      
      if (existingArtifact) {
        // If we have an existing artifact, set it as current instead of creating a duplicate
        console.log('✅ Found existing artifact, setting as current');
        // Since hasArtifact returns true, we know it exists, but we need to get it by title
        // For now, just create a new one to avoid complexity
        console.log('⚠️ Existing artifact found, but getting by title not implemented yet');
        setShowSavedMindmaps(false);
        return;
      }
      
      const mindmapData = await MindmapStore.loadMindmap(project.id);
      
      if (mindmapData) {
        // Create a new artifact with the loaded data
        const artifactId = await createArtifact({
          type: 'mindmap',
          title: project.title,
          content: JSON.stringify(mindmapData),
          rawData: mindmapData
        });
        
        if (artifactId) {
          // Get the artifact object and set it as current
          const artifact = await useArtifactStore.getState().getArtifactById(artifactId);
          if (artifact) {
            setCurrentArtifact(artifact);
          }
          console.log('✅ Loaded mindmap from database:', project.id);
        }
      }
    } catch (error) {
      console.error('Failed to load saved mindmap:', error);
    }
  };

  const handleExampleClick = async (prompt: string) => {
    if (isLoading) return;
    
    // Check if we have a conversation selected
    if (!currentConversationId) {
      // Create a new conversation for the example
      try {
        const newConversationId = await createNewConversation();
        if (!newConversationId) {
          console.error('Failed to create new conversation for example');
          return;
        }
      } catch (error) {
        console.error('Failed to create new conversation for example:', error);
        return;
      }
    }
    
    // Add user message immediately
    const userMessageId = addMessage({
      content: prompt,
      role: 'user',
    });

    if (!userMessageId) {
      console.error('Failed to add user message');
      return;
    }

    setLoading(true);

    // Add empty assistant message for streaming
    const assistantMessageId = addMessage({
      content: '',
      role: 'assistant',
    });

    if (!assistantMessageId) {
      console.error('Failed to add assistant message');
      setLoading(false);
      return;
    }

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
      let toolResults: any[] = [];
      let toolStatus: any = null;

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
                // Mark artifact as no longer streaming
                console.log('✅ Artifact streaming completed');
              }
              
              // Add tool results to the message metadata
              if (toolResults.length > 0 || toolStatus) {
                updateMessageMetadata(assistantMessageId, {
                  toolResults: toolResults.length > 0 ? toolResults : undefined,
                  toolStatus: toolStatus || undefined,
                });
              }
              
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              
              // Handle conversation_id if returned (for new conversations)
              if (parsed.conversation_id && !currentConversationId) {
                // Update the current conversation ID and refresh conversations list
                await refreshConversations(parsed.conversation_id);
              }
              
              if (parsed.content) {
                accumulatedContent += parsed.content;
                updateStreamingMessage(assistantMessageId, accumulatedContent);
              }

              // Handle tool execution status
              if (parsed.toolExecution?.status) {
                toolStatus = parsed.toolExecution;
                setStreamingToolStatus(toolStatus);
              }

              // Handle tool execution results
              if (parsed.toolExecution?.toolId) {
                toolResults.push(parsed.toolExecution);
                addStreamingToolResult(parsed.toolExecution);
              }

              // Handle artifact data
              if (parsed.artifact) {
                if (!currentArtifactId) {
                  // Create new artifact
                  currentArtifactId = await createArtifact({
                    type: parsed.artifact.type,
                    title: parsed.artifact.title,
                    content: JSON.stringify(parsed.artifact.data),
                    rawData: parsed.artifact.data
                  });
                } else {
                  // Update existing artifact
                  updateArtifact(currentArtifactId, {
                    content: JSON.stringify(parsed.artifact.data),
                    rawData: parsed.artifact.data
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
    <div className="flex h-screen bg-slate-50">
      {/* Conversation Sidebar */}
      <div className="w-80 border-r border-slate-200 bg-white/80 backdrop-blur-sm">
        <ConversationList />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white/95 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-slate-900">AI Learning Path Creator</h1>
                <p className="text-sm text-slate-600">
                  Get help creating comprehensive learning paths for any skill
                </p>
              </div>
              <div className="flex items-center gap-3">
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
                  className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
                >
                  <Map className="h-4 w-4" />
                  {showSavedMindmaps ? 'Hide Saved' : 'View Saved Mindmaps'}
                </Button>
                {messages.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearMessages}
                    className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Chat
                  </Button>
                )}
              </div>
            </div>

            {/* Saved Mindmaps Dropdown */}
            {showSavedMindmaps && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <h3 className="text-sm font-semibold mb-3 text-slate-800">Saved Learning Paths</h3>
                {savedMindmaps.length === 0 ? (
                  <p className="text-sm text-slate-600">No saved mindmaps found.</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {savedMindmaps.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:bg-blue-50 cursor-pointer transition-all duration-200 hover:shadow-sm"
                        onClick={() => handleLoadSavedMindmap(project)}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate text-slate-800">{project.title}</h4>
                          {project.description && (
                            <p className="text-xs text-slate-600 truncate">{project.description}</p>
                          )}
                        </div>
                        <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium ml-2">
                          {project.metadata?.totalNodes || 0} topics
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-6">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Welcome to AI Learning Path Creator</h2>
                <p className="text-slate-600 max-w-lg text-lg leading-relaxed">
                  {currentConversationId 
                    ? "Describe the skill or topic you want to teach, and I'll help you create a comprehensive learning path with modules, exercises, and resources."
                    : "Click 'New Chat' in the sidebar to start creating your learning path. I'll help you design comprehensive curricula with modules, exercises, and resources."
                  }
                </p>
              </div>
              
              {currentConversationId && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-700">Try these examples:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {EXAMPLE_PROMPTS.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="text-left justify-start h-auto py-4 px-5 whitespace-normal border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all duration-200 rounded-xl"
                        onClick={() => handleExampleClick(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {!currentConversationId && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-700">Get started:</p>
                  <Button
                    onClick={createNewConversation}
                    className="h-12 px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl font-medium"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Start New Chat
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
                        ))}
            
            {/* Streaming JSON Display */}
            {streamingJson && (
              <div className="px-4 py-6">
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