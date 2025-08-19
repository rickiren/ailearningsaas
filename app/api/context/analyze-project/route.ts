import { NextRequest } from 'next/server';
import { contextAwarenessServer } from '@/lib/context-awareness-server';

export async function GET(request: NextRequest) {
  try {
    // Analyze the project
    const context = await contextAwarenessServer.analyzeProject();
    
    return new Response(JSON.stringify({
      success: true,
      context
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error analyzing project:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Failed to analyze project: ${error}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
