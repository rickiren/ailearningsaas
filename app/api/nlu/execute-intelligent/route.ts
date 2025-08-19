import { NextRequest } from 'next/server';
import { IntelligentSystemPrompt } from '@/lib/intelligent-system-prompt';

export async function POST(request: NextRequest) {
  try {
    const { userRequest, sessionId } = await request.json();
    
    if (!userRequest) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'userRequest is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (!sessionId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'sessionId is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Execute the intelligent workflow
    const systemPrompt = new IntelligentSystemPrompt(sessionId);
    const result = await systemPrompt.executeIntelligentWorkflow(userRequest);
    
    return new Response(JSON.stringify({
      success: true,
      ...result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error executing intelligent workflow:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Failed to execute intelligent workflow: ${error}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
