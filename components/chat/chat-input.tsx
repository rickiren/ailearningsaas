import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChatStore } from '@/lib/chat-store';
import { useArtifactStore } from '@/lib/artifact-store';

export function ChatInput() {
  const [input, setInput] = useState('');
  const { 
    addMessage, 
    setLoading, 
    setError, 
    isLoading, 
    updateStreamingMessage, 
    finishStreamingMessage,
    currentConversationId
  } = useChatStore();

  const { addArtifact, setCurrentArtifact, updateArtifact } = useArtifactStore();

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    
    // Add user message immediately
    addMessage({
      content: userMessage,
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

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="border-t bg-background p-4">
      <div className="max-w-4xl mx-auto flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isLoading ? "AI is generating your learning path..." : "Ask me about creating learning paths..."}
          disabled={isLoading}
          className="flex-1"
        />
        <Button 
          onClick={sendMessage} 
          disabled={!input.trim() || isLoading}
          size="icon"
          className={isLoading ? "animate-pulse" : ""}
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      {isLoading && (
        <div className="text-center text-sm text-muted-foreground mt-2">
          Generating your learning path... This may take a moment for complex structures.
        </div>
      )}
    </div>
  );
}