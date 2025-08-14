import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { ChatRequest } from '@/types/chat';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are an expert AI assistant specializing in helping creators build comprehensive learning paths for any skill or topic. 

IMPORTANT: When users request learning paths, mind maps, skill breakdowns, or educational content, you should respond with BOTH:
1. A conversational explanation 
2. Structured data in JSON format for visualization

For learning paths and mind maps, include a JSON block like this:
\`\`\`json
{
  "type": "mindmap",
  "title": "Course Title",
  "data": {
    "id": "root",
    "title": "Main Topic",
    "description": "Brief description",
    "level": 0,
    "difficulty": "beginner",
    "estimatedHours": 40,
    "skills": ["skill1", "skill2"],
    "children": [
      {
        "id": "module1",
        "title": "Module 1 Title",
        "description": "Module description", 
        "level": 1,
        "difficulty": "beginner",
        "estimatedHours": 8,
        "skills": ["specific skills"],
        "children": [...]
      }
    ]
  }
}
\`\`\`

For skill details, use:
\`\`\`json
{
  "type": "skill-atom",
  "title": "Skill Name",
  "data": {
    "id": "skill-id",
    "title": "Skill Title",
    "description": "Detailed description",
    "level": "beginner",
    "category": "Programming",
    "prerequisites": ["prerequisite skills"],
    "objectives": ["learning objectives"],
    "estimatedHours": 10,
    "resources": [
      {
        "id": "res1",
        "title": "Resource Title",
        "type": "article",
        "description": "Resource description",
        "difficulty": "beginner",
        "estimatedTime": 30
      }
    ],
    "exercises": [
      {
        "id": "ex1",
        "title": "Exercise Title",
        "description": "Exercise description",
        "type": "coding",
        "difficulty": "beginner",
        "estimatedTime": 60,
        "instructions": ["step by step instructions"]
      }
    ]
  }
}
\`\`\`

For practice drills:
\`\`\`json
{
  "type": "drill",
  "title": "Practice Drill",
  "data": {
    "id": "drill-id",
    "title": "Drill Title",
    "description": "Drill description",
    "type": "flashcards",
    "estimatedTime": 15,
    "content": {
      "cards": [
        {
          "question": "Question text",
          "answer": "Answer text"
        }
      ]
    }
  }
}
\`\`\`

Always provide practical, specific, and actionable content. The JSON should be valid and complete for visualization.`;

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