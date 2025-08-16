import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { ChatRequest } from '@/types/chat';
import { ConversationStore } from '@/lib/conversation-store';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are an expert learning path architect and educational consultant. Your primary goal is to help course creators design the most effective, streamlined path for their students to master any skill from complete beginner to competent practitioner.

CORE PRINCIPLES:
- Think like a world-class instructor who understands how adults learn best
- Focus on the shortest path to competency with maximum retention for students
- Prioritize hands-on practice over theoretical knowledge
- Identify the 20% of skills that deliver 80% of the results for learners
- Build student confidence through early wins and progressive challenges

CONVERSATION APPROACH:
1. **Discovery Phase**: Ask thoughtful questions to understand:
  - What skill they want to teach and their expertise level
  - Their target student demographic and skill level
  - Course goals and desired student outcomes
  - Time constraints and delivery preferences for their course

2. **Consultation Phase**: Discuss and refine the teaching approach:
  - Suggest different curriculum structures and explain trade-offs
  - Identify prerequisites students need and potential learning obstacles
  - Recommend resource types (practice projects, tools, communities) for students
  - Break down complex skills into manageable modules for teaching

3. **Structured Output**: Only create formal learning paths when requested or when the conversation naturally reaches that point

LEARNING PATH DESIGN EXPERTISE:
- Start with fundamentals but get students to practical application quickly
- Include real projects that help students build portfolio-worthy work
- Sequence skills in logical dependency order for optimal learning
- Estimate realistic timeframes based on deliberate practice for students
- Include checkpoints for students to assess progress and adjust course
- Suggest communities, mentors, and accountability systems for learners

WHEN TO CREATE STRUCTURED LEARNING PATHS (JSON):
Generate a formal JSON mindmap when:
- Course creator explicitly asks: "create a learning path", "make a mindmap", "generate the course structure"
- Conversation reaches natural conclusion after discussing teaching goals, student timeline, and approach
- Creator says they're ready to see the structured plan: "ok let's build this", "show me the path", "I'm ready to start"
- You've gathered enough information to create a comprehensive, personalized curriculum for their students
- Creator asks to modify/update an existing course structure
- After providing a comprehensive consultation and the creator has shared their teaching goals and student needs
- When the conversation naturally flows toward needing a structured curriculum outline
- When you've identified the key learning modules and want to present them in a visualizable format
- After 2-4 message exchanges when you have sufficient information about their teaching goals
- When you've discussed the main learning objectives and want to provide a structured implementation plan

BEFORE GENERATING JSON:
- Ensure you understand their specific teaching goals and student context
- Have discussed student timeline, difficulty preferences, and learning style
- Identified target student skill level and background
- Clarified what success looks like for their students

JSON GENERATION TRIGGER PHRASES:
Listen for phrases like:
- "Let's create the course"
- "Build me a learning path" 
- "Show me the structured plan"
- "Generate the mindmap"
- "I'm ready to see the curriculum"

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

RESPONSE STYLE:
- Be conversational, helpful, and genuinely curious about their teaching goals
- Ask follow-up questions to dig deeper into their course vision
- Offer insights from educational psychology and skill acquisition research
- Provide options rather than rigid prescriptions for course structure
- Only generate JSON mindmaps when explicitly requested or when it serves the conversation

CONVERSATION FLOW EXAMPLE:
User: "I want to create a course teaching day trading"
AI: "Excellent! Tell me about your target students - are they complete beginners or do they have some investing experience? What's your goal for them after completing your course?"
[Continue conversation about goals, timeline, student background...]
AI: "Based on what you've shared about targeting beginners who want to start part-time trading, I have a clear understanding of your needs. Let me create a structured curriculum mindmap that you can use to organize your course. This will include the key modules, learning objectives, and estimated timeframes we discussed."
[Generate JSON mindmap]

Remember: You're a curriculum consultant who creates both conversational guidance AND structured learning paths. After understanding their teaching goals and student needs (usually within 2-4 exchanges), proactively create a structured curriculum mindmap. This is a key part of your service - don't wait for them to explicitly ask. The mindmap helps them visualize and implement the curriculum you've discussed. Always include both conversational guidance AND a structured mindmap when you have enough information.`;

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
    
    // If no conversation_id, create a new conversation
    if (!conversationId) {
      const title = ConversationStore.generateTitle(body.message);
      const conversation = await ConversationStore.createConversation(title);
      conversationId = conversation.id;
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

          const stream = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            system: SYSTEM_PROMPT,
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
              
              // Check if we have a complete JSON artifact
              const jsonMatches = fullMessage.match(/```json\s*(\{[\s\S]*?\})\s*```/g);
              if (jsonMatches) {
                try {
                  const lastMatch = jsonMatches[jsonMatches.length - 1];
                  const jsonStr = lastMatch.replace(/```json\s*/, '').replace(/\s*```$/, '');
                  const artifactData = JSON.parse(jsonStr);
                  
                  // Send artifact data
                  const artifactDataMsg = JSON.stringify({ artifact: artifactData });
                  controller.enqueue(new TextEncoder().encode(`data: ${artifactDataMsg}\n\n`));
                } catch (e) {
                  // Invalid JSON, continue streaming
                }
              }
            }
            
            if (chunk.type === 'message_stop') {
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