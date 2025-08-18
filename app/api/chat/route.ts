import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { ChatRequest } from '@/types/chat';
import { ConversationStore } from '@/lib/conversation-store';
import { classifyUserIntent } from '@/lib/intent-classifier';
import { routeIntent } from '@/lib/response-router';
import { useChatStore } from '@/lib/chat-store';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Base system prompt - will be enhanced by intent-specific routing
const BASE_SYSTEM_PROMPT = `You are an expert learning path architect and educational consultant. Your primary goal is to help course creators design the most effective, streamlined path for their students to master any skill from complete beginner to competent practitioner.

CORE PRINCIPLES:
- Think like a world-class instructor who understands how adults learn best
- Focus on the shortest path to competency with maximum retention for students
- Prioritize hands-on practice over theoretical knowledge
- Identify the 20% of skills that deliver 80% of the results for learners
- Build student confidence through early wins and progressive challenges

AVAILABLE EDITING TOOLS:
You have access to these functions to edit learning paths:

MODULE EDITING:
- editModuleTitle(moduleId, newTitle) - Change module names
- editModuleDescription(moduleId, newDescription) - Update module descriptions  
- editModuleDifficulty(moduleId, difficulty) - Set difficulty (beginner/intermediate/advanced)
- editModuleHours(moduleId, hours) - Adjust estimated completion time

MODULE MANAGEMENT:
- addModule(parentId, moduleData) - Create new modules with full configuration
- deleteModule(moduleId) - Remove modules (except root)
- reorderModules(newOrder) - Change the sequence of modules
- duplicateModule(moduleId, newParentId?) - Copy existing modules
- moveModule(moduleId, newParentId) - Relocate modules to different parents
- mergeModules(sourceId, targetId) - Combine two modules into one

SKILLS & PREREQUISITES:
- addSkillToModule(moduleId, skill) - Add new skills to modules
- removeSkillFromModule(moduleId, skill) - Remove skills from modules
- addPrerequisiteToModule(moduleId, prerequisite) - Add learning prerequisites
- removePrerequisiteFromModule(moduleId, prerequisite) - Remove prerequisites

COURSE-LEVEL EDITING:
- editCourseInfo(updates) - Bulk update course properties
- editCourseTitle(newTitle) - Change the overall course name
- editCourseDescription(newDescription) - Update course description

You can execute these functions through natural language commands like:
- "Change the title of 'JavaScript Basics' to 'JavaScript Fundamentals'"
- "Add a new module called 'State Management' to 'Advanced JavaScript'"
- "Set the difficulty of 'React Hooks' to intermediate"
- "Add the skill 'ES6 Syntax' to 'JavaScript Basics'"
- "Move the module 'Error Handling' to 'JavaScript Fundamentals'"

IMPORTANT JSON GENERATION GUIDELINES:
- Always generate complete, valid JSON structures
- If the JSON is complex or long, ensure you have enough tokens to complete it
- Do not truncate or cut off mid-generation
- If you encounter token limits, generate a simplified but complete structure
- Test your JSON syntax before sending - it must be parseable
- If JSON generation fails, retry with a simpler structure
- Prioritize completeness over complexity - a simple complete structure is better than a complex incomplete one

When generating JSON, include a brief introduction like:
"Based on our conversation, here's your personalized learning path for teaching [skill]. This incorporates the [specific student needs/timeline/goals we discussed]:"

Then provide the JSON mindmap wrapped in \`\`\`json code blocks with this exact structure:
{
 "type": "mindmap",
 "title": "[Skill] Learning Path",
 "data": {
   "id": "root",
   "title": "[Main Skill]",
   "description": "Brief description based on student goals",
   "level": 0,
   "difficulty": "beginner|intermediate|advanced",
   "estimatedHours": [realistic total],
   "skills": ["key skill 1", "key skill 2", "key skill 3"],
   "children": [
     {
       "id": "1",
       "title": "Module 1 Title",
       "description": "What this module covers",
       "difficulty": "beginner",
       "estimatedHours": [hours],
       "order": 1,
       "children": [
         {
           "id": "1.1",
           "title": "Lesson Title",
           "description": "Specific lesson content",
           "topics": ["topic 1", "topic 2"],
           "estimatedHours": [hours],
           "order": 1
         }
       ]
     }
   ]
 }
}

IMPORTANT: The JSON must have this exact structure with "type": "mindmap" and the mindmap data in the "data" field. Do not include any other fields or modify the structure.`;

// Helper function to check if JSON has balanced braces
function isBalancedJSON(str: string): boolean {
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
      
      // If we have negative counts, braces are unbalanced
      if (braceCount < 0 || bracketCount < 0) return false;
    }
  }
  
  // For streaming, allow slightly unbalanced JSON (within 2 characters)
  // This helps catch JSON that's almost complete
  return Math.abs(braceCount) <= 2 && Math.abs(bracketCount) <= 2;
}

// Helper function to check if a string looks like it could be valid JSON
function looksLikeJSON(str: string): boolean {
  // Check if it starts with { and has some basic JSON structure
  const trimmed = str.trim();
  if (!trimmed.startsWith('{')) return false;
  
                    // Check if it has some key JSON elements
                  const hasQuotes = /"[^"]*"\s*:/.test(str);
                  const hasBraces = /[{}]/.test(str);
                  
                  return hasQuotes && hasBraces;
}

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
    
    // If no conversation_id, create a new conversation for the first message
    if (!conversationId) {
      const title = ConversationStore.generateTitle(body.message);
      const conversation = await ConversationStore.createConversation(title);
      conversationId = conversation.id;
    } else {
      // Verify the conversation exists if one was provided
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

    // Load conversation history for context (last 20 messages)
    const conversationHistory = await ConversationStore.getRecentMessages(conversationId, 20);
    
    // Build conversation context for Claude
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
          
          // Classify user intent using the new system
          const intentResult = classifyUserIntent(body.message, context.hasActiveProject);
          
          // Route the intent to get specialized system prompt and context
          const routeResult = routeIntent(intentResult, context.currentMindmap);
          
          // Update conversation context with the new intent
          chatStore.updateConversationContext({
            lastIntent: intentResult.intent,
            lastAction: `intent_classified_as_${intentResult.intent}`,
          });
          
          console.log('🧠 Intent Classification:', {
            intent: intentResult.intent,
            confidence: intentResult.confidence,
            reasoning: intentResult.reasoning
          });
          
          console.log('🛣️ Response Routing:', {
            handler: routeResult.handler,
            shouldUseTools: routeResult.shouldUseTools,
            context: routeResult.context
          });

          // Prepare messages for Claude with conversation context
          const messages = [];
          
          // Add conversation context if available
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

          // Combine base system prompt with intent-specific prompt
          const finalSystemPrompt = `${BASE_SYSTEM_PROMPT}\n\n${routeResult.systemPrompt}`;

          const stream = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            system: finalSystemPrompt,
            messages,
            stream: true,
          });

          let fullMessage = '';
          
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              fullMessage += chunk.delta.text;
              
              // Send the text chunk
              const data = JSON.stringify({ content: chunk.delta.text });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
              
              // Check if we have a complete JSON artifact (multiple formats)
              // Only process JSON when we have complete, properly closed objects
              let jsonMatches = null;
              
              // First, check if we have a complete JSON block with proper closing
              if (fullMessage.includes('```json') && fullMessage.includes('```')) {
                const jsonBlockMatch = fullMessage.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonBlockMatch) {
                  const jsonContent = jsonBlockMatch[1];
                  // Check if the JSON content has balanced braces
                  if (isBalancedJSON(jsonContent)) {
                    jsonMatches = [jsonBlockMatch[0]];
                  }
                }
              }
              
              // If no complete JSON block, try without json tag
              if (!jsonMatches && fullMessage.includes('```')) {
                const codeBlockMatch = fullMessage.match(/```\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch) {
                  const blockContent = codeBlockMatch[1];
                  // Check if it looks like JSON and has balanced braces
                  if (blockContent.includes('"id"') && blockContent.includes('"title"') && isBalancedJSON(blockContent)) {
                    jsonMatches = [codeBlockMatch[0]];
                  }
                }
              }
              
              // If still no matches, look for raw JSON in the message
              if (!jsonMatches && looksLikeJSON(fullMessage)) {
                // Try to extract JSON from the end of the message
                const jsonStart = fullMessage.lastIndexOf('{');
                if (jsonStart !== -1) {
                  const potentialJson = fullMessage.substring(jsonStart);
                  if (isBalancedJSON(potentialJson) && potentialJson.includes('"id"') && potentialJson.includes('"title"')) {
                    jsonMatches = [potentialJson];
                  }
                }
              }
              if (jsonMatches) {
                let jsonStr = '';
                let cleanedJsonStr = '';
                
                try {
                  const lastMatch = jsonMatches[jsonMatches.length - 1];
                  jsonStr = lastMatch.replace(/```json\s*/, '').replace(/\s*```$/, '');
                  
                  console.log('🔍 Raw JSON string detected:', jsonStr.substring(0, 200) + '...');
                  
                  // Try to fix common JSON issues before parsing
                  let cleanedJsonStr = jsonStr
                    .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
                    .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
                    .replace(/,\s*,/g, ',')  // Remove double commas
                    .replace(/\n\s*/g, ' ') // Remove newlines and extra spaces
                    .replace(/\r/g, '')     // Remove carriage returns
                    .replace(/,\s*([}\]])/g, '$1')  // Remove trailing commas before closing brackets
                    .replace(/([{\[])\s*,/g, '$1')  // Remove leading commas after opening brackets
                    .replace(/,\s*$/g, '')  // Remove trailing comma at end
                    .replace(/^\s*,/g, '')  // Remove leading comma at start
                    .trim();
                  
                  // Try to fix common incomplete JSON issues
                  if (!cleanedJsonStr.endsWith('}') && !cleanedJsonStr.endsWith(']')) {
                    // Count braces and brackets to see what's missing
                    const openBraces = (cleanedJsonStr.match(/\{/g) || []).length;
                    let closeBraces = (cleanedJsonStr.match(/\}/g) || []).length;
                    const openBrackets = (cleanedJsonStr.match(/\[/g) || []).length;
                    let closeBrackets = (cleanedJsonStr.match(/\]/g) || []).length;
                    
                    // Add missing closing braces/brackets
                    while (closeBrackets < openBrackets) {
                      cleanedJsonStr += ']';
                      closeBrackets++;
                    }
                    while (closeBraces < openBraces) {
                      cleanedJsonStr += '}';
                      closeBraces++;
                    }
                  }
                  
                  console.log('🧹 Cleaned JSON string:', cleanedJsonStr.substring(0, 200) + '...');
                  
                  const artifactData = JSON.parse(cleanedJsonStr);
                  
                  // Handle different JSON formats
                  let processedArtifactData = artifactData;
                  
                  // If the JSON is in the old format (direct mindmap data), wrap it properly
                  if (!artifactData.type && !artifactData.data && artifactData.id && artifactData.title) {
                    console.log('🔄 Converting old format JSON to new format');
                    processedArtifactData = {
                      type: 'mindmap',
                      title: artifactData.title,
                      data: artifactData
                    };
                  } else if (artifactData.type === 'mindmap' && !artifactData.data && artifactData.id) {
                    // If it has type but no data field, wrap the content in data
                    console.log('🔄 Wrapping mindmap content in data field');
                    processedArtifactData = {
                      type: 'mindmap',
                      title: artifactData.title,
                      data: {
                        id: artifactData.id,
                        title: artifactData.title,
                        description: artifactData.description,
                        level: artifactData.level,
                        difficulty: artifactData.difficulty,
                        estimatedHours: artifactData.estimatedHours,
                        skills: artifactData.skills,
                        children: artifactData.children
                      }
                    };
                  } else {
                    // Add type and title if not present
                    if (!artifactData.type) {
                      processedArtifactData.type = 'mindmap';
                    }
                    if (!artifactData.title && artifactData.data?.title) {
                      processedArtifactData.title = artifactData.data.title;
                    }
                  }
                  
                  console.log('🎯 Detected JSON artifact:', processedArtifactData);
                  
                  // Update conversation context when mindmap is detected
                  if (processedArtifactData.type === 'mindmap') {
                    try {
                      chatStore.updateConversationContext({
                        currentMindmap: processedArtifactData.data,
                        conversationPhase: 'creation',
                        hasActiveProject: true,
                        lastAction: 'mindmap_created_via_streaming',
                      });
                      console.log('🔄 Updated conversation context for new mindmap');
                    } catch (contextError) {
                      console.error('❌ Failed to update conversation context:', contextError);
                    }
                  }
                  
                  // Send artifact data
                  const artifactDataMsg = JSON.stringify({ artifact: processedArtifactData });
                  controller.enqueue(new TextEncoder().encode(`data: ${artifactDataMsg}\n\n`));
                } catch (e) {
                  console.error('❌ Failed to parse JSON artifact:', e);
                  console.error('🔍 Problematic JSON string:', jsonStr);
                  console.error('🧹 Cleaned JSON string:', cleanedJsonStr);
                  console.error('📍 Error position:', e instanceof Error ? e.message : 'Unknown error');
                  
                  // Try to extract just the basic structure for debugging
                  try {
                    const basicMatch = jsonStr.match(/\{[^{}]*"id"[^{}]*"title"[^{}]*\}/);
                    if (basicMatch) {
                      console.log('🔍 Found basic structure:', basicMatch[0]);
                    }
                  } catch (debugError) {
                    console.error('🔍 Debug extraction failed:', debugError);
                  }
                  
                  // Try to send a partial artifact if we have some valid structure
                  try {
                    const partialData = {
                      type: 'mindmap',
                      title: 'Partial Learning Path',
                      data: {
                        id: 'partial',
                        title: 'Learning Path (Partial)',
                        description: 'This is a partial response - the complete structure is still being generated',
                        children: [],
                        error: 'JSON parsing failed - structure may be incomplete'
                      }
                    };
                    
                    const partialArtifactMsg = JSON.stringify({ artifact: partialData });
                    controller.enqueue(new TextEncoder().encode(`data: ${partialArtifactMsg}\n\n`));
                  } catch (partialError) {
                    console.error('❌ Failed to send partial artifact:', partialError);
                  }
                  
                  // Invalid JSON, continue streaming
                }
              }
            }
            
            if (chunk.type === 'message_stop') {
              // Now that streaming is complete, try to process any JSON that might be in the full message
              console.log('🏁 Streaming complete, processing final message for JSON artifacts');
              
              // Check for complete JSON in the full message
              let finalJsonMatches = null;
              
              if (fullMessage.includes('```json') && fullMessage.includes('```')) {
                const jsonBlockMatch = fullMessage.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonBlockMatch) {
                  const jsonContent = jsonBlockMatch[1];
                  if (isBalancedJSON(jsonContent)) {
                    finalJsonMatches = [jsonBlockMatch[0]];
                    console.log('🎯 Found complete JSON artifact in final message');
                  }
                }
              }
              
              // If no complete JSON block, try without json tag
              if (!finalJsonMatches && fullMessage.includes('```')) {
                const codeBlockMatch = fullMessage.match(/```\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch) {
                  const blockContent = codeBlockMatch[1];
                  if (blockContent.includes('"id"') && blockContent.includes('"title"') && isBalancedJSON(blockContent)) {
                    finalJsonMatches = [codeBlockMatch[0]];
                    console.log('🎯 Found complete JSON artifact in code block');
                  }
                }
              }
              
              // If still no matches, try to extract raw JSON from the end
              if (!finalJsonMatches && looksLikeJSON(fullMessage)) {
                const jsonStart = fullMessage.lastIndexOf('{');
                if (jsonStart !== -1) {
                  const potentialJson = fullMessage.substring(jsonStart);
                  if (isBalancedJSON(potentialJson) && potentialJson.includes('"id"') && potentialJson.includes('"title"')) {
                    finalJsonMatches = [potentialJson];
                    console.log('🎯 Found raw JSON artifact in final message');
                  }
                }
              }
              
              // If we found complete JSON, process it now
              if (finalJsonMatches) {
                try {
                  const lastMatch = finalJsonMatches[finalJsonMatches.length - 1];
                  const jsonStr = lastMatch.replace(/```json\s*/, '').replace(/\s*```$/, '');
                  
                  console.log('🔍 Processing final JSON artifact:', jsonStr.substring(0, 200) + '...');
                  
                  // Clean and parse the JSON
                  let cleanedJsonStr = jsonStr
                    .replace(/,\s*}/g, '}')
                    .replace(/,\s*]/g, ']')
                    .replace(/,\s*,/g, ',')
                    .replace(/\n\s*/g, ' ')
                    .replace(/\r/g, '')
                    .replace(/,\s*([}\]])/g, '$1')
                    .replace(/([{\[])\s*,/g, '$1')
                    .trim();
                  
                  const artifactData = JSON.parse(cleanedJsonStr);
                  
                  // Process the artifact data
                  let processedArtifactData = artifactData;
                  if (!artifactData.type && !artifactData.data && artifactData.id && artifactData.title) {
                    processedArtifactData = {
                      type: 'mindmap',
                      title: artifactData.title,
                      data: artifactData
                    };
                  }
                  
                  console.log('✅ Final JSON artifact processed:', processedArtifactData );
                  
                  // Update conversation context when final mindmap is processed
                  if (processedArtifactData.type === 'mindmap') {
                    try {
                      chatStore.updateConversationContext({
                        currentMindmap: processedArtifactData.data,
                        conversationPhase: 'creation',
                        hasActiveProject: true,
                        lastAction: 'mindmap_created_via_final',
                      });
                      console.log('🔄 Updated conversation context for final mindmap');
                    } catch (contextError) {
                      console.error('❌ Failed to update conversation context:', contextError);
                    }
                  }
                  
                  // Send the final artifact data
                  const artifactDataMsg = JSON.stringify({ artifact: processedArtifactData });
                  controller.enqueue(new TextEncoder().encode(`data: ${artifactDataMsg}\n\n`));
                  
                } catch (e) {
                  console.error('❌ Failed to process final JSON artifact:', e);
                }
              }
              
              // Save AI response to database
              try {
                await ConversationStore.addMessage({
                  conversation_id: conversationId,
                  role: 'assistant',
                  content: fullMessage,
                });
                
                // Update conversation title if this is the first AI response
                if (conversationHistory.length === 1) { // Only user message so far
                  const title = ConversationStore.generateTitle(body.message);
                  await ConversationStore.updateConversationTitle(conversationId, title);
                }
              } catch (error) {
                console.error('Failed to save AI response:', error);
              }

              // Handle tool execution if routing indicated tools should be used
              if (routeResult.shouldUseTools) {
                try {
                  console.log('🔧 Checking for editing commands in response...');
                  
                  // Import the AI prompt parser for tool execution
                  const { aiPromptParser } = await import('@/lib/ai-prompt-parser');
                  
                  // Check if the response contains editing commands
                  const hasEditingCommands = /(?:change|edit|update|modify|add|remove|delete|move|duplicate|merge)/i.test(fullMessage);
                  
                  if (hasEditingCommands) {
                    console.log('🔧 Editing commands detected, executing with AI prompt parser...');
                    
                    // Try to parse and execute the command
                    const commandResult = await aiPromptParser.parseAndExecute(fullMessage);
                    
                    if (commandResult.success) {
                      console.log('✅ Command executed successfully:', commandResult.action);
                      
                      // Update conversation context based on what happened
                      chatStore.updateContextForEditing(commandResult.action, context.currentMindmap);
                      
                      // Send success notification
                      const successData = JSON.stringify({ 
                        toolExecution: { 
                          success: true, 
                          action: commandResult.action,
                          message: commandResult.message 
                        } 
                      });
                      controller.enqueue(new TextEncoder().encode(`data: ${successData}\n\n`));
                    } else {
                      console.log('❌ Command execution failed:', commandResult.message);
                      
                      // Send failure notification
                      const failureData = JSON.stringify({ 
                        toolExecution: { 
                          success: false, 
                          action: 'unknown',
                          message: commandResult.message 
                        } 
                      });
                      controller.enqueue(new TextEncoder().encode(`data: ${failureData}\n\n`));
                    }
                  } else {
                    console.log('🔧 No editing commands detected in response');
                  }
                } catch (toolError) {
                  console.error('❌ Tool execution error:', toolError);
                  
                  // Send error notification
                  const errorData = JSON.stringify({ 
                    toolExecution: { 
                      success: false, 
                      action: 'error',
                      message: 'Failed to execute editing commands' 
                    } 
                  });
                  controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
                }
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