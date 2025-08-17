import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { ConversationStore } from '@/lib/conversation-store';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const DRILL_SYSTEM_PROMPT = `ARTIFACT CREATION AND EDITING SYSTEM PROMPT:

You are a drill creation and editing specialist. You can create new interactive learning exercises OR modify existing ones based on user requests.

ARTIFACT TYPES:
- HTML/CSS/JS: For web-based interactive drills
- React Components: For complex interactive elements

CREATION RULES:
1. **Always create complete, working code** - no placeholders or incomplete sections
2. **Make it immediately functional** - users should be able to interact right away
3. **Include clear instructions** - explain how students should use the drill
4. **Add interactive feedback** - show results, scores, or validation immediately
5. **Focus on learning objectives** - every element should teach or reinforce a skill

EDITING RULES:
1. **Understand existing code structure** - analyze the current drill before making changes
2. **Make targeted modifications** - only change what's requested, preserve working functionality
3. **Maintain code quality** - ensure syntax is correct and functionality is preserved
4. **Provide clear explanations** - explain what changes were made and why
5. **Iterative improvement** - build upon previous versions, don't start from scratch

EXAMPLE PATTERNS:
- Code practice: Interactive code editor with instant feedback
- Concept drills: Drag-and-drop, multiple choice with explanations
- Simulations: Working models of real-world scenarios
- Tools: Calculators, generators, or utilities for practice

HTML ARTIFACT STRUCTURE:
\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <title>Drill Title</title>
    <style>
        /* Complete styling here */
    </style>
</head>
<body>
    <div class="drill-container">
        <!-- Complete interactive content -->
    </div>
    <script>
        // Complete functionality here
    </script>
</body>
</html>
\`\`\`

EDITING INSTRUCTIONS:
When editing existing code:
1. First analyze the current code structure
2. Identify what needs to be changed
3. Make minimal, targeted modifications
4. Ensure the result is still functional
5. Explain what was changed

IMPORTANT: Always generate complete, working code artifacts that can be immediately rendered and tested. When editing, preserve as much existing functionality as possible while making the requested changes.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
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
      // Create new conversation for drill chat
      const conversation = await ConversationStore.createConversation('Drill Creation Session');
      conversationId = conversation.id;
      
      // Update metadata to mark as drill chat
      await ConversationStore.updateConversationMetadata(conversationId, { 
        type: 'drill_chat',
        drillId: body.drillId 
      });
    }

    // Store user message
    await ConversationStore.addMessage({
      conversation_id: conversationId,
      role: 'user',
      content: body.message,
      metadata: {
        drillId: body.drillId,
        type: 'drill_chat',
      },
    });

    // Get current drill code if editing an existing drill
    let currentDrillCode = '';
    let drillContext = '';
    
    if (body.drillId && body.currentCode) {
      currentDrillCode = body.currentCode;
      drillContext = `\n\nCURRENT DRILL CODE TO EDIT:\n\`\`\`${body.language || 'html'}\n${currentDrillCode}\n\`\`\`\n\nPlease analyze this existing code and make the requested modifications while preserving functionality.`;
    }

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const stream = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            system: DRILL_SYSTEM_PROMPT + drillContext,
            messages: [
              {
                role: 'user' as const,
                content: body.message,
              }
            ],
            stream: true,
          });

          let fullMessage = '';
          let lastArtifactCheck = '';
          
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const textChunk = chunk.delta.text;
              fullMessage += textChunk;
              
              // Send the text chunk immediately for real-time streaming
              const data = JSON.stringify({ content: textChunk });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
              
              // Check for artifacts more frequently but avoid duplicate processing
              const currentText = fullMessage.slice(-200); // Check last 200 characters
              if (currentText !== lastArtifactCheck) {
                lastArtifactCheck = currentText;
                
                // Look for complete code blocks
                const artifactMatches = fullMessage.match(/```(html|jsx|javascript)\s*([\s\S]*?)```/g);
                if (artifactMatches) {
                  for (const match of artifactMatches) {
                    const [, language, code] = match.match(/```(\w+)\s*([\s\S]*?)```/) || [];
                    
                    if (language && code && code.trim().length > 10) { // Ensure code is substantial
                      // Send artifact to frontend
                      const artifactData = JSON.stringify({ 
                        type: 'artifact',
                        language: language,
                        code: code.trim(),
                        timestamp: Date.now()
                      });
                      controller.enqueue(new TextEncoder().encode(`data: ${artifactData}\n\n`));
                    }
                  }
                }
              }
            }
            
            if (chunk.type === 'message_stop') {
              // Final artifact check after streaming is complete
              const finalArtifactMatches = fullMessage.match(/```(html|jsx|javascript)\s*([\s\S]*?)```/g);
              if (finalArtifactMatches) {
                for (const match of finalArtifactMatches) {
                  const [, language, code] = match.match(/```(\w+)\s*([\s\S]*?)```/) || [];
                  
                  if (language && code && code.trim().length > 10) {
                    const artifactData = JSON.stringify({ 
                      type: 'artifact',
                      language: language,
                      code: code.trim(),
                      timestamp: Date.now()
                    });
                    controller.enqueue(new TextEncoder().encode(`data: ${artifactData}\n\n`));
                  }
                }
              }
              
              // Store the complete AI response message
              try {
                await ConversationStore.addMessage({
                  conversation_id: conversationId,
                  role: 'assistant',
                  content: fullMessage,
                  metadata: {
                    drillId: body.drillId,
                    type: 'drill_chat',
                  },
                });
              } catch (error) {
                console.error('Failed to store AI message:', error);
              }
              
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              controller.close();
              break;
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
