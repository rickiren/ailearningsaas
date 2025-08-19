import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { contextAwarenessServer } from '@/lib/context-awareness-server';
import { multiToolExecutor, WorkflowType } from '@/lib/multi-tool-executor';
import { naturalLanguageUnderstanding } from '@/lib/natural-language-understanding';
import { ChatService } from '@/lib/chat-service';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Tool definitions for Claude with enhanced capabilities
const TOOLS = [
  {
    name: 'create_artifact',
    description: 'Creates new code/content artifacts in the project. Use this to generate React components, HTML, or any code that should appear in the sandbox preview.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string' as const,
          description: 'Name of the artifact to create (e.g., "LoginForm", "Button", "LandingPage")'
        },
        type: {
          type: 'string' as const,
          enum: ['component', 'page', 'html', 'react', 'utility', 'style'],
          description: 'Type of artifact to create. Use "component" for React components, "html" for HTML content, "page" for full pages.'
        },
        content: {
          type: 'string' as const,
          description: 'The complete code/content for the artifact. For React components, include imports, component definition, and export. For HTML, include complete HTML structure.'
        },
        description: {
          type: 'string' as const,
          description: 'Description of what this artifact does and how it should be used'
        },
        preview: {
          type: 'string' as const,
          description: 'A brief description of what the user will see in the preview'
        }
      },
      required: ['name', 'type', 'content']
    }
  },
  {
    name: 'analyze_project',
    description: 'Analyzes the current project structure to understand context and existing patterns',
    input_schema: {
      type: 'object' as const,
      properties: {
        focus: {
          type: 'string' as const,
          description: 'What aspect of the project to focus on (e.g., "components", "structure", "patterns")'
        }
      }
    }
  },
  {
    name: 'read_multiple_files',
    description: 'Reads multiple project files to understand the current codebase and patterns',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_paths: {
          type: 'array' as const,
          items: { type: 'string' as const },
          description: 'Array of file paths to read for context'
        }
      },
      required: ['file_paths']
    }
  }
];

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, userId } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If no conversationId, create a new conversation
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const chatSession = await ChatService.createChatSession(message, userId);
      if (chatSession.conversation) {
        currentConversationId = chatSession.conversation.id;
      } else {
        return new Response(JSON.stringify({ error: 'Failed to create conversation' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Add user message to conversation
    await ChatService.addMessage(currentConversationId, {
      role: 'user',
      content: message,
      metadata: {
        type: 'user_request',
        timestamp: new Date().toISOString()
      }
    });

    // Simple check for build requests
    const isBuildRequest = message.toLowerCase().includes('build') ||
                          message.toLowerCase().includes('create') ||
                          message.toLowerCase().includes('make') ||
                          message.toLowerCase().includes('form') ||
                          message.toLowerCase().includes('button') ||
                          message.toLowerCase().includes('component');

    if (isBuildRequest) {
      // Simplified approach - directly use AI to create artifacts

      // Get conversation context for AI
      const conversationSummary = await ChatService.getConversationSummary(currentConversationId);
      
      // Step 3: Generate AI response with tool usage
      const systemPrompt = `You are an expert AI coding assistant building a live sandbox preview system. 

Your job is to:
1. Understand what the user wants to build
2. Use the create_artifact tool to generate working code
3. Create components that will actually render in the preview
4. Provide clear explanations of what you're building
5. Remember the conversation context and build upon previous artifacts

CONVERSATION CONTEXT:
${conversationSummary}

CRITICAL: You MUST use the create_artifact tool for every build request. Do not just describe what you would build - actually build it using the tool.

When using create_artifact:
- For React components, include complete imports, component definition, and export
- For HTML content, provide complete, valid HTML that can render immediately
- Always set the type to "component" for React components or "html" for HTML
- Include a clear description and preview of what the user will see
- Make sure the code is complete and functional
- Use the tool for EVERY component or piece of content you create
- Build upon previous artifacts in the conversation when appropriate

Example usage:
- User says "build a button" → Use create_artifact to create a Button component
- User says "create a form" → Use create_artifact to create a Form component
- User says "make a landing page" → Use create_artifact to create HTML content
- User says "add a header to the landing page" → Use create_artifact to create a header component that works with the existing page

Available tools: ${TOOLS.map(t => t.name).join(', ')}`;

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `User wants to: ${message}

IMPORTANT: You MUST use the create_artifact tool to actually build what they requested. Do not just describe it.

Please use the create_artifact tool to build what they requested. Make sure to:
1. Generate complete, working code
2. Set appropriate type (component for React, html for HTML)
3. Include all necessary imports and dependencies
4. Make it render properly in the preview
5. Explain what you built and how to use it

Remember: Use the create_artifact tool for EVERY piece of content you create.`
          },
        ],
        tools: TOOLS,
        tool_choice: { type: 'auto' }
      });

      console.log('AI Response:', JSON.stringify(response, null, 2));
      console.log('Response content:', response.content);

      // Extract tool calls and execute them
      const toolCalls = response.content.filter(content => content.type === 'tool_use');
      const toolResults = [];
      
      console.log('Tool calls found:', toolCalls.length);
      console.log('Tool calls:', JSON.stringify(toolCalls, null, 2));

      for (const toolCall of toolCalls) {
        if (toolCall.type === 'tool_use') {
          console.log(`Executing tool: ${toolCall.name} with input:`, toolCall.input);
          
          // For create_artifact tool, simulate building process
          if (toolCall.name === 'create_artifact') {
            // Simulate building delay
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          const result = await executeTool(toolCall.name, toolCall.input, currentConversationId, userId);
          console.log(`Tool result:`, result);
          toolResults.push({
            toolId: toolCall.id,
            name: toolCall.name,
            input: toolCall.input,
            result
          });
        }
      }

      // Extract artifacts from tool results
      const artifacts = toolResults.filter(r => r.name === 'create_artifact').map(r => ({
        name: r.input.name,
        type: r.input.type,
        content: r.input.content,
        description: r.input.description,
        preview: r.input.preview
      }));

      console.log('Final artifacts being returned:', artifacts);
      console.log('Tool results:', toolResults);

      // Add AI response to conversation
      const aiResponse = response.content[0].type === 'text' ? response.content[0].text : 'Tool execution completed';
      await ChatService.addMessage(currentConversationId, {
        role: 'assistant',
        content: aiResponse,
        metadata: {
          type: 'ai_response',
          artifacts_created: artifacts.length,
          timestamp: new Date().toISOString()
        }
      });

      // Return enhanced response with tool results and conversation ID
      return new Response(JSON.stringify({
        success: true,
        response: aiResponse,
        toolResults,
        artifacts,
        conversationId: currentConversationId
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } else {
      // For non-build requests, provide a simple response
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: 'You are a helpful AI assistant. For build requests, suggest using phrases like "build a login form" or "create a button component".',
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
      });

      return new Response(JSON.stringify({
        success: true,
        response: response.content[0].text,
        suggestion: 'Try asking me to build something! For example: "build a login form" or "create a beautiful button component"'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in zero280 API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Tool execution functions
async function executeTool(toolName: string, input: any, conversationId?: string, userId?: string): Promise<{ success: boolean; result: any; error?: string }> {
  try {
    switch (toolName) {
      case 'create_artifact':
        return await createArtifact(input, conversationId, userId);
      case 'analyze_project':
        return await analyzeProject(input);
      case 'read_multiple_files':
        return await readMultipleFiles(input);
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

async function createArtifact(input: any, conversationId?: string, userId?: string): Promise<{ success: boolean; result: any; error?: string }> {
  try {
    console.log('createArtifact called with input:', input);
    const { name, type, content, description, preview } = input;
    
    // Validate input
    if (!name || !type || !content) {
      console.log('Missing required fields:', { name, type, content });
      return {
        success: false,
        result: null,
        error: 'Missing required fields: name, type, and content are required'
      };
    }

    console.log('Creating artifact:', { name, type, content: content.substring(0, 100) + '...' });

    // Save artifact to database if conversationId is provided
    let savedArtifact = null;
    if (conversationId) {
      savedArtifact = await ChatService.createArtifactFromChat(conversationId, {
        name,
        type,
        content,
        description: description || `A ${type} called ${name}`,
        preview: preview || `This will display a ${type} called ${name}`,
        metadata: {
          source: 'ai_generated',
          timestamp: new Date().toISOString()
        }
      }, userId);

      if (!savedArtifact) {
        console.warn('Failed to save artifact to database, but continuing with response');
      }
    }

    // Return success with artifact data
    const result = {
      success: true,
      result: {
        message: `Successfully created ${type} artifact: ${name}`,
        artifact: {
          id: savedArtifact?.id || `temp_${Date.now()}`,
          name,
          type,
          content,
          description: description || `A ${type} called ${name}`,
          preview: preview || `This will display a ${type} called ${name}`,
          timestamp: new Date().toISOString(),
          saved: !!savedArtifact
        }
      }
    };
    
    console.log('Artifact created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error in createArtifact:', error);
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : 'Failed to create artifact'
    };
  }
}

async function analyzeProject(input: any): Promise<{ success: boolean; result: any; error?: string }> {
  try {
    const context = await contextAwarenessServer.analyzeProject();
    return {
      success: true,
      result: {
        message: 'Project analysis completed',
        context
      }
    };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : 'Failed to analyze project'
    };
  }
}

async function readMultipleFiles(input: any): Promise<{ success: boolean; result: any; error?: string }> {
  try {
    const { file_paths } = input;
    
    if (!file_paths || !Array.isArray(file_paths)) {
      return {
        success: false,
        result: null,
        error: 'file_paths must be an array'
      };
    }

    const context = await contextAwarenessServer.readMultipleFiles(file_paths);
    return {
      success: true,
      result: {
        message: `Successfully read ${file_paths.length} files`,
        files: context
      }
    };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : 'Failed to read files'
    };
  }
}
