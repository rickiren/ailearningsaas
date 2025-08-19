import { NextRequest } from 'next/server';
import { contextAwarenessServer } from '@/lib/context-awareness-server';

export async function POST(request: NextRequest) {
  try {
    const { targetFile, criteria } = await request.json();
    
    if (!targetFile || !criteria) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'targetFile and criteria are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (!['content', 'purpose', 'name'].includes(criteria)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'criteria must be one of: content, purpose, name' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Find similar files
    const similarFiles = await contextAwarenessServer.findSimilarFiles(targetFile, criteria);
    
    return new Response(JSON.stringify({
      success: true,
      targetFile,
      criteria,
      similarFiles
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error finding similar files:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Failed to find similar files: ${error}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
