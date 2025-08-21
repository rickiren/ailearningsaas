import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { ChatRequest } from '@/types/chat';
import { ConversationStore } from '@/lib/conversation-store';
import { classifyUserIntent } from '@/lib/intent-classifier';
import { routeIntent, testResponseRouting } from '@/lib/response-router';
import { useChatStore } from '@/lib/chat-store';
import { promises as fs } from 'fs';
import path from 'path';
import { artifactStorage } from '@/lib/artifact-storage';
import { ChatMode, getModeSystemPrompt, isToolAllowed } from '@/lib/chat-modes';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// All available tools (will be filtered based on mode)
const ALL_TOOLS = [
  {
    name: 'create_artifact',
    description: 'Creates new code/content artifacts in the project',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string' as const, description: 'Name of the artifact to create' },
        type: {
          type: 'string' as const,
          enum: ['file', 'component', 'function', 'class', 'interface', 'type', 'html', 'markdown', 'json', 'mindmap'],
          description: 'Type of artifact to create'
        },
        content: { type: 'string' as const, description: 'Content/code for the artifact' },
        description: { type: 'string' as const, description: 'Description of the artifact (optional)' },
        tags: {
          type: 'array' as const,
          items: { type: 'string' as const },
          description: 'Tags for the artifact (optional)'
        },
        path: { type: 'string' as const, description: 'File path where to create the artifact (optional)' }
      },
      required: ['name', 'type', 'content']
    }
  },
  {
    name: 'update_artifact',
    description: 'Updates existing artifacts with new content',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string' as const, description: 'ID of the artifact to update' },
        content: { type: 'string' as const, description: 'New content for the artifact' },
        description: { type: 'string' as const, description: 'Updated description (optional)' }
      },
      required: ['id', 'content']
    }
  }
];

// Read-only tools for chat mode
const READ_ONLY_TOOLS = [
  {
    name: 'explain_code',
    description: 'Explains code concepts and provides theoretical guidance',
    input_schema: {
      type: 'object' as const,
      properties: {
        concept: { type: 'string' as const, description: 'Code concept to explain' },
        context: { type: 'string' as const, description: 'Additional context for the explanation' }
      },
      required: ['concept']
    }
  }
];

// Filter tools based on chat mode
function getToolsForMode(mode: ChatMode) {
  if (mode === 'chat') {
    // In chat mode, only allow read-only/discussion tools
    return READ_ONLY_TOOLS;
  }
  
  // In agent mode, allow all tools
  return ALL_TOOLS;
}

// Generate mode-specific system message
function generateModeAwareSystemMessage(mode: ChatMode, baseSystemMessage: string): string {
  const modePrompt = getModeSystemPrompt(mode);
  
  return `${baseSystemMessage}

${modePrompt}

CURRENT MODE: ${mode.toUpperCase()}
MODE BEHAVIOR: ${mode === 'chat' ? 'DISCUSSION ONLY - NO CODE MODIFICATIONS' : 'FULL AGENT CAPABILITIES ENABLED'}

Remember to respect the mode restrictions throughout the entire conversation.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message, 
      conversationId, 
      mode = 'chat' as ChatMode,  // Default to chat mode for safety
      systemPrompt,
      allowedTools,
      restrictions
    }: ChatRequest & { 
      mode?: ChatMode;
      systemPrompt?: string;
      allowedTools?: string[];
      restrictions?: string[];
    } = body;

    if (!message?.trim()) {
      return new Response('Message is required', { status: 400 });
    }

    // Load conversation history
    const conversationStore = new ConversationStore();
    const conversation = await conversationStore.getConversation(conversationId);
    
    if (!conversation) {
      return new Response('Conversation not found', { status: 404 });
    }

    // Get mode-appropriate tools
    const availableTools = getToolsForMode(mode);
    
    // Create mode-aware system message
    const baseSystemMessage = `You are an AI Learning Path Assistant specialized in creating educational content and learning resources.

Your primary role is to help users create structured learning paths, courses, and educational materials. You excel at:
- Creating comprehensive learning curricula
- Designing step-by-step educational content
- Building interactive learning experiences
- Generating educational artifacts like mind maps, code examples, and documentation
- Providing personalized learning recommendations

Always aim to create engaging, well-structured educational content that guides learners through complex topics systematically.`;

    const modeAwareSystemMessage = generateModeAwareSystemMessage(mode, baseSystemMessage);

    // Prepare messages with mode context
    const messages = [
      { role: 'user' as const, content: message }
    ];

    // Add conversation history (respecting mode)
    if (conversation.messages && conversation.messages.length > 0) {
      const recentMessages = conversation.messages.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
      messages.unshift(...recentMessages);
    }

    // Log mode for debugging
    console.log(`🤖 Processing message in ${mode.toUpperCase()} mode`);
    console.log(`📋 Available tools: ${availableTools.map(t => t.name).join(', ') || 'none'}`);

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send mode acknowledgment
          const modeAck = {
            type: 'mode_status',
            mode: mode,
            tools_available: availableTools.length,
            timestamp: new Date().toISOString()
          };
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(modeAck)}\n\n`)
          );

          // Send initial progress
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'progress', 
              stage: 'connecting',
              mode: mode
            })}\n\n`)
          );

          // Make API call with mode-specific configuration
          const anthropicStream = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            temperature: 0.7,
            system: modeAwareSystemMessage,
            messages,
            tools: availableTools.length > 0 ? availableTools : undefined,
            stream: true,
          });

          let fullResponse = '';
          let toolExecutions: any[] = [];

          for await (const chunk of anthropicStream) {
            // Mode validation for tool usage
            if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
              const toolName = chunk.content_block.name;
              
              if (!isToolAllowed(toolName, mode)) {
                // Block unauthorized tool usage
                const errorMsg = {
                  type: 'error',
                  error: `Tool "${toolName}" not allowed in ${mode} mode`,
                  suggestion: mode === 'chat' ? 'Switch to Agent Mode to use modification tools' : null
                };
                
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(errorMsg)}\n\n`)
                );
                continue;
              }
            }

            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              fullResponse += chunk.delta.text;
              
              // Send streaming text with mode context
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'text_delta',
                  delta: { text: chunk.delta.text },
                  mode: mode,
                  restrictions: mode === 'chat' ? ['read_only'] : []
                })}\n\n`)
              );
            }
            
            // Handle tool execution (only in agent mode)
            if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
              if (mode === 'agent') {
                const toolExecution = {
                  type: 'tool_execution',
                  tool: chunk.content_block.name,
                  status: 'starting',
                  mode: mode
                };
                
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(toolExecution)}\n\n`)
                );
                
                toolExecutions.push({
                  id: chunk.content_block.id,
                  name: chunk.content_block.name,
                  input: chunk.content_block.input
                });
              }
            }
          }

          // Execute tools (only in agent mode)
          if (mode === 'agent' && toolExecutions.length > 0) {
            for (const tool of toolExecutions) {
              try {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'tool_execution',
                    tool: tool.name,
                    status: 'executing',
                    mode: mode
                  })}\n\n`)
                );

                // Execute tool based on name
                let result;
                if (tool.name === 'create_artifact') {
                  result = await handleCreateArtifact(tool.input, conversationId);
                } else if (tool.name === 'update_artifact') {
                  result = await handleUpdateArtifact(tool.input);
                }

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'tool_execution',
                    tool: tool.name,
                    status: 'completed',
                    result,
                    mode: mode
                  })}\n\n`)
                );

              } catch (error) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'tool_execution',
                    tool: tool.name,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    mode: mode
                  })}\n\n`)
                );
              }
            }
          }

          // Save conversation with mode context
          await conversationStore.addMessage(conversationId, {
            content: message,
            role: 'user',
            metadata: { mode, timestamp: new Date().toISOString() }
          });

          await conversationStore.addMessage(conversationId, {
            content: fullResponse,
            role: 'assistant',
            metadata: { 
              mode, 
              tools_used: toolExecutions.map(t => t.name),
              timestamp: new Date().toISOString()
            }
          });

          // Send completion with mode info
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'complete',
              mode: mode,
              tools_executed: toolExecutions.length,
              message_length: fullResponse.length
            })}\n\n`)
          );

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

        } catch (error) {
          console.error('Streaming error:', error);
          
          const errorResponse = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            mode: mode,
            suggestion: 'Please try again or switch modes if needed'
          };
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorResponse)}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/stream-sent-events',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Tool handlers (only executed in agent mode)
async function handleCreateArtifact(input: any, conversationId: string) {
  const { name, type, content, description, tags, path } = input;
  
  const artifact = await artifactStorage.create({
    name,
    type,
    content,
    description,
    tags: tags || [],
    path,
    conversationId,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return {
    success: true,
    artifactId: artifact.id,
    message: `Created ${type} artifact: ${name}`
  };
}

async function handleUpdateArtifact(input: any) {
  const { id, content, description } = input;
  
  const artifact = await artifactStorage.update(id, {
    content,
    description,
    updatedAt: new Date()
  });

  return {
    success: true,
    artifactId: id,
    message: `Updated artifact: ${artifact.name}`
  };
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}