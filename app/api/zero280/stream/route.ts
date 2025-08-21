import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { ChatService } from '@/lib/chat-service';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, userId, mode, preventCodeEditing } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Zero280 Streaming API called with:', { message, conversationId, userId, mode, preventCodeEditing });

    // Check if required environment variables are set
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Missing ANTHROPIC_API_KEY environment variable');
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If no conversationId, create a new conversation
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      try {
        console.log('Creating new chat session...');
        const chatSession = await ChatService.createChatSession(message, userId);
        if (chatSession.conversation) {
          currentConversationId = chatSession.conversation.id;
          console.log('Created conversation:', currentConversationId);
        } else {
          console.warn('Failed to create conversation, continuing without database persistence');
          currentConversationId = `temp_${Date.now()}`;
        }
      } catch (error) {
        console.error('Error creating chat session:', error);
        currentConversationId = `temp_${Date.now()}`;
      }
    }

    // Try to add user message to conversation
    try {
      if (currentConversationId && !currentConversationId.startsWith('temp_')) {
        await ChatService.addMessage(currentConversationId, {
          role: 'user',
          content: message,
          metadata: {
            type: 'user_request',
            timestamp: new Date().toISOString(),
            mode: mode || 'agent'
          }
        });
      }
    } catch (error) {
      console.warn('Failed to add message to conversation:', error);
    }

    // Handle Chat Mode (discussion only, no code editing)
    if (mode === 'chat' || preventCodeEditing) {
      console.log('Chat Mode: Streaming discussion response');
      
      try {
        // Get conversation context for AI
        let conversationSummary = '';
        try {
          if (currentConversationId && !currentConversationId.startsWith('temp_')) {
            conversationSummary = await ChatService.getConversationSummary(currentConversationId);
          }
        } catch (error) {
          console.warn('Failed to get conversation summary:', error);
          conversationSummary = `User wants to discuss: ${message}`;
        }
        
        // Generate streaming AI response for discussion only (no tools)
        const systemPrompt = `You are a helpful AI coding assistant in CHAT MODE. 

CHAT MODE RULES:
- You can discuss, explain, and answer questions about code
- You CANNOT write, modify, or execute any code
- You CANNOT access files or make project changes
- You CANNOT use any development tools
- You are in READ-ONLY discussion mode only

CONVERSATION CONTEXT:
${conversationSummary}

USER REQUEST: ${message}

Provide a helpful, informative response that explains concepts, answers questions, and gives guidance about code WITHOUT making any changes or using development tools.`;

        console.log('Chat Mode: Sending streaming request to Anthropic...');
        
        // Create streaming response
        const stream = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          system: systemPrompt,
          stream: true
        });

        // Create a ReadableStream for streaming
        const readableStream = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                  const content = chunk.delta.text;
                  
                  // Send the chunk as a Server-Sent Event
                  const data = JSON.stringify({ content });
                  controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                }
              }
              
              // Send completion signal
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              controller.close();
              
            } catch (error) {
              console.error('Streaming error:', error);
              controller.error(error);
            }
          }
        });

        // Add AI response to conversation after streaming completes
        try {
          if (currentConversationId && !currentConversationId.startsWith('temp_')) {
            // We'll add the full response later when we implement response accumulation
            // For now, just log that streaming completed
            console.log('Chat Mode: Streaming completed');
          }
        } catch (error) {
          console.warn('Failed to add AI response to conversation:', error);
        }

        return new Response(readableStream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
        
      } catch (error) {
        console.error('Chat Mode: Error generating streaming response:', error);
        
        // Provide a helpful fallback response instead of an error
        const fallbackResponse = `I'm having trouble connecting to my AI service right now, but I can still help you! 

In Chat Mode, I can:
• Explain code concepts and patterns
• Answer questions about your project
• Provide guidance and best practices
• Discuss development approaches

Try asking me something like:
• "What is this project about?"
• "Can you explain how this code works?"
• "What are some best practices for this?"

If you need me to actually edit or create code, please switch to Agent Mode using the toggle button.`;
        
        return new Response(JSON.stringify({
          response: fallbackResponse,
          conversationId: currentConversationId,
          mode: 'chat',
          artifacts: [],
          toolResults: [],
          fallback: true
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // For non-chat mode, return error (this endpoint is chat-only)
    return new Response(JSON.stringify({
      error: 'This streaming endpoint is for Chat Mode only. Use the main endpoint for Agent Mode.',
      mode: mode || 'unknown'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in zero280 streaming API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
