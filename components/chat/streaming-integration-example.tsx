'use client';

import { useState, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import all streaming components
import { useStreamingChat } from '@/hooks/use-streaming-chat';
import { StreamingText, WordStreamingText, useStreamingText } from './streaming-text';
import { StreamingChatMessage } from './streaming-chat-message';
import { StreamingChatInput } from './streaming-chat-input';
import { 
  StreamingErrorHandler, 
  ConnectionStatus,
  StreamHealthMonitor,
  classifyStreamingError,
  useStreamRetry
} from './streaming-error-handling';
import { 
  RealTimeTypingIndicator,
  StreamingStats,
  StreamingProgressIndicator,
  StreamingQualityIndicator
} from './enhanced-streaming-indicators';
import { FadeIn, SmoothHeight } from './smooth-animations';

// EXAMPLE 1: Basic Streaming Chat
export function BasicStreamingExample() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const { text, isComplete, appendText, completeStream, resetStream } = useStreamingText();

  const simulateStreaming = async (message: string) => {
    resetStream();
    
    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now(),
      content: message,
      role: 'user',
      timestamp: new Date()
    }]);

    // Add empty AI message
    const aiMessageId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: aiMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date()
    }]);

    // Simulate streaming response
    const response = "I'll help you create a comprehensive learning path! Let me analyze your request and design a structured curriculum that covers all the essential topics you need to master.";
    
    for (let i = 0; i < response.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      appendText(response[i]);
      
      // Update the message in real-time
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId 
          ? { ...msg, content: response.slice(0, i + 1) }
          : msg
      ));
    }
    
    completeStream();
  };

  return (
    <div className="max-w-2xl mx-auto border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 p-4 border-b">
        <h3 className="font-semibold text-gray-800">Basic Streaming Example</h3>
        <p className="text-sm text-gray-600">Watch text appear character by character</p>
      </div>
      
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
            <div className={`flex items-start gap-2 max-w-xs ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {message.role === 'user' ? (
                  message.content
                ) : (
                  <StreamingText 
                    text={message.content}
                    isComplete={message.content.length === response.length}
                    speed={30}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                simulateStreaming(input);
                setInput('');
              }
            }}
          />
          <Button 
            onClick={() => {
              simulateStreaming(input);
              setInput('');
            }}
            disabled={!input.trim()}
            className="px-4 py-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// EXAMPLE 2: Advanced Streaming with All Features
export function AdvancedStreamingExample() {
  const { 
    streamingState, 
    sendStreamingMessage, 
    abortStream,
    isStreaming 
  } = useStreamingChat();
  
  const { retry, retryCount, canRetry } = useStreamRetry();
  const [connectionStatus, setConnectionStatus] = useState(true);
  const [streamStats, setStreamStats] = useState({
    charsReceived: 0,
    timeElapsed: 0,
    startTime: 0
  });

  // Update streaming stats
  useEffect(() => {
    if (isStreaming) {
      const interval = setInterval(() => {
        setStreamStats(prev => ({
          ...prev,
          charsReceived: streamingState.streamingText.length,
          timeElapsed: Date.now() - prev.startTime
        }));
      }, 100);

      return () => clearInterval(interval);
    } else if (streamingState.stage === 'complete') {
      // Reset stats when done
      setTimeout(() => {
        setStreamStats({ charsReceived: 0, timeElapsed: 0, startTime: 0 });
      }, 2000);
    }
  }, [isStreaming, streamingState]);

  // Monitor connection status
  useEffect(() => {
    const handleOnline = () => setConnectionStatus(true);
    const handleOffline = () => setConnectionStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSendMessage = async (message: string) => {
    setStreamStats(prev => ({ ...prev, startTime: Date.now() }));
    
    try {
      await sendStreamingMessage(message, {
        onStreamStart: () => {
          console.log('🚀 Advanced streaming started');
        },
        onStreamChunk: (chunk, fullText) => {
          // Real-time analytics could go here
        },
        onStreamError: async (error) => {
          const classifiedError = classifyStreamingError(error);
          
          if (classifiedError.retryable && canRetry) {
            // Auto-retry for network issues
            if (classifiedError.type === 'network') {
              setTimeout(() => {
                retry(() => sendStreamingMessage(message));
              }, 2000);
            }
          }
        }
      });
    } catch (error) {
      console.error('Advanced streaming failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Advanced Streaming Example</h3>
            <p className="text-sm text-gray-600">Full-featured streaming with monitoring</p>
          </div>
          <ConnectionStatus isConnected={connectionStatus} />
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Real-time typing indicator */}
        <RealTimeTypingIndicator 
          isVisible={isStreaming && streamingState.stage === 'connecting'}
          message="Connecting to AI..."
          variant="thinking"
        />

        {/* Progress indicator */}
        <SmoothHeight>
          <StreamingProgressIndicator 
            stage={streamingState.stage}
            progress={streamingState.progress}
            isVisible={isStreaming}
            showStats={true}
            charsReceived={streamStats.charsReceived}
            timeElapsed={streamStats.timeElapsed}
          />
        </SmoothHeight>

        {/* Stream health monitor */}
        <StreamHealthMonitor 
          isStreaming={isStreaming}
          bytesReceived={streamStats.charsReceived}
          chunksReceived={Math.floor(streamStats.charsReceived / 50)} // Estimate
          timeElapsed={streamStats.timeElapsed}
        />

        {/* Error handling */}
        {streamingState.error && (
          <StreamingErrorHandler 
            error={classifyStreamingError(streamingState.error)}
            onRetry={() => retry(() => handleSendMessage("Retry this message"))}
            onDismiss={() => {/* handle dismiss */}}
          />
        )}

        {/* Quality indicator */}
        <StreamingQualityIndicator 
          latency={streamStats.timeElapsed / Math.max(1, streamStats.charsReceived)}
          chunkSize={50} // Average chunk size
          consistency={95} // Stream consistency percentage
          isVisible={isStreaming}
        />

        {/* Demo Controls */}
        <div className="flex gap-2">
          <Button 
            onClick={() => handleSendMessage("Create a JavaScript learning path")}
            disabled={isStreaming}
            variant="outline"
          >
            Test Short Response
          </Button>
          
          <Button 
            onClick={() => handleSendMessage("Create a comprehensive full-stack web development curriculum with detailed modules, exercises, projects, and assessment strategies")}
            disabled={isStreaming}
            variant="outline"
          >
            Test Long Response
          </Button>
          
          {isStreaming && (
            <Button 
              onClick={abortStream}
              variant="outline"
              className="text-red-600 hover:text-red-800"
            >
              Stop Streaming
            </Button>
          )}
        </div>

        {/* Retry Info */}
        {retryCount > 0 && (
          <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-3">
            Retry attempt: {retryCount}/3
          </div>
        )}
      </div>
    </div>
  );
}

// EXAMPLE 3: Integration Guide Component
export function StreamingIntegrationGuide() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Real-Time Streaming Chat Integration
        </h1>
        <p className="text-lg text-gray-600">
          Transform your AI chat to stream responses in real-time like Claude
        </p>
      </div>

      {/* Basic Example */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
          1. Basic Streaming Demo
        </h2>
        <p className="text-gray-600">
          Character-by-character streaming with smooth animations
        </p>
        <BasicStreamingExample />
      </div>

      {/* Advanced Example */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
          2. Advanced Streaming with Monitoring
        </h2>
        <p className="text-gray-600">
          Full-featured streaming with progress tracking, error handling, and health monitoring
        </p>
        <AdvancedStreamingExample />
      </div>

      {/* Integration Steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
          3. Integration Steps
        </h2>
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Step 1: Replace Components</h3>
              <code className="block bg-gray-100 p-3 rounded text-sm">
                {`// Replace ChatInput
import { StreamingChatInput } from './streaming-chat-input';

// Replace ChatMessage  
import { StreamingChatMessage } from './streaming-chat-message';`}
              </code>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Step 2: Add Streaming Hook</h3>
              <code className="block bg-gray-100 p-3 rounded text-sm">
                {`// Add to your chat interface
const { streamingState, isStreaming } = useStreamingChat();`}
              </code>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Step 3: Update Message Display</h3>
              <code className="block bg-gray-100 p-3 rounded text-sm">
                {`{messages.map((message) => (
  <StreamingChatMessage 
    key={message.id}
    message={message}
    isStreaming={isStreaming && message.id === streamingId}
    streamingText={streamingState.streamingText}
  />
))}`}
              </code>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Step 4: Add Error Handling</h3>
              <code className="block bg-gray-100 p-3 rounded text-sm">
                {`{streamingState.error && (
  <StreamingErrorHandler 
    error={classifyStreamingError(streamingState.error)}
    onRetry={() => retryLastMessage()}
  />
)}`}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Comparison */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
          4. Performance Impact
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">❌ Before (Static)</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Users wait 3-10 seconds in silence</li>
              <li>• Response appears suddenly (jarring)</li>
              <li>• No feedback during processing</li>
              <li>• Cannot abort long responses</li>
              <li>• Poor error messaging</li>
            </ul>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">✅ After (Streaming)</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Text appears immediately (20-50ms)</li>
              <li>• Smooth character-by-character animation</li>
              <li>• Real-time progress indicators</li>
              <li>• Abort capability (Escape key)</li>
              <li>• Smart error recovery with retries</li>
            </ul>
          </div>
        </div>
      </div>

      {/* API Integration */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
          5. Your Existing API Already Works!
        </h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 mb-3">
            Great news! Your <code className="bg-blue-100 px-2 py-1 rounded">/api/chat/route.ts</code> already supports streaming.
          </p>
          <div className="text-sm text-blue-700 space-y-2">
            <p>✅ <strong>SSE format:</strong> <code>data: {JSON.stringify(chunk)}</code></p>
            <p>✅ <strong>Text chunks:</strong> <code>chunk.delta.text</code></p>
            <p>✅ <strong>Tool progress:</strong> <code>toolExecution</code> updates</p>
            <p>✅ <strong>Error handling:</strong> <code>[DONE]</code> and error messages</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// EXAMPLE 4: Drop-in Replacement for Your Current Chat
export function DropInStreamingChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const { streamingState, sendStreamingMessage, isStreaming } = useStreamingChat();

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold">Streaming AI Chat</h1>
        <div className="flex items-center gap-4 mt-2">
          <ConnectionStatus isConnected={!streamingState.error} />
          {isStreaming && (
            <StreamingQualityIndicator 
              latency={50}
              chunkSize={100}
              consistency={95}
              isVisible={true}
            />
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Streaming progress */}
        <SmoothHeight>
          {isStreaming && (
            <StreamingProgressIndicator 
              stage={streamingState.stage}
              progress={streamingState.progress}
              isVisible={true}
              showStats={true}
              charsReceived={streamingState.streamingText.length}
              timeElapsed={Date.now()}
            />
          )}
        </SmoothHeight>

        {/* Error handling */}
        <SmoothHeight>
          {streamingState.error && (
            <StreamingErrorHandler 
              error={classifyStreamingError(streamingState.error)}
              onRetry={() => {/* implement retry */}}
              onDismiss={() => {/* dismiss error */}}
            />
          )}
        </SmoothHeight>

        {/* Messages */}
        {messages.map((message) => (
          <StreamingChatMessage 
            key={message.id}
            message={message}
            isStreaming={isStreaming && message.role === 'assistant'}
            streamingText={streamingState.streamingText}
          />
        ))}

        {/* Real-time typing indicator */}
        <RealTimeTypingIndicator 
          isVisible={isStreaming && streamingState.streamingText.length === 0}
          message="AI is analyzing your request..."
          variant="thinking"
        />
      </div>

      {/* Input */}
      <StreamingChatInput />
    </div>
  );
}