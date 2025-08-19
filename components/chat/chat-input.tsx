import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/lib/chat-store';
import { useArtifactStore } from '@/lib/artifact-store';
import { parseAndExecuteAICommand } from '@/lib/ai-prompt-parser';

export function ChatInput() {
  const [input, setInput] = useState('');
  const [inputHeight, setInputHeight] = useState(48); // Default height for h-12
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { 
    addMessage, 
    setLoading, 
    setError, 
    isLoading, 
    updateStreamingMessage, 
    finishStreamingMessage,
    currentConversationId,
    refreshConversations
  } = useChatStore();

  const { addArtifact, setCurrentArtifact, updateArtifact } = useArtifactStore();

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
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setInputHeight(48); // Reset height
    setError(null);
    
    // Check if we have a conversation selected
    if (!currentConversationId) {
      setError('Please start a new chat first by clicking the "New Chat" button.');
      return;
    }
    
    // Add user message immediately
    const userMessageId = addMessage({
      content: userMessage,
      role: 'user',
    });

    if (!userMessageId) {
      setError('Failed to add message. Please try starting a new chat.');
      return;
    }

    // Check if this is an editing command first
    if (isEditingCommand(userMessage)) {
      await handleEditingCommand(userMessage);
      return;
    }

    setLoading(true);

    // Add empty assistant message for streaming
    const assistantMessageId = addMessage({
      content: '',
      role: 'assistant',
    });

    if (!assistantMessageId) {
      setError('Failed to add assistant message. Please try starting a new chat.');
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
          message: userMessage,
          conversation_id: currentConversationId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Handle streaming response with timeout
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let lastUpdateTime = Date.now();
      const updateInterval = 100; // Update UI every 100ms for better performance
      const startTime = Date.now();
      const maxWaitTime = 120000; // 2 minutes max wait time
      let currentArtifactId = null; // Track the current artifact being created

      while (true) {
        // Check for timeout
        if (Date.now() - startTime > maxWaitTime) {
          throw new Error('Response timeout - the AI is taking too long to respond. Please try again with a simpler request.');
        }

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
                // Mark the artifact as complete
                updateArtifact(currentArtifactId, { isStreaming: false });
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
                
                // Only update UI periodically for better performance with long responses
                const now = Date.now();
                if (now - lastUpdateTime >= updateInterval) {
                  updateStreamingMessage(assistantMessageId, accumulatedContent);
                  lastUpdateTime = now;
                }
              }

              // Handle artifact data
              if (parsed.artifact) {
                console.log('🎯 Chat input received artifact:', parsed.artifact);
                
                if (currentArtifactId) {
                  // Update existing artifact
                  console.log('🔄 Updating existing artifact:', currentArtifactId);
                  updateArtifact(currentArtifactId, {
                    data: parsed.artifact.data,
                    isStreaming: true,
                  });
                } else {
                  // Create new artifact only once
                  console.log('🆕 Creating new artifact');
                  addArtifact({
                    type: parsed.artifact.type,
                    title: parsed.artifact.title,
                    data: parsed.artifact.data,
                    isStreaming: true,
                  }).then((artifactId) => {
                    console.log('✅ Created artifact in chat input:', artifactId);
                    currentArtifactId = artifactId;
                    // Set as current artifact to display in left panel
                    setCurrentArtifact(artifactId);
                  });
                }
              }
            } catch (parseError) {
              // Skip malformed JSON lines
              continue;
            }
          }
        }
      }

      // Final update with complete content
      updateStreamingMessage(assistantMessageId, accumulatedContent);
      
      // No need to create artifacts here since we're already handling them in the streaming loop
      // This prevents duplication
      
      finishStreamingMessage(assistantMessageId);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      
      // Update the assistant message with error
      updateStreamingMessage(assistantMessageId, `Sorry, I encountered an error: ${errorMessage}`);
      finishStreamingMessage(assistantMessageId);
    }
  };

  // Check if the message is an editing command
  const isEditingCommand = (message: string): boolean => {
    const editingKeywords = [
      'change', 'edit', 'update', 'modify', 'add', 'remove', 'delete', 'drop',
      'duplicate', 'copy', 'clone', 'move', 'relocate', 'merge', 'combine',
      'set', 'include', 'exclude'
    ];
    
    return editingKeywords.some(keyword => 
      message.toLowerCase().includes(keyword.toLowerCase())
    );
  };

  // Handle editing commands using AI tools
  const handleEditingCommand = async (message: string) => {
    try {
      // Parse and execute the command
      const result = await parseAndExecuteAICommand(message);
      
      // Add the result message
      if (result.success) {
        addMessage({
          content: `✅ ${result.message}`,
          role: 'assistant',
        });
      } else {
        addMessage({
          content: `❌ ${result.message}`,
          role: 'assistant',
        });
      }
      
    } catch (error) {
      console.error('Error handling editing command:', error);
      
      // Add error message
      addMessage({
        content: `Sorry, I encountered an error while processing your editing request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        role: 'assistant',
      });
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // Shift+Enter will naturally create a new line in the textarea
  };

  return (
    <div className="border-t bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-4xl mx-auto p-6">
        {/* Enhanced Input Container */}
        <div className="relative">
          {/* Input Field */}
          <div className="relative flex items-end">
            {/* Plus Button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 bottom-2 z-10 h-9 w-9 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200 rounded-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            {/* Textarea Field - Replaces Input for multi-line support */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={
                !currentConversationId 
                  ? "Start a new chat to begin..." 
                  : isLoading 
                    ? "AI is generating your learning path..." 
                    : "Ask me about creating learning paths..."
              }
              disabled={isLoading || !currentConversationId}
              style={{ height: `${inputHeight}px` }}
              className={`flex-1 pl-14 pr-20 py-3 rounded-2xl border-2 bg-white shadow-sm focus:ring-4 focus:ring-blue-100 transition-all duration-300 placeholder:text-slate-400 text-slate-700 resize-none overflow-hidden leading-6 ${
                !currentConversationId 
                  ? 'border-slate-300 bg-slate-50 cursor-not-allowed' 
                  : 'border-slate-200 focus:border-blue-500'
              }`}
              rows={1}
            />
            
            {/* Send Button */}
            <Button 
              onClick={sendMessage} 
              disabled={!input.trim() || isLoading || !currentConversationId}
              size="sm"
              className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              title={!currentConversationId ? "Start a new chat first" : "Send message"}
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Loading Status */}
          {isLoading && (
            <div className="mt-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}} />
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}} />
                </div>
                <span className="text-sm text-slate-700 font-medium">
                  Generating your learning path... This may take a moment for complex structures.
                </span>
              </div>
            </div>
          )}
          
          {/* Helper Text */}
          <div className="mt-3 text-center">
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3 w-3 text-blue-400" />
              {!currentConversationId 
                ? "Click 'New Chat' to begin creating learning paths"
                : "Press Enter to send, Shift+Enter for new line"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}