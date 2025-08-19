import { NextRequest } from 'next/server';
import { contextAwarenessServer } from '@/lib/context-awareness-server';

export async function POST(request: NextRequest) {
  try {
    const { filePaths } = await request.json();
    
    if (!filePaths || !Array.isArray(filePaths)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'filePaths array is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Read multiple files
    const results = await contextAwarenessServer.readMultipleFiles(filePaths);
    
    return new Response(JSON.stringify({
      success: true,
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error reading multiple files:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Failed to read files: ${error}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
