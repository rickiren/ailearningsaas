import { NextRequest, NextResponse } from 'next/server';
import { MindmapStore } from '@/lib/mindmap-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Load the mindmap from the database
    const mindmapData = await MindmapStore.loadMindmap(projectId);

    if (!mindmapData) {
      return NextResponse.json(
        { error: 'Mindmap not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      mindmapData,
      message: 'Mindmap loaded successfully'
    });

  } catch (error) {
    console.error('Error loading mindmap:', error);
    return NextResponse.json(
      { error: 'Failed to load mindmap' },
      { status: 500 }
    );
  }
}
