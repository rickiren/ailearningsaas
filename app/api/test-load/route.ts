import { NextResponse } from 'next/server';
import { MindmapStore } from '@/lib/mindmap-store';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Get the most recent project (the one we just created)
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (projectsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get projects',
        details: projectsError
      }, { status: 500 });
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No projects found'
      }, { status: 404 });
    }

    const project = projects[0];
    console.log('🧪 Loading project:', project.id);

    // Load the mindmap data
    const mindmapData = await MindmapStore.loadMindmap(project.id);

    if (!mindmapData) {
      return NextResponse.json({
        success: false,
        error: 'Failed to load mindmap data'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Mindmap loaded successfully',
      project: project,
      mindmapData: mindmapData
    });

  } catch (error) {
    console.error('❌ Test load failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Test load failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
