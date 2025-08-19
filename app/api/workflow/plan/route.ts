import { NextRequest } from 'next/server';
import { multiToolExecutor, WorkflowType } from '@/lib/multi-tool-executor';

export async function POST(request: NextRequest) {
  try {
    const { userRequest, workflowType = 'custom' } = await request.json();
    
    if (!userRequest) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'userRequest is required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (!['discovery', 'creation', 'debugging', 'enhancement', 'custom'].includes(workflowType)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'workflowType must be one of: discovery, creation, debugging, enhancement, custom' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Plan the workflow
    const plan = await multiToolExecutor.planWorkflow(userRequest, workflowType as WorkflowType);
    
    return new Response(JSON.stringify({
      success: true,
      plan
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error planning workflow:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Failed to plan workflow: ${error}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
