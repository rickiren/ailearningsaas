import { NextRequest } from 'next/server';
import { multiToolExecutor } from '@/lib/multi-tool-executor';

export async function POST(request: NextRequest) {
  try {
    const { action, workflowId } = await request.json();
    
    if (!action || !workflowId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'action and workflowId are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (!['pause', 'resume', 'cancel'].includes(action)) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'action must be one of: pause, resume, cancel' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    let success = false;
    let message = '';
    
    switch (action) {
      case 'pause':
        success = multiToolExecutor.pauseWorkflow(workflowId);
        message = success ? 'Workflow paused successfully' : 'Failed to pause workflow';
        break;
      case 'resume':
        success = multiToolExecutor.resumeWorkflow(workflowId);
        message = success ? 'Workflow resumed successfully' : 'Failed to resume workflow';
        break;
      case 'cancel':
        success = multiToolExecutor.cancelWorkflow(workflowId);
        message = success ? 'Workflow cancelled successfully' : 'Failed to cancel workflow';
        break;
    }
    
    return new Response(JSON.stringify({
      success,
      message,
      action,
      workflowId
    }), {
      status: success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error controlling workflow:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: `Failed to control workflow: ${error}` 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
