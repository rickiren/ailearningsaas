import { NextRequest } from 'next/server';
import { IntelligentSystemPrompt } from '@/lib/intelligent-system-prompt';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'sessionId is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Generate the intelligent system prompt
    const systemPrompt = new IntelligentSystemPrompt(sessionId);
    const prompt = await systemPrompt.generateSystemPrompt();
    
    return new Response(JSON.stringify({
      success: true,
      systemPrompt: prompt
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating system prompt:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Failed to generate system prompt: ${error}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
