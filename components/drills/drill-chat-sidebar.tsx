'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Code, Target, Zap, MessageSquare, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export function DrillChatSidebar({ selectedDrill, onDrillUpdate, onArtifactUpdate }: DrillChatSidebarProps) {
  const [inputValue, setInputValue] = useState('');
  const [currentArtifact, setCurrentArtifact] = useState<{
    language: 'html' | 'jsx' | 'javascript';
    code: string;
    timestamp: number;
  } | null>(null);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<DrillChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { addDrill } = useDrillStore();
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

  // Ensure component only renders on client side
  useEffect(() => {
    setIsClient(true);
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

    if (isClient) {
      initializeConversation();
    }

    return () => {
      mounted = false;
    };
  }, [isClient, selectedDrill?.id]);

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
                // Handle artifact data
                const artifact = {
                  language: parsed.language,
                  code: parsed.code,
                  timestamp: parsed.timestamp,
                };
                setCurrentArtifact(artifact);
                
                // Notify parent component about the artifact
                if (onArtifactUpdate) {
                  onArtifactUpdate(artifact);
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

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="p-4 border-b bg-muted/5">
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Drill Creation Assistant</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Add default welcome message if no messages exist
  const displayMessages = messages.length === 0 ? [
    {
      id: 'welcome',
      role: 'assistant' as const,
      content: "Hello! I'm your drill creation assistant. I can help you create interactive learning exercises, practice tools, and simulations. What type of drill would you like to create today?",
      timestamp: new Date(),
    }
  ] : messages;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-muted/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Drill Creation Assistant</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConversationHistory(!showConversationHistory)}
            className="h-8 w-8 p-0"
          >
            <History className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Create interactive learning exercises and practice tools
        </p>
      </div>

      {/* Conversation History */}
      {showConversationHistory && (
        <div className="p-4 border-b bg-muted/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Conversation History</h4>
            <Button variant="outline" size="sm" onClick={handleNewConversation}>
              New Chat
            </Button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {/* This would show conversation history */}
            <div className="text-xs text-muted-foreground">
              Previous conversations will appear here
            </div>
          </div>
        </div>
      )}

      {/* Quick Suggestions */}
      <div className="p-4 border-b">
        <h4 className="text-sm font-medium mb-3">Quick Start:</h4>
        <div className="space-y-2">
          {quickSuggestions.map((suggestion, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto py-2"
              onClick={() => handleQuickSuggestion(suggestion.prompt)}
            >
              <suggestion.icon className="h-4 w-4 mr-2 text-primary" />
              <span className="text-xs">{suggestion.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Artifact Status Indicator */}
      {currentArtifact && (
        <div className="p-4 border-b bg-green-50">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <h4 className="text-sm font-medium text-green-800">
              🎯 Generating {currentArtifact.language.toUpperCase()} Artifact...
            </h4>
          </div>
          <p className="text-xs text-green-700">
            Code is being generated and displayed in the center preview panel
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveArtifact}
            className="mt-2 w-full"
          >
            Save as Drill
          </Button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
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
                'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                streamingMessage.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              <div className="whitespace-pre-wrap">{streamingMessage.content}</div>
            </div>
          </div>
        )}
        
        {isLoading && !streamingMessage && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Creating your drill...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-muted/5">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe the drill you want to create..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
