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

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Tool definitions for Claude
const TOOLS = [
  {
    name: 'create_artifact',
    description: 'Creates new code/content artifacts in the project',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string' as const,
          description: 'Name of the artifact to create'
        },
        type: {
          type: 'string' as const,
          enum: ['file', 'component', 'function', 'class', 'interface', 'type', 'html', 'markdown', 'json', 'mindmap'],
          description: 'Type of artifact to create'
        },
        content: {
          type: 'string' as const,
          description: 'Content/code for the artifact'
        },
        description: {
          type: 'string' as const,
          description: 'Description of the artifact (optional)'
        },
        tags: {
          type: 'array' as const,
          items: { type: 'string' as const },
          description: 'Tags for the artifact (optional)'
        },
        path: {
          type: 'string' as const,
          description: 'File path where to create the artifact (optional)'
        }
      },
      required: ['name', 'type', 'content']
    }
  },
  {
    name: 'update_artifact',
    description: 'Modifies existing artifacts in the project',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string' as const,
          description: 'Name of the artifact to update'
        },
        path: {
          type: 'string' as const,
          description: 'File path of the artifact to update'
        },
        changes: {
          type: 'object' as const,
          description: 'Object describing what changes to make'
        },
        newContent: {
          type: 'string' as const,
          description: 'New content to replace the existing content'
        },
        description: {
          type: 'string' as const,
          description: 'New description for the artifact (optional)'
        },
        tags: {
          type: 'array' as const,
          items: { type: 'string' as const },
          description: 'New tags for the artifact (optional)'
        }
      },
      required: ['name', 'path']
    }
  },
  {
    name: 'read_file',
    description: 'Reads files from the project to understand current state',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string' as const,
          description: 'File path to read'
        },
        startLine: {
          type: 'number' as const,
          description: 'Starting line number (optional)'
        },
        endLine: {
          type: 'number' as const,
          description: 'Ending line number (optional)'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'write_file',
    description: 'Writes or modifies project files',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string' as const,
          description: 'File path to write to'
        },
        content: {
          type: 'string' as const,
          description: 'Content to write to the file'
        },
        mode: {
          type: 'string' as const,
          enum: ['create', 'overwrite', 'append'],
          default: 'overwrite',
          description: 'How to handle existing file'
        }
      },
      required: ['path', 'content']
    }
  }
];

// Tool execution functions
async function executeTool(toolName: string, input: any): Promise<{ success: boolean; result: any; error?: string }> {
  try {
    switch (toolName) {
      case 'create_artifact':
        return await createArtifact(input);
      case 'update_artifact':
        return await updateArtifact(input);
      case 'read_file':
        return await readFile(input);
      case 'write_file':
        return await writeFile(input);
      default:
        return { success: false, result: null, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return { 
      success: false, 
      result: null, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function createArtifact(input: any): Promise<{ success: boolean; result: any; error?: string }> {
  try {
    const { name, type, content, description, tags, path: filePath } = input;
    
    // Create artifact in the storage system
    const artifactId = await artifactStorage.saveArtifact({
      title: name,
      type,
      content,
      rawData: type === 'mindmap' ? JSON.parse(content) : undefined
    });
    
    // Also create the actual file if path is specified
    if (filePath) {
      try {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        
        // Write the file
        await fs.writeFile(filePath, content, 'utf8');
      } catch (fileError) {
        console.warn('Failed to create file, but artifact was saved:', fileError);
      }
    }
    
    return {
      success: true,
      result: {
        message: `Successfully created ${type} artifact: ${name}`,
        artifactId,
        path: filePath || 'No file path specified',
        type,
        name
      }
    };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : 'Failed to create artifact'
    };
  }
}

async function updateArtifact(input: any): Promise<{ success: boolean; result: any; error?: string }> {
  try {
    const { name, path: filePath, changes, newContent, description, tags } = input;
    
    if (!filePath) {
      return { success: false, result: null, error: 'File path is required for updates' };
    }
    
    // Try to find existing artifact by title or path
    let existingArtifact = await artifactStorage.getArtifactByTitle(name);
    
    if (!existingArtifact) {
      // Try to read the file and create artifact if it doesn't exist
      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const artifactId = await artifactStorage.saveArtifact({
          title: name,
          type: 'file',
          content: fileContent
        });
        existingArtifact = await artifactStorage.getArtifact(artifactId);
      } catch (readError) {
        return { success: false, result: null, error: 'File not found and no existing artifact to update' };
      }
    }
    
    if (!existingArtifact) {
      return { success: false, result: null, error: 'Artifact not found' };
    }
    
    // Update the artifact
    const updateData: any = {};
    if (newContent) updateData.content = newContent;
    if (description) updateData.description = description;
    if (tags) updateData.tags = tags;
    
    if (Object.keys(updateData).length > 0) {
      await artifactStorage.updateArtifact(existingArtifact.metadata.id, updateData);
    }
    
    // Update the actual file if content changed
    if (newContent) {
      try {
        await fs.writeFile(filePath, newContent, 'utf8');
      } catch (fileError) {
        console.warn('Failed to update file, but artifact was updated:', fileError);
      }
    }
    
    return {
      success: true,
      result: {
        message: `Successfully updated artifact: ${name}`,
        artifactId: existingArtifact.metadata.id,
        path: filePath,
        changes: changes || 'Content and metadata updated'
      }
    };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : 'Failed to update artifact'
    };
  }
}

async function readFile(input: any): Promise<{ success: boolean; result: any; error?: string }> {
  try {
    const { path: filePath, startLine, endLine } = input;
    
    if (!filePath) {
      return { success: false, result: null, error: 'File path is required' };
    }
    
    // Read file content
    const content = await fs.readFile(filePath, 'utf8');
    
    let result: any = { content, path: filePath, totalLines: content.split('\n').length };
    
    // If line range specified, extract subset
    if (startLine !== undefined || endLine !== undefined) {
      const lines = content.split('\n');
      const start = startLine || 1;
      const end = endLine || lines.length;
      const selectedLines = lines.slice(start - 1, end);
      result = {
        ...result,
        content: selectedLines.join('\n'),
        startLine: start,
        endLine: end,
        selectedLines: selectedLines.length
      };
    }
    
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : 'Failed to read file'
    };
  }
}

async function writeFile(input: any): Promise<{ success: boolean; result: any; error?: string }> {
  try {
    const { path: filePath, content, mode = 'overwrite' } = input;
    
    if (!filePath) {
      return { success: false, result: null, error: 'File path is required' };
    }
    
    let finalContent = content;
    
    if (mode === 'append') {
      // Read existing content and append
      try {
        const existingContent = await fs.readFile(filePath, 'utf8');
        finalContent = existingContent + '\n' + content;
      } catch (readError) {
        // File doesn't exist, create new
        finalContent = content;
      }
    } else if (mode === 'create') {
      // Check if file exists
      try {
        await fs.access(filePath);
        return { success: false, result: null, error: 'File already exists. Use overwrite mode to replace.' };
      } catch {
        // File doesn't exist, proceed with creation
      }
    }
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write the file
    await fs.writeFile(filePath, finalContent, 'utf8');
    
    return {
      success: true,
      result: {
        message: `Successfully ${mode === 'append' ? 'appended to' : 'wrote'} file: ${filePath}`,
        path: filePath,
        mode,
        contentLength: content.length
      }
    };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : 'Failed to write file'
    };
  }
}

function getExtensionForType(type: string): string {
  switch (type) {
    case 'component': return 'tsx';
    case 'function': return 'ts';
    case 'class': return 'ts';
    case 'interface': return 'ts';
    case 'type': return 'ts';
    case 'file': return 'txt';
    default: return 'ts';
  }
}

// Base system prompt with function calling capabilities
const BASE_SYSTEM_PROMPT = `You are an expert AI agent with access to powerful tools for creating and modifying code and content. You can:

1. **Create new artifacts** - Generate new components, functions, classes, interfaces, and files
2. **Update existing code** - Modify and improve existing code and content
3. **Read project files** - Understand the current state of the project
4. **Write files** - Create or modify project files

When you need to perform actions, use the available tools. Always explain what you're doing and why before using tools.

IMPORTANT: When using tools, be precise and thorough. Always check the current state before making changes, and ensure your modifications are correct and well-structured.`;

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    
    if (!body.message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: 'Anthropic API key is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle conversation management
    let conversationId = body.conversation_id;
    
    if (!conversationId) {
      const title = ConversationStore.generateTitle(body.message);
      const conversation = await ConversationStore.createConversation(title);
      conversationId = conversation.id;
    } else {
      const existingConversation = await ConversationStore.getConversation(conversationId);
      if (!existingConversation) {
        return new Response(JSON.stringify({ error: 'Conversation not found. Please start a new chat.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Save user message to database
    await ConversationStore.addMessage({
      conversation_id: conversationId,
      role: 'user',
      content: body.message,
    });

    // Load conversation history for context
    const conversationHistory = await ConversationStore.getRecentMessages(conversationId, 20);
    
    // Build conversation context
    const conversationContext = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get current conversation context from chat store
          const chatStore = useChatStore.getState();
          const context = chatStore.getContextForRouting();
          
          // Prepare messages for Claude
          const messages = [];
          
          if (conversationContext) {
            messages.push({
              role: 'user' as const,
              content: `Previous conversation context:\n${conversationContext}\n\nCurrent message: ${body.message}`,
            });
          } else {
            messages.push({
              role: 'user' as const,
              content: body.message,
            });
          }

          // Create Claude stream with tools
          const claudeStream = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            system: BASE_SYSTEM_PROMPT,
            messages,
            tools: TOOLS,
            stream: true,
          });

          let fullMessage = '';
          let toolCalls: any[] = [];
          
          for await (const chunk of claudeStream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              fullMessage += chunk.delta.text;
              
              // Send the text chunk
              const data = JSON.stringify({ content: chunk.delta.text });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
            }
            
            if (chunk.type === 'message_stop') {
              // Execute all tool calls
              if (toolCalls.length > 0) {
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                  toolExecution: { 
                    status: 'starting', 
                    toolCount: toolCalls.length 
                  } 
                })}\n\n`));
                
                for (const toolCall of toolCalls) {
                  try {
                    // Execute the tool
                    const result = await executeTool(toolCall.name, toolCall.input);
                    
                    // Send tool execution result
                    const toolResult = JSON.stringify({
                      toolExecution: {
                        toolId: toolCall.id,
                        toolName: toolCall.name,
                        success: result.success,
                        result: result.result,
                        error: result.error
                      }
                    });
                    controller.enqueue(new TextEncoder().encode(`data: ${toolResult}\n\n`));
                    
                    // If tool execution was successful, Claude can use the result
                    if (result.success) {
                      // Send tool result back to Claude for potential follow-up
                      const toolResultMessage = JSON.stringify({
                        toolResult: {
                          toolUseId: toolCall.id,
                          content: [
                            {
                              type: 'text',
                              text: `Tool ${toolCall.name} executed successfully: ${JSON.stringify(result.result)}`
                            }
                          ]
                        }
                      });
                      controller.enqueue(new TextEncoder().encode(`data: ${toolResultMessage}\n\n`));
                    }
                  } catch (error) {
                    const errorResult = JSON.stringify({
                      toolExecution: {
                        toolId: toolCall.id,
                        toolName: toolCall.name,
                        success: false,
                        error: error instanceof Error ? error.message : 'Tool execution failed'
                      }
                    });
                    controller.enqueue(new TextEncoder().encode(`data: ${errorResult}\n\n`));
                  }
                }
                
                // Send completion status
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ 
                  toolExecution: { 
                    status: 'completed', 
                    toolCount: toolCalls.length 
                  } 
                })}\n\n`));
              }
              
              // Save AI response to database
              try {
                await ConversationStore.addMessage({
                  conversation_id: conversationId,
                  role: 'assistant',
                  content: fullMessage,
                });
                
                // Update conversation title if this is the first AI response
                if (conversationHistory.length === 1) {
                  const title = ConversationStore.generateTitle(body.message);
                  await ConversationStore.updateConversationTitle(conversationId, title);
                }
              } catch (error) {
                console.error('Failed to save AI response:', error);
              }
              
              // Send conversation ID in final response
              const conversationData = JSON.stringify({ conversation_id: conversationId });
              controller.enqueue(new TextEncoder().encode(`data: ${conversationData}\n\n`));
              
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              controller.close();
              return;
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
          const errorData = JSON.stringify({ error: errorMessage });
          controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}