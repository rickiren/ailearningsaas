import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { ChatService } from '@/lib/chat-service';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationId, artifactId, currentCode, userId } = body;

    if (!message || !conversationId || !currentCode) {
      return NextResponse.json(
        { error: 'Missing required fields: message, conversationId, currentCode' },
        { status: 400 }
      );
    }

    console.log('Edit request:', { message, artifactId, codeLength: currentCode.length });

    // Add user message to conversation
    await ChatService.addMessage(conversationId, {
      role: 'user',
      content: message,
      metadata: {
        type: 'edit_request',
        artifact_id: artifactId,
        timestamp: new Date().toISOString()
      }
    });

    // Create AI prompt for editing existing code
    const editPrompt = `You are editing an existing artifact. The user wants to modify it.

CURRENT CODE:
${currentCode}

USER REQUEST: "${message}"

IMPORTANT INSTRUCTIONS:
1. Modify ONLY what the user requested - preserve everything else
2. If it's HTML, return complete HTML with all existing content modified appropriately
3. If it's React/component code, return the complete component with modifications
4. Keep all existing functionality and styling unless specifically asked to change it
5. Make minimal, precise changes based on the user's request
6. Return ONLY the edited code - no explanations, no markdown formatting
7. Ensure the code is complete and functional

Return the complete, edited code:`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: 'You are a code editor. Return only the complete, edited code without any explanations or formatting.',
      messages: [
        {
          role: 'user',
          content: editPrompt
        }
      ]
    });

    const editedCode = response.content[0].type === 'text' ? response.content[0].text : currentCode;
    
    console.log('AI edit response length:', editedCode.length);

    // Add AI response to conversation
    await ChatService.addMessage(conversationId, {
      role: 'assistant',
      content: `I've updated the code based on your request: "${message}"`,
      metadata: {
        type: 'edit_response',
        artifact_modified: true,
        timestamp: new Date().toISOString()
      }
    });

    // Return the edited code without creating new artifacts
    return NextResponse.json({
      success: true,
      response: `I've updated the code based on your request: "${message}"`,
      editedCode: editedCode.trim(),
      conversationId: conversationId,
      // No new artifacts - we're editing the existing one
      artifacts: []
    });

  } catch (error) {
    console.error('Error editing artifact:', error);
    return NextResponse.json(
      { error: 'Failed to edit artifact' },
      { status: 500 }
    );
  }
}
