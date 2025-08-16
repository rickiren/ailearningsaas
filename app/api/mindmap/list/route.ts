import { NextRequest, NextResponse } from 'next/server';
import { MindmapStore } from '@/lib/mindmap-store';

export async function GET() {
  try {
    // Get all mindmaps
    const mindmaps = await MindmapStore.getUserMindmaps();

    return NextResponse.json({
      success: true,
      mindmaps,
      count: mindmaps.length,
      message: 'Mindmaps retrieved successfully'
    });

  } catch (error) {
    console.error('Error listing mindmaps:', error);
    return NextResponse.json(
      { error: 'Failed to list mindmaps' },
      { status: 500 }
    );
  }
}
