import { NextRequest } from 'next/server';
import { multiToolExecutor } from '@/lib/multi-tool-executor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('id');
    
    if (workflowId) {
      // Get specific workflow
      const workflow = multiToolExecutor.getWorkflowById(workflowId);
      
      if (!workflow) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Workflow not found' 
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        workflow
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Get all workflows
      const activeWorkflows = multiToolExecutor.getActiveWorkflows();
      const workflowHistory = multiToolExecutor.getWorkflowHistory();
      
      return new Response(JSON.stringify({
        success: true,
        activeWorkflows,
        workflowHistory
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error getting workflow status:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Failed to get workflow status: ${error}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
