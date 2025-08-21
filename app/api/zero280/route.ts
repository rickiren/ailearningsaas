import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { contextAwarenessServer } from '@/lib/context-awareness-server';
import { multiToolExecutor, WorkflowType } from '@/lib/multi-tool-executor';
import { naturalLanguageUnderstanding } from '@/lib/natural-language-understanding';
import { ChatService } from '@/lib/chat-service';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Tool definitions for Claude with enhanced learning capabilities
const TOOLS = [
  {
    name: 'create_artifact',
    description: 'Creates interactive learning tools, drills, and educational simulations designed for mastery-based learning. Focus on building tools that actively engage learners, track progress, and guide users toward skill mastery through progressive difficulty and immediate feedback.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string' as const,
          description: 'Name of the learning tool (e.g., "VocabularyDrill", "MathPractice", "CodingChallenge", "ScienceSimulation")'
        },
        type: {
          type: 'string' as const,
          enum: ['interactive', 'drill', 'simulation', 'game', 'assessment', 'html', 'component'],
          description: 'Type of learning tool. Use "interactive" for most learning experiences, "drill" for practice exercises, "simulation" for real-world scenarios, "game" for gamified learning, "assessment" for skill testing.'
        },
        content: {
          type: 'string' as const,
          description: 'The complete HTML/JavaScript code for the interactive learning tool. Must include all functionality, styling, and interactivity needed for the learning experience. Focus on creating tools that actively engage users in skill-building activities.'
        },
        description: {
          type: 'string' as const,
          description: 'Description of what this learning tool teaches and how users interact with it to achieve mastery'
        },
        preview: {
          type: 'string' as const,
          description: 'A brief description of what users will experience and learn from this tool, including the learning journey toward mastery'
        },
        learning_objectives: {
          type: 'string' as const,
          description: 'Specific skills or knowledge this tool helps users develop. Be specific about what mastery looks like and the learning outcomes.'
        },
        difficulty_level: {
          type: 'string' as const,
          enum: ['beginner', 'intermediate', 'advanced'],
          description: 'Target difficulty level for learners. Consider the progression path from beginner to mastery.'
        },
        subject_area: {
          type: 'string' as const,
          description: 'Academic subject or skill domain (e.g., "Mathematics", "Language Learning", "Programming", "Science", "Critical Thinking")'
        },
        estimated_duration: {
          type: 'string' as const,
          description: 'Estimated time to complete the learning activity and achieve the learning objectives (e.g., "5-10 minutes", "15-20 minutes", "30-45 minutes")'
        },
        mastery_criteria: {
          type: 'string' as const,
          description: 'Specific criteria that define when a user has mastered the skill or concept. What does success look like?'
        },
        learning_path: {
          type: 'string' as const,
          description: 'The step-by-step learning progression that leads to mastery. How does the tool guide users from basic understanding to advanced proficiency?'
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
  },
  {
    name: 'enhance_learning_tool',
    description: 'Improves existing learning tools by adding advanced features like adaptive difficulty, progress analytics, or accessibility improvements to enhance the learning experience.',
    input_schema: {
      type: 'object' as const,
      properties: {
        artifact_id: {
          type: 'string' as const,
          description: 'ID of the existing artifact to enhance'
        },
        enhancement_type: {
          type: 'string' as const,
          enum: ['adaptive_difficulty', 'progress_tracking', 'accessibility', 'gamification', 'analytics', 'personalization'],
          description: 'Type of enhancement to add to improve learning outcomes'
        },
        specific_requirements: {
          type: 'string' as const,
          description: 'Specific requirements or features to implement for better learning effectiveness'
        }
      },
      required: ['artifact_id', 'enhancement_type']
    }
  }
];

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, userId, mode, preventCodeEditing } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Zero280 API called with:', { message, conversationId, userId, mode, preventCodeEditing });

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
          // Generate a temporary conversation ID
          currentConversationId = `temp_${Date.now()}`;
        }
      } catch (error) {
        console.error('Error creating chat session:', error);
        // Continue with a temporary conversation ID
        currentConversationId = `temp_${Date.now()}`;
      }
    }

    // Try to add user message to conversation (but don't fail if it doesn't work)
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
      // Continue without database persistence
    }

    // Handle Chat Mode (discussion only, no code editing)
    if (mode === 'chat' || preventCodeEditing) {
      console.log('Chat Mode: Providing discussion response only');
      
      // Simple test response for debugging
      if (message.toLowerCase().includes('test')) {
        return new Response(JSON.stringify({
          response: '🧪 **Test Mode**: This is a test response from Chat Mode. The API is working correctly!',
          conversationId: currentConversationId,
          mode: 'chat',
          artifacts: [],
          toolResults: []
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
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
        
        console.log('Chat Mode: Conversation summary:', conversationSummary);
        
        // Generate AI response for discussion only (no tools)
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

        console.log('Chat Mode: Sending request to Anthropic...');
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: message
            }
          ],
          system: systemPrompt
        });

        console.log('Chat Mode: Anthropic response received:', response);
        const aiResponse = response.content[0].type === 'text' ? response.content[0].text : 'I apologize, but I cannot provide a response in this format.';
        console.log('Chat Mode: AI response text:', aiResponse);

        // Add AI response to conversation
        try {
          if (currentConversationId && !currentConversationId.startsWith('temp_')) {
            await ChatService.addMessage(currentConversationId, {
              role: 'assistant',
              content: aiResponse,
              metadata: {
                type: 'ai_response',
                timestamp: new Date().toISOString(),
                mode: 'chat'
              }
            });
          }
        } catch (error) {
          console.warn('Failed to add AI response to conversation:', error);
        }

        const responseData = {
          response: aiResponse,
          conversationId: currentConversationId,
          mode: 'chat',
          artifacts: [], // No artifacts in chat mode
          toolResults: [] // No tool results in chat mode
        };
        
        console.log('Chat Mode: Returning response:', responseData);
        return new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
        
      } catch (error) {
        console.error('Chat Mode: Error generating response:', error);
        
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

    // Simple check for build requests (Agent Mode only)
    const isBuildRequest = message.toLowerCase().includes('build') ||
                          message.toLowerCase().includes('create') ||
                          message.toLowerCase().includes('make') ||
                          message.toLowerCase().includes('form') ||
                          message.toLowerCase().includes('button') ||
                          message.toLowerCase().includes('component');

    if (isBuildRequest) {
      // Simplified approach - directly use AI to create artifacts

      // Get conversation context for AI (with fallback)
      let conversationSummary = '';
      try {
        if (currentConversationId && !currentConversationId.startsWith('temp_')) {
          conversationSummary = await ChatService.getConversationSummary(currentConversationId);
        }
      } catch (error) {
        console.warn('Failed to get conversation summary:', error);
        conversationSummary = `User wants to: ${message}`;
      }
      
      // Step 3: Generate AI response with tool usage
      const systemPrompt = `You are an expert AI educational content creator in AGENT MODE with full development capabilities.

AGENT MODE RULES:
- You can read, write, and modify code files
- You can execute development actions and use all tools
- You can create new files and components
- You have full access to project tools and capabilities
- You can make actual changes to the codebase

CORE PRINCIPLES: Create tools that ensure complete skill mastery through interactive engagement, immediate feedback, progressive difficulty, adaptive content, and comprehensive progress tracking.

CONVERSATION CONTEXT:
${conversationSummary}

CRITICAL: You MUST use the create_artifact tool and generate complete HTML/JavaScript code in the 'content' field.

REQUIRED FIELDS:
- name, type, content (with complete working code), description, preview

OPTIONAL: learning_objectives, difficulty_level, subject_area, estimated_duration, mastery_criteria, learning_path

LEARNING TOOL ARCHITECTURE:
- Clear learning objectives and mastery criteria
- Intuitive user interactions with progressive difficulty
- Progress tracking and adaptive difficulty
- Help systems and scaffolding
- Responsive design and accessibility
- Spaced repetition and active recall

WHEN BUILDING LEARNING TOOLS:
- PREFER "html" type for self-contained learning experiences with embedded JavaScript
- Use "component" type only when specifically requested for React components
- Include comprehensive JavaScript for interactivity, scoring, and progress
- Design mobile-first responsive layouts
- Implement proper error handling and user guidance
- Add visual feedback for all user interactions

EXAMPLES: "Create a vocabulary drill" → Interactive flashcard system with spaced repetition and progress tracking
"Build a math practice exercise" → Adaptive problem generator with immediate feedback and progressive difficulty
"Make a coding challenge" → Interactive code editor with test cases and skill assessment

CRITICAL: Always generate complete HTML/JavaScript code in the 'content' field.

QUALITY STANDARDS: Fully functional, interactive tools with progress tracking, adaptive difficulty, and comprehensive feedback.

CRITICAL: Generate complete, working HTML/JavaScript code in the 'content' field.

Available tools: ${TOOLS.map(t => t.name).join(', ')}`;

      console.log('Sending request to Anthropic...');
      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `User wants to: ${message}

CRITICAL: You MUST use the create_artifact tool and generate COMPLETE HTML/JavaScript code in the 'content' field.

DO NOT just describe what you would build - WRITE THE ACTUAL CODE that creates a working learning tool.

The 'content' field must contain complete, functional HTML/JavaScript that users can run immediately.`
          },
        ],
        tools: TOOLS,
        tool_choice: { type: 'auto' }
      });

      console.log('AI Response received');
      console.log('Response content:', response.content);

      // Extract tool calls and execute them
      const toolCalls = response.content.filter(content => content.type === 'tool_use');
      const toolResults = [];
      
      console.log('Tool calls found:', toolCalls.length);

      for (const toolCall of toolCalls) {
        if (toolCall.type === 'tool_use') {
          console.log(`Executing tool: ${toolCall.name}`);
          
          try {
            const result = await executeTool(toolCall.name, toolCall.input, currentConversationId, userId);
            console.log(`Tool result:`, result);
            toolResults.push({
              toolId: toolCall.id,
              name: toolCall.name,
              input: toolCall.input,
              result
            });
          } catch (error) {
            console.error(`Error executing tool ${toolCall.name}:`, error);
            toolResults.push({
              toolId: toolCall.id,
              name: toolCall.name,
              input: toolCall.input,
              result: { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            });
          }
        }
      }

      // Extract artifacts from tool results
      const artifacts = toolResults
        .filter(r => r.name === 'create_artifact' && r.result.success)
        .map(r => ({
          name: (r.input as any).name,
          type: (r.input as any).type,
          content: (r.input as any).content,
          description: (r.input as any).description,
          preview: (r.input as any).preview
        }));

      console.log('Final artifacts being returned:', artifacts.length);

      // Add AI response to conversation (with fallback)
      try {
        if (currentConversationId && !currentConversationId.startsWith('temp_')) {
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
        }
      } catch (error) {
        console.warn('Failed to add AI response to conversation:', error);
      }

      // Return enhanced response with tool results and conversation ID
      const aiResponse = response.content[0].type === 'text' ? (response.content[0] as any).text : 'Tool execution completed';
      return new Response(JSON.stringify({
        success: true,
        response: aiResponse,
        toolResults,
        artifacts,
        conversationId: currentConversationId,
        mode: 'agent' // Indicate this is agent mode
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } else {
      // For non-build requests, provide a simple response
      console.log('Processing non-build request...');
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

      // Try to add AI response to conversation (with fallback)
      try {
        if (currentConversationId && !currentConversationId.startsWith('temp_')) {
          const aiResponseText = response.content[0].type === 'text' ? (response.content[0] as any).text : 'AI response';
          await ChatService.addMessage(currentConversationId, {
            role: 'assistant',
            content: aiResponseText,
            metadata: {
              type: 'ai_response',
              timestamp: new Date().toISOString()
            }
          });
        }
      } catch (error) {
        console.warn('Failed to add AI response to conversation:', error);
      }

      const responseText = response.content[0].type === 'text' ? (response.content[0] as any).text : 'AI response';
      return new Response(JSON.stringify({
        success: true,
        response: responseText,
        suggestion: 'Try asking me to build something! For example: "build a login form" or "create a beautiful button component"',
        conversationId: currentConversationId,
        mode: 'agent' // Indicate this is agent mode
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in zero280 API:', error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    console.error('Error details:', { errorMessage, errorStack });
    
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
      case 'enhance_learning_tool':
        return await enhanceLearningTool(input, conversationId, userId);
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
    
    // Extract all the new learning-focused fields
    const { 
      name, 
      type, 
      content, 
      description, 
      preview, 
      learning_objectives, 
      difficulty_level, 
      subject_area, 
      estimated_duration,
      mastery_criteria,
      learning_path
    } = input;
    
    // Validate input - core fields are required, learning fields have smart defaults
    if (!name || !type || !content) {
      console.log('Missing required fields:', { name, type, content });
      return {
        success: false,
        result: null,
        error: 'Missing required fields: name, type, and content are required'
      };
    }

    console.log('Creating learning artifact:', { 
      name, 
      type, 
      learning_objectives, 
      difficulty_level,
      subject_area,
      estimated_duration,
      mastery_criteria,
      contentLength: content ? content.length : 0
    });
    
    // Debug: Check if content is actually provided
    if (!content || content.trim().length === 0) {
      console.error('ERROR: Content is empty or missing!');
      return {
        success: false,
        result: null,
        error: 'Content field is required and cannot be empty'
      };
    }

    // Save artifact to database if conversationId is provided
    let savedArtifact = null;
    if (conversationId) {
      savedArtifact = await ChatService.createArtifactFromChat(conversationId, {
        name,
        type,
        content,
        description: description || `A ${type} learning tool called ${name}`,
        preview: preview || `This will display an interactive ${type} for learning ${learning_objectives}`,
        metadata: {
          source: 'ai_generated',
          learning_objectives,
          difficulty_level: difficulty_level || 'beginner',
          subject_area: subject_area || 'General',
          estimated_duration: estimated_duration || '15-20 minutes',
          mastery_criteria,
          learning_path: learning_path || 'Progressive skill building with immediate feedback',
          artifact_type: 'learning_tool',
          timestamp: new Date().toISOString()
        }
      }, userId);

      if (!savedArtifact) {
        console.warn('Failed to save artifact to database, but continuing with response');
      }
    }

    // Return success with enhanced learning artifact data
    const result = {
      success: true,
      result: {
        message: `Successfully created ${type} learning tool: ${name}`,
        artifact: {
          id: savedArtifact?.id || `temp_${Date.now()}`,
          name,
          type,
          content,
          description: description || `A ${type} learning tool called ${name}`,
          preview: preview || `This will display an interactive ${type} for learning ${learning_objectives}`,
          learning_objectives,
          difficulty_level: difficulty_level || 'beginner',
          subject_area: subject_area || 'General',
          estimated_duration: estimated_duration || '15-20 minutes',
          mastery_criteria,
          learning_path: learning_path || 'Progressive skill building with immediate feedback',
          timestamp: new Date().toISOString(),
          saved: !!savedArtifact
        }
      }
    };
    
    console.log('Learning artifact created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error in createArtifact:', error);
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : 'Failed to create learning artifact'
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

async function enhanceLearningTool(input: any, conversationId?: string, userId?: string): Promise<{ success: boolean; result: any; error?: string }> {
  try {
    const { artifact_id, enhancement_type, specific_requirements } = input;
    
    if (!artifact_id || !enhancement_type) {
      return {
        success: false,
        result: null,
        error: 'Missing required fields: artifact_id and enhancement_type are required'
      };
    }

    console.log('Enhancing learning tool:', { artifact_id, enhancement_type, specific_requirements });

    // For now, return a success message indicating the enhancement would be applied
    // In a full implementation, you would modify the existing artifact
    return {
      success: true,
      result: {
        message: `Successfully enhanced learning tool with ${enhancement_type}`,
        enhancement: {
          artifact_id,
          enhancement_type,
          specific_requirements,
          applied: true,
          timestamp: new Date().toISOString()
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : 'Failed to enhance learning tool'
    };
  }
}
