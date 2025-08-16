import { NextRequest, NextResponse } from 'next/server';
import { MindmapStore } from '@/lib/mindmap-store';
import { MindMapNode } from '@/types/artifacts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mindmapData, title, description, userId } = body;

    if (!mindmapData || !title) {
      return NextResponse.json(
        { error: 'Mindmap data and title are required' },
        { status: 400 }
      );
    }

    // Validate that the data is a valid MindMapNode
    if (!mindmapData.id || !mindmapData.title) {
      return NextResponse.json(
        { error: 'Invalid mindmap data structure' },
        { status: 400 }
      );
    }

    // Save the mindmap to the database
    const result = await MindmapStore.saveMindmap(
      mindmapData as MindMapNode,
      title,
      description,
      userId
    );

    return NextResponse.json({
      success: true,
      projectId: result.projectId,
      skillAtomIds: result.skillAtomIds,
      message: 'Mindmap saved successfully'
    });

  } catch (error) {
    console.error('Error saving mindmap:', error);
    return NextResponse.json(
      { error: 'Failed to save mindmap' },
      { status: 500 }
    );
  }
}
