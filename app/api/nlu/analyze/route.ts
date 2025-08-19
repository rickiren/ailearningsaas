import { NextRequest } from 'next/server';
import { naturalLanguageUnderstanding } from '@/lib/natural-language-understanding';

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
    
    // Analyze the user request
    const intent = await naturalLanguageUnderstanding.analyzeRequest(userRequest, sessionId);
    
    // Generate response pattern
    const responsePattern = await naturalLanguageUnderstanding.generateResponsePattern(
      intent, 
      userRequest, 
      sessionId
    );
    
    // Generate clarifying questions
    const clarificationQuestions = naturalLanguageUnderstanding.generateClarifyingQuestions(intent, userRequest);
    
    return new Response(JSON.stringify({
      success: true,
      intent,
      responsePattern,
      clarificationQuestions,
      requiresClarification: clarificationQuestions.some(q => q.required)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error analyzing request:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Failed to analyze request: ${error}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
