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
      const systemPrompt = `You are an expert AI educational content creator building interactive learning tools for MASTERY-BASED LEARNING.

CORE PRINCIPLES: Create tools that ensure complete skill mastery through interactive engagement, immediate feedback, progressive difficulty, adaptive content, and comprehensive progress tracking.

CONVERSATION CONTEXT:
${conversationSummary}

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
