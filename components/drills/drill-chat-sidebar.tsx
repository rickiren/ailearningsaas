'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Sparkles, Code, Target, Zap, MessageSquare, History, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Drill, DrillChatMessage } from '@/types/drills';
import { cn } from '@/lib/utils';
import { useDrillStore } from '@/lib/drill-store';
import { useDrillChatStore } from '@/lib/drill-chat-store';

interface DrillChatSidebarProps {
  selectedDrill: Drill | null;
  onDrillUpdate: (drill: Drill | null) => void;
  onArtifactUpdate?: (artifact: {
    language: 'html' | 'jsx' | 'javascript';
    code: string;
    timestamp: number;
  } | null) => void;
}

// Quick suggestions for drill creation
const quickSuggestions = [
  { label: 'HTML Form Practice', icon: Code, prompt: 'Create an interactive HTML form validation drill' },
  { label: 'React Counter', icon: Target, prompt: 'Build a React counter component with state management' },
  { label: 'CSS Grid Layout', icon: Zap, prompt: 'Make an interactive CSS Grid layout practice tool' },
  { label: 'JavaScript Functions', icon: Code, prompt: 'Create a JavaScript function practice drill' },
];

// Quick suggestions for drill editing
const editingSuggestions = [
  { label: 'Add Validation', icon: Target, prompt: 'Add form validation to this drill' },
  { label: 'Improve Styling', icon: Zap, prompt: 'Enhance the visual design and styling' },
  { label: 'Add Interactivity', icon: Code, prompt: 'Make this drill more interactive' },
  { label: 'Fix Issues', icon: Target, prompt: 'Identify and fix any problems in the code' },
];

// Client-side wrapper component to prevent hydration issues
function DrillChatSidebarClient({ selectedDrill, onDrillUpdate, onArtifactUpdate }: DrillChatSidebarProps) {
  const [inputValue, setInputValue] = useState('');
  const [inputHeight, setInputHeight] = useState(48); // Default height for h-12
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentArtifact, setCurrentArtifact] = useState<{
    language: 'html' | 'jsx' | 'javascript';
    code: string;
    timestamp: number;
  } | null>(null);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<DrillChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { addDrill, handleArtifactCommand } = useDrillStore();
  const {
    messages,
    currentConversationId,
    isLoading,
    error,
    setCurrentConversation,
    loadConversation,
    createNewConversation,
    addMessage,
    updateMessage,
    setMessages,
    loadConversations,
    clearMessages,
    setLoading,
  } = useDrillChatStore();

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 48), 200); // Min 48px, max 200px
      setInputHeight(newHeight);
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Adjust height when input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  // Ensure component only renders on client side
  useEffect(() => {
    // This useEffect is no longer needed as hydration is handled by Next.js
    // and the component will only render on the client side.
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Initialize conversation when component mounts or drill changes
  useEffect(() => {
    let mounted = true;
    
    const initializeConversation = async () => {
      try {
        console.log('Initializing conversation for drill:', selectedDrill?.id);
        
        // Add a small delay to ensure proper hydration
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!mounted) return;
        
        if (selectedDrill) {
          // Try to find existing conversation for this drill
          const conversations = await loadConversations();
          if (!mounted) return;
          
          console.log('Loaded conversations:', conversations);
          
          const existingConversation = conversations.find(conv => conv.drillId === selectedDrill.id);
          
          if (existingConversation) {
            console.log('Loading existing conversation:', existingConversation.id);
            await loadConversation(existingConversation.id);
          } else {
            // Create new conversation for this drill
            console.log('Creating new conversation for drill:', selectedDrill.id);
            await createNewConversation(selectedDrill.id);
          }
        } else {
          // Create new general conversation
          console.log('Creating new general conversation');
          await createNewConversation();
        }
      } catch (error) {
        console.error('Failed to initialize conversation:', error);
      }
    };

    // Initialize conversation immediately since we're in a client component
    initializeConversation();

    return () => {
      mounted = false;
    };
  }, [selectedDrill?.id, loadConversations, loadConversation, createNewConversation]);

  // NEW: Enhanced AI response processing helper
  const processAIArtifactResponse = async (parsed: any, selectedDrill: Drill | null) => {
    if (parsed.type === 'artifact' && selectedDrill) {
      try {
        // Determine the command type based on AI response context
        let command: 'create' | 'update' | 'rewrite' = 'update';
        
        // You could enhance this logic based on your AI prompts
        if (parsed.code !== selectedDrill.code) {
          command = 'rewrite';
        }
        
        // Directly update drill content using the store
        await handleArtifactCommand(selectedDrill.id, command, parsed.code);
        
        // Set current artifact for display
        setCurrentArtifact({
          language: parsed.language,
          code: parsed.code,
          timestamp: parsed.timestamp,
        });
        
        // Notify parent components
        if (onDrillUpdate) {
          const updatedDrill = {
            ...selectedDrill,
            code: parsed.code,
            metadata: {
              ...selectedDrill.metadata,
              updatedAt: new Date(),
              version: (selectedDrill.metadata.version || 1) + 1,
            },
          };
          onDrillUpdate(updatedDrill);
        }
        
        if (onArtifactUpdate) {
          onArtifactUpdate({
            language: parsed.language,
            code: parsed.code,
            timestamp: parsed.timestamp,
          });
        }
        
        return true; // Successfully processed
      } catch (error) {
        console.error('Failed to process AI artifact response:', error);
        return false;
      }
    }
    return false;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessageContent = inputValue.trim();
    
    try {
      setLoading(true);
      setCurrentArtifact(null);
      setStreamingMessage(null);

      // Add user message to store
      await addMessage({
        role: 'user',
        content: userMessageContent,
        drillId: selectedDrill?.id,
      });

      setInputValue('');
      setInputHeight(48); // Reset height

      // Create a temporary streaming message
      const tempMessage: DrillChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      setStreamingMessage(tempMessage);

      // Send to AI API
      const response = await fetch('/api/drills/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessageContent,
          conversation_id: currentConversationId,
          drillId: selectedDrill?.id,
          currentCode: selectedDrill?.code,
          language: selectedDrill?.type,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      let aiMessage = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'artifact') {
                // NEW: Use enhanced AI response processing
                const processed = await processAIArtifactResponse(parsed, selectedDrill);
                if (!processed) {
                  console.error('Failed to process artifact response');
                }
              } else if (parsed.content) {
                // Handle text content
                aiMessage += parsed.content;
                
                // Update streaming message in real-time
                setStreamingMessage(prev => prev ? { ...prev, content: aiMessage } : null);
              }
            } catch (e) {
              console.error('Failed to parse chunk:', e);
            }
          }
        }
      }

      // Clear streaming message and reload conversation to get the stored messages
      setStreamingMessage(null);
      if (currentConversationId) {
        await loadConversation(currentConversationId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setStreamingMessage(null);
      
      const errorMessage: DrillChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages([...(messages || []), errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArtifact = async () => {
    if (!currentArtifact) return;

    try {
      // Extract title from the first message that mentions creating a drill
      const creationMessage = messages.find(msg => 
        msg.role === 'user' && 
        (msg.content.toLowerCase().includes('create') || msg.content.toLowerCase().includes('make'))
      );
      
      const title = creationMessage?.content || `Generated ${currentArtifact.language.toUpperCase()} Drill`;
      
      const drillId = await addDrill({
        title: title.length > 50 ? title.substring(0, 50) + '...' : title,
        description: `Interactive ${currentArtifact.language.toUpperCase()} drill generated by AI`,
        type: currentArtifact.language === 'html' ? 'html' : 'jsx',
        skillName: currentArtifact.language === 'html' ? 'HTML/CSS/JS' : 'React',
        learningObjectives: [
          'Practice interactive coding',
          'Learn through hands-on experience',
          'Understand real-world application'
        ],
        difficulty: 'beginner',
        estimatedTime: 15,
        code: currentArtifact.code,
      });

      // Update the current drill
      const newDrill = {
        id: drillId,
        title: title.length > 50 ? title.substring(0, 50) + '...' : title,
        description: `Interactive ${currentArtifact.language.toUpperCase()} drill generated by AI`,
        type: (currentArtifact.language === 'html' ? 'html' : 'jsx') as 'html' | 'jsx',
        skillName: currentArtifact.language === 'html' ? 'HTML/CSS/JS' : 'React',
        learningObjectives: [
          'Practice interactive coding',
          'Learn through hands-on experience',
          'Understand real-world application'
        ],
        difficulty: 'beginner' as const,
        estimatedTime: 15,
        code: currentArtifact.code,
        metadata: {
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      onDrillUpdate(newDrill);
      
      // Add success message
      const successMessage: DrillChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Drill saved successfully! You can now find it in your drill list and edit it further.`,
        timestamp: new Date(),
      };
      setMessages([...(messages || []), successMessage]);
      
    } catch (error) {
      console.error('Error saving drill:', error);
      const errorMessage: DrillChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ Failed to save drill. Please try again.',
        timestamp: new Date(),
      };
      setMessages([...(messages || []), errorMessage]);
    }
  };

  const handleQuickSuggestion = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleNewConversation = async () => {
    await createNewConversation(selectedDrill?.id);
    setShowConversationHistory(false);
  };

  const handleLoadConversation = async (conversationId: string) => {
    await loadConversation(conversationId);
    setShowConversationHistory(false);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Shift+Enter will naturally create a new line in the textarea
  };

  // Add default welcome message if no messages exist
  const displayMessages = messages.length === 0 ? [
    {
      id: 'welcome',
      role: 'assistant' as const,
      content: selectedDrill 
        ? `Hello! I'm your drill editing assistant. I can help you modify and improve your "${selectedDrill.title}" drill. What changes would you like to make? I can update the code, add new features, fix issues, or enhance the learning experience.`
        : "Hello! I'm your drill creation assistant. I can help you create interactive learning exercises, practice tools, and simulations. What type of drill would you like to create today?",
      timestamp: new Date(),
    }
  ] : messages;

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-slate-900">Drill Creation Assistant</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConversationHistory(!showConversationHistory)}
            className="h-9 w-9 p-0 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200"
          >
            <History className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          {selectedDrill 
            ? `Edit and improve your "${selectedDrill.title}" drill`
            : 'Create interactive learning exercises and practice tools'
          }
        </p>
      </div>

      {/* Conversation History */}
      {showConversationHistory && (
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-800">Conversation History</h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNewConversation}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 transition-all duration-200"
            >
              New Chat
            </Button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {/* This would show conversation history */}
            <div className="text-xs text-slate-500">
              Previous conversations will appear here
            </div>
          </div>
        </div>
      )}

      {/* Quick Suggestions */}
      <div className="p-4 border-b border-slate-200">
        <h4 className="text-sm font-semibold mb-3 text-slate-800">Quick Start:</h4>
        <div className="space-y-2">
          {selectedDrill ? editingSuggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto py-2.5 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all duration-200 rounded-lg"
              onClick={() => handleQuickSuggestion(suggestion.prompt)}
            >
              <suggestion.icon className="h-4 w-4 mr-2 text-blue-500" />
              <span className="text-xs">{suggestion.label}</span>
            </Button>
          )) : quickSuggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto py-2.5 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 transition-all duration-200 rounded-lg"
              onClick={() => handleQuickSuggestion(suggestion.prompt)}
            >
              <suggestion.icon className="h-4 w-4 mr-2 text-blue-500" />
              <span className="text-xs">{suggestion.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Artifact Status Indicator */}
      {currentArtifact && (
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h4 className="text-sm font-semibold text-green-800">
              {selectedDrill ? '🔄 Updating Drill Code...' : '🎯 Generating New Drill...'}
            </h4>
          </div>
          <p className="text-xs text-green-700 leading-relaxed">
            {selectedDrill 
              ? 'Code is being updated in real-time. Changes are automatically applied to your drill.'
              : 'Code is being generated and displayed in the center preview panel'
            }
          </p>
          {!selectedDrill && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveArtifact}
              className="mt-3 w-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-300 transition-all duration-200"
            >
              Save as Drill
            </Button>
          )}
          {selectedDrill && (
            <div className="mt-3 flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // The code is already updated, just show success
                  const successMessage: DrillChatMessage = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: `✅ Drill code updated successfully! The changes have been applied to your drill.`,
                    timestamp: new Date(),
                  };
                  setMessages([...(messages || []), successMessage]);
                  setCurrentArtifact(null);
                }}
                className="flex-1 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-300 transition-all duration-200"
              >
                Apply Changes
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {(messages || []).map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all duration-200',
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'bg-white border border-slate-200'
              )}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
            </div>
          </div>
        ))}
        
        {streamingMessage && (
          <div
            key={streamingMessage.id}
            className={cn(
              'flex',
              streamingMessage.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm transition-all duration-200',
                streamingMessage.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                  : 'bg-white border border-slate-200'
              )}
            >
              <div className="whitespace-pre-wrap leading-relaxed">{streamingMessage.content}</div>
            </div>
          </div>
        )}
        
        {isLoading && !streamingMessage && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm shadow-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                <span>Creating your drill...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="relative flex items-end">
          {/* Plus Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-3 bottom-2 z-10 h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200 rounded-full"
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          {/* Textarea Field - Replaces Input for multi-line support */}
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={selectedDrill 
              ? "Describe the changes you want to make to this drill..."
              : "Describe the drill you want to create..."
            }
            disabled={isLoading}
            style={{ height: `${inputHeight}px` }}
            className="flex-1 pl-12 pr-20 py-3 rounded-2xl border-2 border-slate-200 bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 placeholder:text-slate-400 text-slate-700 resize-none overflow-hidden leading-6"
            rows={1}
          />
          
          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
            className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DrillChatSidebar({ selectedDrill, onDrillUpdate, onArtifactUpdate }: DrillChatSidebarProps) {
  return <DrillChatSidebarClient selectedDrill={selectedDrill} onDrillUpdate={onDrillUpdate} onArtifactUpdate={onArtifactUpdate} />;
}
