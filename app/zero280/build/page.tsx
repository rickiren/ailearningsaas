'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Plus, Edit, MessageSquare, Eye, GraduationCap, Database, ArrowUpRight, Code } from 'lucide-react';
import { ThinkingIndicator } from '@/components/chat/thinking-indicator';
import { ToolExecutionProgress } from '@/components/chat/tool-execution-progress';
import { ProgressSummary } from '@/components/chat/progress-summary';
import { Zero280ArtifactRenderer } from '@/components/artifacts/zero280-artifact-renderer';
import { useProgressTracker, progressHelpers } from '@/lib/progress-tracker';

interface Artifact {
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
  
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }) + ' on ' + new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      setChatHistory([
        {
          type: 'user',
          message: message,
          timestamp: timestamp,
          id: `msg_${Date.now()}_user`
        }
      ]);
      
      // Automatically send the initial message to AI
      handleInitialMessage(message);
    }
  }, [searchParams]);

  // Debug effect for artifacts
  useEffect(() => {
    console.log('Current artifacts changed:', currentArtifacts);
  }, [currentArtifacts]);

  const handleInitialMessage = async (message: string) => {
    setIsLoading(true);
    
    // Start progress tracking
    const messageId = `msg_${Date.now()}_ai`;
    startMessageExecution(messageId);
    startThinking(messageId, "Analyzing your request...");
    
    // Add AI thinking message
    const newAIMessage = {
      type: 'ai' as const,
      message: 'Thinking...',
      status: 'Processing',
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }) + ' on ' + new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      id: messageId
    };

    setChatHistory(prev => [...prev, newAIMessage]);

    try {
      const response = await fetch('/api/zero280', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log('Response data received (initial):', data);
        console.log('Artifacts received (initial):', data.artifacts);
        
        // Update artifacts if any were created
        if (data.artifacts && data.artifacts.length > 0) {
          console.log('Setting artifacts (initial):', data.artifacts);
          setCurrentArtifacts(data.artifacts);
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
        
        // Complete progress tracking
        stopThinking();
        completeMessageExecution();
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
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newWidth = e.clientX;
      // Set minimum and maximum widths
      if (newWidth >= 200 && newWidth <= window.innerWidth - 200) {
        setChatWidth(newWidth);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    
    // Start progress tracking
    const messageId = `msg_${Date.now()}_ai`;
    startMessageExecution(messageId);
    startThinking(messageId, "Processing your request...");

    // Add user message to chat
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

    // Add AI thinking message
    const newAIMessage = {
      type: 'ai' as const,
      message: 'Thinking...',
      status: 'Processing',
      timestamp: newUserMessage.timestamp,
      id: messageId
    };

    setChatHistory(prev => [...prev, newUserMessage, newAIMessage]);

    try {
      const response = await fetch('/api/zero280', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log('Response data received (submit):', data);
        console.log('Artifacts received (submit):', data.artifacts);
        
        // Update artifacts if any were created
        if (data.artifacts && data.artifacts.length > 0) {
          console.log('Setting artifacts (submit):', data.artifacts);
          setCurrentArtifacts(data.artifacts);
        } else {
          console.log('No artifacts in response (submit)');
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
        
        // Complete progress tracking
        stopThinking();
        completeMessageExecution();
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top System Bar */}
      <div className="h-8 bg-gray-800 flex items-center justify-between px-4">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>

      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">hello-beautiful-page</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="text-sm text-gray-500">Loading Live Preview...</div>
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
      <div className="flex-1 flex">
        {/* Left Column - Chat Interface */}
        <div 
          className="bg-gray-100 flex flex-col"
          style={{ width: `${chatWidth}px` }}
        >
          {/* Chat History */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
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
            
            {/* Progress Indicators */}
            {isThinking && (
              <ThinkingIndicator 
                isThinking={isThinking} 
                message={thinkingMessage}
                className="mb-4"
              />
            )}
            
            {isActive && executions.length > 0 && (
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
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-4">
              {/* Text Input Area */}
              <div className="mb-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
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
          className={`w-1 flex items-center justify-center transition-colors ${
            isDragging ? 'bg-blue-500' : 'bg-gray-300 hover:bg-blue-400'
          }`}
          onMouseDown={handleMouseDown}
          style={{ cursor: 'col-resize' }}
        >
          <div className="w-0.5 h-8 bg-gray-400 rounded-full"></div>
        </div>

        {/* Right Column - Preview/Code Generator */}
        <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center">
          {viewMode === 'preview' ? (
            /* Preview Mode */
            currentArtifacts.length > 0 ? (
              /* Display Generated Artifacts */
              <div className="w-full h-full p-6 overflow-auto">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Preview</h2>
                  <p className="text-gray-600">Your generated components and content appear here</p>
                  <div className="text-sm text-gray-500">
                    Debug: {currentArtifacts.length} artifacts loaded
                  </div>
                </div>
                
                {currentArtifacts.map((artifact, index) => (
                  <Zero280ArtifactRenderer 
                    key={index} 
                    artifact={artifact} 
                    className="mb-8"
                  />
                ))}
              </div>
            ) : (
              /* Default Preview State */
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
            )
          ) : (
            /* Code Mode */
            <div className="w-full h-full p-6">
              <div className="bg-gray-900 rounded-lg p-4 h-full overflow-auto">
                <div className="text-gray-400 text-sm font-mono">
                  {currentArtifacts.length > 0 ? (
                    currentArtifacts.map((artifact, index) => (
                      <div key={index} className="mb-6">
                        <div className="mb-2 text-green-400">
                          // {artifact.name} - {artifact.type}
                        </div>
                        <div className="mb-2 text-blue-400">
                          // {artifact.description}
                        </div>
                        <div className="text-gray-300">
                          <pre className="whitespace-pre-wrap">{artifact.content}</pre>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="mb-4">
                        <span className="text-green-400">// No artifacts generated yet</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-blue-400">// Try asking me to build something!</span>
                      </div>
                      <div className="mb-2">
                        <span className="text-gray-300">// Example: "build a login form"</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
