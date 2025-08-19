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
    
    // Execute the complex request autonomously
    const { plan, result, summary } = await multiToolExecutor.executeComplexRequest(
      userRequest, 
      workflowType as WorkflowType
    );
    
    return new Response(JSON.stringify({
      success: true,
      plan,
      result,
      summary
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error executing complex request:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Failed to execute complex request: ${error}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
