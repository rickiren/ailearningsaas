import { NextRequest } from 'next/server';
import { contextAwarenessServer } from '@/lib/context-awareness-server';

export async function POST(request: NextRequest) {
  try {
    const { fileType, name } = await request.json();
    
    if (!fileType || !name) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'fileType and name are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (!['component', 'page', 'utility'].includes(fileType)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'fileType must be one of: component, page, utility' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get context-aware suggestions
    const suggestions = await contextAwarenessServer.getContextAwareSuggestions(fileType, name);
    
    return new Response(JSON.stringify({
      success: true,
      fileType,
      name,
      suggestions
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Failed to get suggestions: ${error}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
