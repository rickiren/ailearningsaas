import { NextRequest } from 'next/server';
import { multiToolExecutor, WorkflowExecutionOptions } from '@/lib/multi-tool-executor';

export async function POST(request: NextRequest) {
  try {
    const { plan, options = {} } = await request.json();
    
    if (!plan) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'plan is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Execute the workflow
    const result = await multiToolExecutor.executeWorkflow(plan, options as WorkflowExecutionOptions);
    
    return new Response(JSON.stringify({
      success: true,
      result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Failed to execute workflow: ${error}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
