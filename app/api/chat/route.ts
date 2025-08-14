import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { ChatRequest } from '@/types/chat';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are an AI assistant helping creators build interactive learning paths. 

When a user describes a skill they want to teach, you must provide:
1. A conversational explanation of the learning path
2. A structured JSON mindmap for visualization

RESPONSE FORMAT:
- First, provide a helpful conversational response explaining the learning path
- Then, ALWAYS include a JSON mindmap wrapped in \`\`\`json code blocks
- The JSON must have "type": "mindmap" at the root level

Example response structure:
"I'll help you create a comprehensive learning path for [skill]. This skill requires [explanation of approach and key concepts].

Here's the structured learning path:

\`\`\`json
{
  "type": "mindmap",
  "title": "[Skill] Learning Path", 
  "data": {
    "id": "root",
    "title": "[Main Skill]",
    "description": "Brief description",
    "level": 0,
    "difficulty": "beginner|intermediate|advanced",
    "estimatedHours": 50,
    "skills": ["skill1", "skill2"],
    "children": [...]
  }
}
\`\`\`"

CRITICAL RULES:
- ALWAYS include both conversational text AND JSON
- JSON must be wrapped in \`\`\`json code blocks
- JSON must include "type": "mindmap"
- Create realistic learning progressions with 3-5 main modules
- Include estimated hours and difficulty levels
- Make the conversational part engaging and informative
- Ensure JSON structure is complete and valid for visualization`;

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

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const stream = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                content: body.message,
              },
            ],
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