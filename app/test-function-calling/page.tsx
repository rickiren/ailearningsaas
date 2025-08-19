'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TestFunctionCallingPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; toolResults?: any[] }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let toolResults: any[] = [];
      let toolStatus: any = null;

      // Add assistant message placeholder
      setMessages(prev => [...prev, { role: 'assistant', content: '', toolResults: [] }]);

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              // Update final message with tool results
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.toolResults = toolResults.length > 0 ? toolResults : undefined;
                }
                return newMessages;
              });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.content) {
                accumulatedContent += parsed.content;
                // Update the last assistant message
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content = accumulatedContent;
                  }
                  return newMessages;
                });
              }

              // Handle tool execution status
              if (parsed.toolExecution?.status) {
                toolStatus = parsed.toolExecution;
                console.log('Tool status:', toolStatus);
              }

              // Handle tool execution results
              if (parsed.toolExecution?.toolId) {
                toolResults.push(parsed.toolExecution);
                console.log('Tool result:', parsed.toolExecution);
              }

            } catch (parseError) {
              continue;
            }
          }
        }
      }

    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      // Update the last assistant message with error
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = `Sorry, I encountered an error: ${errorMessage}`;
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            AI Agent Function Calling Test
          </h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Available Tools:</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900">create_artifact</h3>
                <p className="text-sm text-blue-700">Creates new code/content artifacts</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-900">update_artifact</h3>
                <p className="text-sm text-green-700">Modifies existing artifacts</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <h3 className="font-medium text-purple-900">read_file</h3>
                <p className="text-sm text-purple-700">Reads files from the project</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <h3 className="font-medium text-orange-900">write_file</h3>
                <p className="text-sm text-orange-700">Writes/modifies project files</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Try these examples:</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('Create a new React component called Button')}
                className="w-full text-left justify-start"
              >
                "Create a new React component called Button"
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('Read the package.json file to see what dependencies we have')}
                className="w-full text-left justify-start"
              >
                "Read the package.json file to see what dependencies we have"
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInput('Create a new utility function for date formatting')}
                className="w-full text-left justify-start"
              >
                "Create a new utility function for date formatting"
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the AI to use tools (e.g., 'Create a new file called utils.ts')"
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? 'Processing...' : 'Send'}
              </Button>
            </div>
          </form>

          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-100 text-blue-900'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="font-medium mb-2">
                  {message.role === 'user' ? 'You' : 'AI Assistant'}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
                
                {/* Display tool results */}
                {message.toolResults && message.toolResults.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-300">
                    <div className="text-sm font-medium text-gray-700 mb-2">Tool Results:</div>
                    {message.toolResults.map((result, resultIndex) => (
                      <div
                        key={resultIndex}
                        className={`p-2 rounded text-xs mb-2 ${
                          result.success
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        <div className="font-medium">{result.toolName}</div>
                        <div>{result.success ? 'Success' : 'Failed'}</div>
                        {result.result?.message && (
                          <div className="mt-1">{result.result.message}</div>
                        )}
                        {result.error && (
                          <div className="mt-1 text-red-600">{result.error}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
