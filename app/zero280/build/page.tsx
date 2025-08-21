'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Send, Plus, Edit, MessageSquare, Eye, GraduationCap, Database, ArrowUpRight, Code } from 'lucide-react';
import { ToolExecutionProgress } from '@/components/chat/tool-execution-progress';
import { ProgressSummary } from '@/components/chat/progress-summary';
import { CodeStreamingPreview } from '@/components/chat/code-streaming-preview';
import { Zero280ArtifactRenderer } from '@/components/artifacts/zero280-artifact-renderer';
import { ConversationManager } from '@/components/chat/conversation-manager';
import { useProgressTracker, progressHelpers } from '@/lib/progress-tracker';

interface Artifact {
  id?: string;
  name: string;
  type: string;
  content: string;
  description: string;
  preview: string;
}

interface ToolResult {
  toolId: string;
  name: string;
  input: any;
  result: any;
}

// Removed workflow interface as it's no longer needed

export default function Zero280BuildPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatWidth, setChatWidth] = useState(320); // Default chat width
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview'); // New state for view mode
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentArtifacts, setCurrentArtifacts] = useState<Artifact[]>([]);
  const [chatHistory, setChatHistory] = useState<Array<{
    type: 'user' | 'ai';
    message: string;
    status?: string;
    timestamp: string;
    id: string;
    artifacts?: Artifact[];
    toolResults?: ToolResult[];
  }>>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Code streaming state
  const [isStreamingCode, setIsStreamingCode] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [streamingArtifact, setStreamingArtifact] = useState<{
    name: string;
    type: string;
    content: string;
  } | null>(null);
  
  // Progress tracking
  const { 
    isThinking, 
    thinkingMessage, 
    isActive, 
    executions,
    startThinking,
    stopThinking,
    startMessageExecution,
    completeMessageExecution
  } = useProgressTracker();
  
  // Immediate visual response state
  const [currentStep, setCurrentStep] = useState<'idle' | 'analyzing' | 'building' | 'complete'>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Function to expand relevant containers for immediate visual feedback
  const expandRelevantContainers = () => {
    setIsExpanded(true);
    // Scroll to show the progress area
    scrollToBottom();
  };

  // Function to scroll chat to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      const progressArea = document.querySelector('.chat-sidebar');
      if (progressArea) {
        progressArea.scrollTo({
          top: progressArea.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100); // Slight delay to ensure content is rendered
  };

  // Function to reset step indicator after completion
  const resetStepIndicator = () => {
    setTimeout(() => {
      setCurrentStep('idle');
      setIsExpanded(false);
    }, 3000); // Reset after 3 seconds
  };

  useEffect(() => {
    const message = searchParams.get('message');
    const conversationId = searchParams.get('conversationId');
    const artifactId = searchParams.get('artifactId');
    
    if (hasInitialized) {
      return; // Prevent re-initialization on refresh
    }
    
    if (artifactId) {
      // Load artifact and its associated conversation
      loadArtifactAndConversation(artifactId);
      setHasInitialized(true);
    } else if (conversationId) {
      // We have an existing conversation, load it instead of creating new
      setCurrentConversationId(conversationId);
      loadExistingConversation(conversationId);
      setHasInitialized(true);
    } else if (message && !currentConversationId) {
      // Only create new conversation if we don't have one and have a message
      // Set hasInitialized immediately to prevent duplicate processing
      setHasInitialized(true);
      
      // Automatically send the initial message to AI - it will handle adding the user message
      handleInitialMessage(message);
    }
  }, [searchParams, hasInitialized, currentConversationId]); // Add currentConversationId dependency

  // Debug effect for artifacts
  useEffect(() => {
    console.log('Current artifacts changed:', currentArtifacts);
  }, [currentArtifacts]);

  // Auto-scroll when chat history updates
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Auto-scroll when current step changes (thinking indicators)
  useEffect(() => {
    if (currentStep !== 'idle') {
      scrollToBottom();
    }
  }, [currentStep]);

  // Auto-scroll when streaming content updates
  useEffect(() => {
    if (isStreamingCode && streamedContent) {
      scrollToBottom();
    }
  }, [isStreamingCode, streamedContent]);

  const loadExistingConversation = async (conversationId: string) => {
    try {
      // Load conversation data from the database
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Load messages
        const messagesResponse = await fetch(`/api/conversations/${conversationId}/messages`);
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          const formattedMessages = messagesData.messages.map((msg: any) => ({
            type: msg.role === 'user' ? 'user' : 'ai',
            message: msg.content,
            timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }) + ' on ' + new Date(msg.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            }),
            id: msg.id
          }));
          setChatHistory(formattedMessages);
        }
        
        // Load artifacts
        const artifactsResponse = await fetch(`/api/artifacts?conversationId=${conversationId}`);
        if (artifactsResponse.ok) {
          const artifactsData = await artifactsResponse.json();
          // Transform artifacts to match the expected structure
          const transformedArtifacts = (artifactsData.artifacts || []).map((artifact: any) => ({
            id: artifact.id,
            name: artifact.metadata?.title || artifact.name || 'Untitled',
            type: artifact.metadata?.type || artifact.type || 'unknown',
            content: artifact.data || artifact.content || '',
            description: artifact.metadata?.description || artifact.description || '',
            preview: artifact.metadata?.preview || artifact.preview || '',
            metadata: artifact.metadata,
            data: artifact.data
          }));
          setCurrentArtifacts(transformedArtifacts);
        }
        
        console.log('Loaded existing conversation:', conversationId);
      }
    } catch (error) {
      console.error('Error loading existing conversation:', error);
    }
  };

  const loadArtifactAndConversation = async (artifactId: string) => {
    try {
      // Load the artifact first
      const artifactResponse = await fetch(`/api/artifacts/${artifactId}`);
      if (artifactResponse.ok) {
        const data = await artifactResponse.json();
        const artifact = data.artifact;
        
        // Transform and set the current artifacts to include this one
        const transformedArtifact = {
          id: artifact.id,
          name: artifact.metadata?.title || artifact.name || 'Untitled',
          type: artifact.metadata?.type || artifact.type || 'unknown',
          content: artifact.data || artifact.content || '',
          description: artifact.metadata?.description || artifact.description || '',
          preview: artifact.metadata?.preview || artifact.preview || '',
          metadata: artifact.metadata,
          data: artifact.data
        };
        setCurrentArtifacts([transformedArtifact]);
        
        // Try to find the associated conversation through the artifact's conversation_id field
        if (artifact.conversation_id) {
          setCurrentConversationId(artifact.conversation_id);
          await loadExistingConversation(artifact.conversation_id);
        } else if (artifact.metadata?.conversationId) {
          // Fallback to metadata if conversation_id is not directly available
          setCurrentConversationId(artifact.metadata.conversationId);
          await loadExistingConversation(artifact.metadata.conversationId);
        } else {
          // If no conversation ID found, try to find by project ID
          if (artifact.metadata?.projectId) {
            const conversationsResponse = await fetch(`/api/conversations?projectId=${artifact.metadata.projectId}`);
            if (conversationsResponse.ok) {
              const conversations = await conversationsResponse.json();
              if (conversations.length > 0) {
                const conversation = conversations[0]; // Take the first one
                setCurrentConversationId(conversation.id);
                await loadExistingConversation(conversation.id);
              }
            }
          }
        }
        
        console.log('Loaded artifact and conversation:', artifactId);
        console.log('Artifact data:', artifact);
        console.log('Conversation ID found:', artifact.conversation_id || artifact.metadata?.conversationId);
        setHasInitialized(true);
      } else {
        console.error('Failed to load artifact:', artifactResponse.status, artifactResponse.statusText);
        const errorText = await artifactResponse.text();
        console.error('Error response:', errorText);
        setHasInitialized(true);
      }
    } catch (error) {
      console.error('Error loading artifact and conversation:', error);
      setHasInitialized(true);
    }
  };

  const handleInitialMessage = async (message: string) => {
    // Don't send initial message if we already have a conversation
    if (currentConversationId) {
      console.log('Conversation already exists, skipping initial message');
      return;
    }
    
    // IMMEDIATE (0ms delay) - Show instant feedback
    setIsLoading(true);
    setCurrentStep('analyzing');
    expandRelevantContainers();
    
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }) + ' on ' + new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    // Add user message first
    const userMessage = {
      type: 'user' as const,
      message: message,
      timestamp: timestamp,
      id: `msg_${Date.now()}_user`
    };
    
    // Start progress tracking
    const messageId = `msg_${Date.now()}_ai`;
    startMessageExecution(messageId);
    startThinking(messageId, "Analyzing your request...");
    
    // Add AI thinking message
    const newAIMessage = {
      type: 'ai' as const,
      message: 'Thinking...',
      status: 'Processing',
      timestamp: timestamp,
      id: messageId
    };

    setChatHistory([userMessage, newAIMessage]);

    try {
      const response = await fetch('/api/zero280', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          userId: undefined, // You can add user authentication later
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log('Response data received (initial):', data);
        console.log('Artifacts received (initial):', data.artifacts);
        
        // Store conversation ID for future requests
        if (data.conversationId) {
          setCurrentConversationId(data.conversationId);
          console.log('Conversation ID set:', data.conversationId);
          
          // Update URL to include conversation ID for refresh persistence
          const newUrl = `/zero280/build?conversationId=${data.conversationId}`;
          window.history.replaceState({}, '', newUrl);
        }
        
        // Don't update artifacts immediately - wait for streaming to complete
        if (data.artifacts && data.artifacts.length > 0) {
          console.log('Preparing to stream artifacts (initial):', data.artifacts);
        } else {
          console.log('No artifacts in response (initial)');
        }
        
        // Update the AI message with the actual response
        setChatHistory(prev => prev.map((msg, index) => 
          index === prev.length - 1 && msg.type === 'ai' 
            ? { 
                ...msg, 
                message: data.response, 
                status: undefined,
                artifacts: data.artifacts,
                toolResults: data.toolResults

              }
            : msg
        ));
        
        // Handle streaming for new artifacts (initial creation only)
        if (data.artifacts && data.artifacts.length > 0) {
          // This is initial artifact creation
          console.log('Streaming initial artifact');
          stopThinking(); // Stop thinking as soon as we start streaming
          setCurrentStep('building'); // Transition to building step
          
          const artifact = data.artifacts[0];
          setStreamingArtifact(artifact);
          setIsStreamingCode(true);
          setStreamedContent('');
          
          // Simulate code streaming
          const content = artifact.content;
          const lines = content.split('\n');
          let currentLine = 0;
          
          const streamInterval = setInterval(() => {
            if (currentLine < lines.length) {
              setStreamedContent(prev => prev + lines[currentLine] + '\n');
              currentLine++;
            } else {
              clearInterval(streamInterval);
              setIsStreamingCode(false);
              
              // Now update the artifacts with the final code - only after streaming is complete
              const transformedArtifacts = data.artifacts.map((artifact: any) => {
                console.log('Transforming artifact:', artifact);
                const transformed = {
                  id: artifact.id,
                  name: artifact.name || artifact.metadata?.title || 'Untitled',
                  type: artifact.type || artifact.metadata?.type || 'unknown', 
                  content: artifact.content || artifact.data || '',
                  description: artifact.description || artifact.metadata?.description || '',
                  preview: artifact.preview || artifact.metadata?.preview || '',
                  metadata: artifact.metadata,
                  data: artifact.data
                };
                console.log('Transformed artifact:', transformed);
                return transformed;
              });
              setCurrentArtifacts(transformedArtifacts);
              
              setCurrentStep('complete'); // Transition to complete step
              resetStepIndicator(); // Reset after 3 seconds
              completeMessageExecution();
            }
          }, 50); // Faster streaming for better effect
        } else {
          // Complete progress tracking
          stopThinking();
          completeMessageExecution();
        }
      } else {
        // Handle error response
        const errorData = await response.json();
        setChatHistory(prev => prev.map((msg, index) => 
          index === prev.length - 1 && msg.type === 'ai' 
            ? { ...msg, message: `Error: ${errorData.error || 'Failed to get response'}`, status: undefined }
            : msg
        ));
        
        // Complete progress tracking with error
        stopThinking();
        completeMessageExecution();
      }
    } catch (error) {
      console.error('Error:', error);
      // Update AI message with error
      setChatHistory(prev => prev.map((msg, index) => 
        index === prev.length - 1 && msg.type === 'ai' 
          ? { ...msg, message: 'Sorry, I encountered an error. Please try again.', status: undefined }
          : msg
      ));
      
      // Complete progress tracking with error
      stopThinking();
      completeMessageExecution();
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const newWidth = e.clientX;
    
    // Set minimum and maximum widths with better constraints
    const minWidth = 280;
    const maxWidth = window.innerWidth - 400;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setChatWidth(newWidth);
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (isDragging) {
      setIsDragging(false);
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (isDragging) {
      // Use capture: true to ensure events are handled properly
      document.addEventListener('mousemove', handleMouseMove, { capture: true });
      document.addEventListener('mouseup', handleMouseUp, { capture: true });
      document.addEventListener('mouseleave', handleMouseUp, { capture: true });
      
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      // Remove the pointerEvents = 'none' as it prevents dragging
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove, { capture: true });
        document.removeEventListener('mouseup', handleMouseUp, { capture: true });
        document.removeEventListener('mouseleave', handleMouseUp, { capture: true });
        
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isModalOpen && !(event.target as Element).closest('.relative')) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Don't allow sending messages if we don't have a conversation
    if (!currentConversationId) {
      console.error('No active conversation to send message to');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    
    // IMMEDIATE (0ms delay) - Show instant feedback
    setIsLoading(true);
    setCurrentStep('analyzing');
    expandRelevantContainers();
    
    // Start progress tracking immediately
    const messageId = `msg_${Date.now()}_ai`;
    startMessageExecution(messageId);
    startThinking(messageId, "Analyzing your request...");

    // Add user message to chat immediately
    const newUserMessage = {
      type: 'user' as const,
      message: userMessage,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }) + ' on ' + new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      id: `msg_${Date.now()}_user`
    };

    // Add AI thinking message immediately
    const newAIMessage = {
      type: 'ai' as const,
      message: 'Thinking...',
      status: 'Processing',
      timestamp: newUserMessage.timestamp,
      id: messageId
    };

    setChatHistory(prev => [...prev, newUserMessage, newAIMessage]);

    // THEN make AI call
    try {
      // If we have an existing artifact, use the edit endpoint
      // If not, use the create endpoint
      const endpoint = currentArtifacts.length > 0 ? '/api/zero280/edit' : '/api/zero280';
      const requestBody = currentArtifacts.length > 0 ? {
        message: userMessage,
        conversationId: currentConversationId,
        artifactId: currentArtifacts[0].name || 'current-artifact',
        currentCode: currentArtifacts[0].content || '',
        userId: undefined,
      } : {
        message: userMessage,
        conversationId: currentConversationId,
        userId: undefined,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log('Response data received (submit):', data);
        console.log('Artifacts received (submit):', data.artifacts);
        
        // Store conversation ID for future requests
        if (data.conversationId) {
          setCurrentConversationId(data.conversationId);
          console.log('Conversation ID set:', data.conversationId);
          
          // Update URL to include conversation ID for refresh persistence
          const newUrl = `/zero280/build?conversationId=${data.conversationId}`;
          window.history.replaceState({}, '', newUrl);
        }
        
        // Handle edit response - start streaming immediately without updating artifacts yet
        if (data.editedCode && currentArtifacts.length > 0) {
          console.log('Starting to stream edited code');
          console.log('Old content length:', currentArtifacts[0].content?.length || 0);
          console.log('New content length:', data.editedCode.length);
          
          // Don't update artifacts yet - wait for streaming to complete
          // Just prepare for streaming
        } else if (data.artifacts && data.artifacts.length > 0) {
          // This is a new artifact creation - don't update artifacts yet, wait for streaming
          console.log('Preparing to stream new artifacts (submit):', data.artifacts);
        } else {
          console.log('No artifacts or edits in response (submit)');
        }
        
        // Update the AI message with the actual response
        setChatHistory(prev => prev.map((msg, index) => 
          index === prev.length - 1 && msg.type === 'ai' 
            ? { 
                ...msg, 
                message: data.response, 
                status: undefined,
                artifacts: data.artifacts,
                toolResults: data.toolResults

              }
            : msg
        ));
        
        // Handle streaming for new artifacts or edits
        if (data.editedCode && currentArtifacts.length > 0) {
          // This is an edit - stop thinking and start streaming immediately
          console.log('Streaming edited code');
          stopThinking(); // Stop thinking as soon as we start streaming
          setCurrentStep('building'); // Transition to building step
          
          setStreamingArtifact({
            ...currentArtifacts[0],
            content: data.editedCode
          });
          setIsStreamingCode(true);
          setStreamedContent('');
          
          // Stream the edited code
          const content = data.editedCode;
          const lines = content.split('\n');
          let currentLine = 0;
          
          const streamInterval = setInterval(async () => {
            if (currentLine < lines.length) {
              setStreamedContent(prev => prev + lines[currentLine] + '\n');
              currentLine++;
            } else {
              clearInterval(streamInterval);
              setIsStreamingCode(false);
              
              // Now update the artifacts with the final code
              const updatedArtifacts = currentArtifacts.map(artifact => ({
                ...artifact,
                content: data.editedCode
              }));
              setCurrentArtifacts(updatedArtifacts);
              console.log('Artifacts updated after streaming:', updatedArtifacts[0].name);
              
              // Save the updated artifact to the database
              if (currentArtifacts[0].id) {
                try {
                  const updateResponse = await fetch(`/api/artifacts/${currentArtifacts[0].id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      content: data.editedCode,
                      updated_at: new Date().toISOString()
                    }),
                  });
                  
                  if (updateResponse.ok) {
                    console.log('Artifact saved to database successfully');
                  } else {
                    console.error('Failed to save artifact to database:', updateResponse.status);
                  }
                } catch (error) {
                  console.error('Error saving artifact to database:', error);
                }
              }
              
              setCurrentStep('complete'); // Transition to complete step
              resetStepIndicator(); // Reset after 3 seconds
              completeMessageExecution();
            }
          }, 50); // Faster streaming for edits
        } else if (data.artifacts && data.artifacts.length > 0) {
          // This is a new artifact creation (first time)
          console.log('Streaming new artifact');
          stopThinking(); // Stop thinking as soon as we start streaming
          setCurrentStep('building'); // Transition to building step
          
          const artifact = data.artifacts[0];
          setStreamingArtifact(artifact);
          setIsStreamingCode(true);
          setStreamedContent('');
          
          // Simulate code streaming
          const content = artifact.content;
          const lines = content.split('\n');
          let currentLine = 0;
          
          const streamInterval = setInterval(() => {
            if (currentLine < lines.length) {
              setStreamedContent(prev => prev + lines[currentLine] + '\n');
              currentLine++;
            } else {
              clearInterval(streamInterval);
              setIsStreamingCode(false);
              
              // Now update the artifacts with the final code - only after streaming is complete
              const transformedArtifacts = data.artifacts.map((artifact: any) => {
                console.log('Transforming new artifact:', artifact);
                const transformed = {
                  id: artifact.id,
                  name: artifact.name || artifact.metadata?.title || 'Untitled',
                  type: artifact.type || artifact.metadata?.type || 'unknown',
                  content: artifact.content || artifact.data || '',
                  description: artifact.description || artifact.metadata?.description || '',
                  preview: artifact.preview || artifact.metadata?.preview || '',
                  metadata: artifact.metadata,
                  data: artifact.data
                };
                console.log('Transformed new artifact:', transformed);
                return transformed;
              });
              setCurrentArtifacts(transformedArtifacts);
              
              setCurrentStep('complete'); // Transition to complete step
              resetStepIndicator(); // Reset after 3 seconds
              completeMessageExecution();
            }
          }, 50); // Faster streaming for better effect
        } else {
          // Complete progress tracking
          stopThinking();
          completeMessageExecution();
        }
      } else {
        // Handle error response
        const errorData = await response.json();
        setChatHistory(prev => prev.map((msg, index) => 
          index === prev.length - 1 && msg.type === 'ai' 
            ? { ...msg, message: `Error: ${errorData.error || 'Failed to get response'}`, status: undefined }
            : msg
        ));
        
        // Complete progress tracking with error
        stopThinking();
        completeMessageExecution();
      }
    } catch (error) {
      console.error('Error:', error);
      // Update AI message with error
      setChatHistory(prev => prev.map((msg, index) => 
        index === prev.length - 1 && msg.type === 'ai' 
          ? { ...msg, message: 'Sorry, I encountered an error. Please try again.', status: undefined }
          : msg
      ));
      
      // Complete progress tracking with error
      stopThinking();
      completeMessageExecution();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        
        .typewriter-text {
          overflow: hidden;
          white-space: nowrap;
          animation: typewriter 0.1s steps(1);
        }
      `}</style>
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center space-x-2">
              <span className="font-medium text-gray-900">
                {currentArtifacts.length > 0 ? currentArtifacts[0].name : 'No artifact selected'}
              </span>
              <button
                onClick={() => setIsModalOpen(!isModalOpen)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Panel */}
              {isModalOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      router.push('/zero280');
                      setIsModalOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span className="text-gray-700">Go to Dashboard</span>
                  </button>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {currentConversationId ? (
                <span className="text-blue-600">Conversation: {currentConversationId.substring(0, 8)}...</span>
              ) : (
                'Loading Live Preview...'
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('preview')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  viewMode === 'code'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>Code</span>
              </button>
            </div>
            
            <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Chat Interface */}
        <div 
          className="bg-gray-100 flex flex-col h-full"
          style={{ width: `${chatWidth}px` }}
          onWheel={(e) => e.stopPropagation()} // Prevent scroll bubbling
        >
          {/* Conversation Manager */}
          <div className="border-b border-gray-200">
            <ConversationManager
              currentConversationId={currentConversationId || undefined}
              userId={undefined} // You can add user authentication later
            />
          </div>



          {/* Chat History - Scrollable Area */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 chat-sidebar"
            onWheel={(e) => {
              // Prevent scroll bubbling to parent elements
              e.stopPropagation();
              
              // Check if we need to scroll and prevent page scroll if so
              const element = e.currentTarget;
              const atTop = element.scrollTop === 0;
              const atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
              
              // Only allow page scroll if we're at the boundaries and trying to scroll further
              if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
                // Allow normal page scroll
                return;
              } else {
                // Prevent page scroll, keep it within this element
                e.preventDefault();
              }
            }}
          >
            {chatHistory.map((chat, index) => (
              <div key={index} className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {chat.type === 'user' ? (
                  <div className="bg-gray-300 text-gray-800 px-4 py-2 rounded-2xl max-w-xs">
                    {chat.message}
                  </div>
                ) : (
                  <div className="bg-white px-4 py-3 rounded-2xl max-w-xs shadow-sm">
                    <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {chat.message}
                    </div>
                    {chat.status && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span>{chat.status}</span>
                        {chat.status === 'Processing' && (
                          <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">{chat.timestamp}</span>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {/* Step Indicator in Chat Flow - Shows current progress after messages */}
            {currentStep !== 'idle' && (
              <div className="flex justify-start">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl px-4 py-3 max-w-xs">
                  <div className="flex items-center space-x-3">
                    {currentStep === 'analyzing' && (
                      <>
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-blue-700">Analyzing your request...</span>
                      </>
                    )}
                    {currentStep === 'building' && (
                      <>
                        <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-orange-700">Building your artifact...</span>
                      </>
                    )}
                    {currentStep === 'complete' && (
                      <>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700">Complete!</span>
                      </>
                    )}
                    {currentStep === 'analyzing' && (
                      <div className="flex space-x-1 ml-2">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Progress Indicators - Only show when not actively thinking via AI message */}
            {isActive && executions.length > 0 && !isThinking && (
              <ToolExecutionProgress 
                executions={executions}
                isActive={isActive}
                className="mb-4"
              />
            )}
            
            {!isActive && executions.length > 0 && (
              <ProgressSummary 
                executions={executions}
                className="mb-4"
              />
            )}
            
            {/* Code Streaming Preview - Show when streaming or when complete */}
            {streamingArtifact && (
              <div className="mb-4">
                <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-300 text-sm ml-2">{streamingArtifact.name}</span>
                    </div>
                    {isStreamingCode && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                        <span className="text-green-400 text-xs font-medium">Streaming...</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Code Editor Area - Fixed height with internal scroll */}
                  <div className="h-64 overflow-y-auto bg-gray-900" ref={(el) => {
                    if (el && isStreamingCode) {
                      el.scrollTop = el.scrollHeight;
                    }
                  }}>
                    <pre className="text-sm text-gray-100 p-4 font-mono leading-relaxed">
                      <code>
                        {streamedContent || '// Code will appear here...'}
                        {isStreamingCode && (
                          <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-1" style={{animation: 'blink 1s infinite'}}></span>
                        )}
                      </code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input - Fixed at Bottom */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-100 chat-input-container">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-4">
              {/* Text Input Area */}
              <div className="mb-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Ask me anything..."
                  className="w-full bg-transparent text-gray-800 text-lg placeholder-gray-400 focus:outline-none border-none resize-none"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                />
              </div>
              
              {/* Action Buttons Row */}
              <div className="flex items-center justify-between">
                {/* Left Side Buttons */}
                <div className="flex items-center space-x-3">
                  <button className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors border border-gray-200">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center space-x-2 text-sm text-gray-600 transition-colors border border-gray-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
                    </svg>
                    <span>Edit</span>
                  </button>
                </div>
                
                {/* Right Side Buttons */}
                <div className="flex items-center space-x-3">
                  <button className="px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center space-x-2 text-sm text-gray-600 transition-colors border border-gray-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Chat</span>
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !input.trim()}
                    className="w-8 h-8 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Draggable Splitter */}
        <div
          className={`w-1 flex items-center justify-center transition-all duration-200 ${
            isDragging ? 'bg-blue-500 w-2' : 'bg-gray-300 hover:bg-blue-400 hover:w-2'
          }`}
          onMouseDown={handleMouseDown}
          style={{ cursor: 'col-resize' }}
        >
          <div className={`rounded-full transition-all duration-200 ${
            isDragging ? 'w-1 h-12 bg-white' : 'w-0.5 h-8 bg-gray-400'
          }`}></div>
        </div>

        {/* Right Column - Preview/Code Generator */}
        <div 
          className="flex-1 bg-white flex flex-col"
          onWheel={(e) => e.stopPropagation()} // Prevent scroll bubbling
        >
          {viewMode === 'preview' ? (
            /* Preview Mode */
            currentArtifacts.length > 0 ? (
              /* Display Generated Artifacts */
              <div className="w-full h-full flex flex-col">
                {/* Only show the current working artifact - clean layout like Claude */}
                {currentArtifacts.length > 0 && (
                  <Zero280ArtifactRenderer 
                    key={`${currentArtifacts[0].name || 'current-artifact'}-${Date.now()}`}
                    artifact={currentArtifacts[0]} 
                    className="flex-1"
                  />
                )}
              </div>
            ) : (
              /* Default Preview State */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    fill="currentColor"
                  />
                </svg>
                <div className="text-xl text-gray-600 mb-8">Ready to build something amazing!</div>
                
                {/* Feature Suggestions */}
                <div className="space-y-4 text-left max-w-md">
                  <div className="flex items-center space-x-3 text-gray-400">
                    <Eye className="w-5 h-5" />
                    <span className="text-sm">Instantly preview your changes</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-400">
                    <GraduationCap className="w-5 h-5" />
                    <span className="text-sm">Set custom knowledge for every edit</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-400">
                    <Database className="w-5 h-5" />
                    <span className="text-sm">Connect Supabase for backend</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-400">
                    <div className="w-5 h-5 border border-gray-400 rounded flex items-center justify-center">
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                    <span className="text-sm">Collaborate at source, via GitHub</span>
                  </div>
                </div>
                </div>
              </div>
            )
          ) : (
            /* Code Mode */
            currentArtifacts.length > 0 ? (
              <div className="w-full h-full flex flex-col">
                <Zero280ArtifactRenderer 
                  key={`${currentArtifacts[0].name || 'current-artifact'}-${Date.now()}`}
                  artifact={currentArtifacts[0]} 
                  className="flex-1"
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-gray-900 rounded-lg p-8 max-w-md">
                  <div className="text-gray-400 text-sm font-mono space-y-2">
                    <div className="text-green-400">// No artifacts generated yet</div>
                    <div className="text-blue-400">// Try asking me to build something!</div>
                    <div className="text-gray-300">// Example: "build a login form"</div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

    </div>
  );
}
